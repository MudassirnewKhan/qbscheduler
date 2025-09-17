import { MongoClient, ObjectId } from "mongodb";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize clients (only once)
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, // Use service URL env var (not NEXT_PUBLIC)
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin access
);

const mongoClient = new MongoClient(process.env.MONGODB_URI);

export async function POST(req) {
  // Check authorization header for CRON_SECRET token
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Connect to MongoDB (safe to call multiple times)
    await mongoClient.connect();

    const db = mongoClient.db("your-db"); // Replace with your MongoDB DB name
    const blocks = db.collection("study_blocks");

    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    // Find study blocks starting between now and 10 mins from now, not notified yet
    const upcomingBlocks = await blocks
      .find({
        notified: false,
        startTime: {
          $gte: now,
          $lte: tenMinutesLater,
        },
      })
      .toArray();

    for (const block of upcomingBlocks) {
      const { userId, startTime, _id } = block;

      // Get user email from Supabase (admin API)
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      const userEmail = data?.user?.email;

      if (error || !userEmail) {
        console.warn(`User email not found for userId: ${userId}`);
        continue;
      }

      // Send email via Resend
      await resend.emails.send({
        from: "qsscheduler <onboarding@resend.dev>",
        to: "mudassir.wamique.khan@gmail.com",
        subject: "Your Silent Study Block Starts Soon",
        html: `<p>Hey! Your silent study block starts at <strong>${new Date(
          startTime
        ).toLocaleTimeString()}</strong>.</p>`,
      });

      // Mark block as notified in MongoDB
      await blocks.updateOne(
        { _id: new ObjectId(_id) },
        { $set: { notified: true } }
      );
    }

    return NextResponse.json({ sent: upcomingBlocks.length });
  } catch (err) {
    console.error("CRON error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
