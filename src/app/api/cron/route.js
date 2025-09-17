import { MongoClient, ObjectId } from "mongodb";
import { Resend } from 'resend';
import { createClient } from "@supabase/supabase-js";

// Initialize clients
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const mongoClient = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") return res.status(405).end();

  // ✅ CRON SECRET CHECK (add here)
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    await mongoClient.connect();
    const db = mongoClient.db("your-db"); // replace with your actual DB name
    const blocks = db.collection("study_blocks");

    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    const upcomingBlocks = await blocks.find({
      notified: false,
      startTime: {
        $lte: tenMinutesLater,
        $gte: now
      }
    }).toArray();

    for (const block of upcomingBlocks) {
      const { userId, startTime, _id } = block;

      // Get user email from Supabase
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      const userEmail = data?.user?.email;

      if (error || !userEmail) continue;

      // Send email via Resend
      await resend.emails.send({
        from: 'noreply@yoursite.com',
        to: userEmail,
        subject: "Your Silent Study Block Starts Soon",
        html: `<p>Hey! Your silent study block starts at <strong>${new Date(startTime).toLocaleTimeString()}</strong>.</p>`,
      });

      // Mark as notified in MongoDB
      await blocks.updateOne(
        { _id: new ObjectId(_id) },
        { $set: { notified: true } }
      );
    }

    res.status(200).json({ sent: upcomingBlocks.length });
  } catch (err) {
    console.error("CRON error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
