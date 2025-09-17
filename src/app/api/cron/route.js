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
  // LOG: Announce that the function has started
  console.log("CRON job function started...");

  // Check authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // LOG: Log the failed authorization attempt
    console.warn("Unauthorized attempt to run CRON job.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // LOG: Confirm that authorization was successful
  console.log("Authorization successful.");

  try {
    await mongoClient.connect();
    const db = mongoClient.db("your-db"); // ⚠️ Replace with your MongoDB DB name
    const blocks = db.collection("study_blocks");

    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    // LOG: The most important log for debugging timezones
    console.log(`Searching for blocks between ${now.toISOString()} and ${tenMinutesLater.toISOString()} (UTC)`);

    const query = {
      notified: false,
      startTime: {
        $gte: now,
        $lte: tenMinutesLater,
      },
    };

    // LOG: Show the exact query being sent to MongoDB
    console.log("MongoDB Query:", JSON.stringify(query, null, 2));
    
    const upcomingBlocks = await blocks.find(query).toArray();

    // LOG: Show how many blocks were found
    console.log(`Found ${upcomingBlocks.length} blocks to notify.`);

    for (const block of upcomingBlocks) {
      // LOG: Log the details of the block being processed
      console.log(`Processing block ID: ${block._id} for user ID: ${block.userId}`);
      
      const { data, error } = await supabase.auth.admin.getUserById(block.userId);
      const userEmail = data?.user?.email;

      if (error || !userEmail) {
        // LOG: Log when a user's email couldn't be found
        console.warn(`Could not find user email for userId: ${block.userId}. Supabase error:`, error?.message);
        continue;
      }

      console.log(`Found email ${userEmail}, sending notification...`);
      
      await resend.emails.send({
        from: "qsscheduler <onboarding@resend.dev>",
        to: userEmail, // Changed to the correct user email variable
        subject: "Your Silent Study Block Starts Soon",
        html: `<p>Hey! Your silent study block starts at <strong>${new Date(
          block.startTime
        ).toLocaleTimeString()}</strong>.</p>`,
      });

      await blocks.updateOne(
        { _id: new ObjectId(block._id) },
        { $set: { notified: true } }
      );

      console.log(`Successfully sent notification and updated block ID: ${block._id}`);
    }

    return NextResponse.json({ sent: upcomingBlocks.length });
  } catch (err) {
    // LOG: The existing error log for critical failures
    console.error("CRON job failed with an error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}