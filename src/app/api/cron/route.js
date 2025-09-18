import { MongoClient, ObjectId } from "mongodb";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize clients
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const mongoClient = new MongoClient(process.env.MONGODB_URI);

export async function POST(req) {
  console.log("CRON job function started...");

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("Unauthorized attempt to run CRON job.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Authorization successful.");

  try {
    await mongoClient.connect();

    // ✅ Replace this with your actual DB name
    const db = mongoClient.db("your-real-db-name");

    // ✅ Collection must match the one used in create-block route
    const quietBlockJobs = db.collection("quietBlockJobs");

    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    console.log(`Searching for quiet block jobs between ${now.toISOString()} and ${tenMinutesLater.toISOString()} (UTC)`);

    const query = {
      emailSent: false,
      startTime: {
        $gte: now,
        $lte: tenMinutesLater,
      },
    };

    console.log("MongoDB Query:", JSON.stringify(query, null, 2));

    const upcomingJobs = await quietBlockJobs.find(query).toArray();

    console.log(`Found ${upcomingJobs.length} quiet block jobs to notify.`);

    for (const job of upcomingJobs) {
      console.log(`Processing job ID: ${job._id} for user ID: ${job.userId}`);

      const { data, error } = await supabase.auth.admin.getUserById(job.userId);
      const userEmail = data?.user?.email;

      if (error || !userEmail) {
        console.warn(`Could not find user email for userId: ${job.userId}. Supabase error:`, error?.message);
        continue;
      }

      console.log(`Found email ${userEmail}, sending notification...`);

      await resend.emails.send({
        from: "qsscheduler <onboarding@resend.dev>",
        to: userEmail,
        subject: "Your Quiet Block Starts Soon",
        html: `<p>Hey! Your quiet study block starts at <strong>${new Date(
          job.startTime
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.</p>`,
      });

      await quietBlockJobs.updateOne(
        { _id: new ObjectId(job._id) },
        { $set: { emailSent: true } }
      );

      console.log(`Successfully sent notification and updated job ID: ${job._id}`);
    }

    return NextResponse.json({ sent: upcomingJobs.length });
  } catch (err) {
    console.error("CRON job failed with an error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await mongoClient.close();
  }
}
