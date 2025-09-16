import { MongoClient, ObjectId } from "mongodb";
import { Resend } from 'resend'; // Or use SendGrid/Nodemailer
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mongoClient = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    await mongoClient.connect();
    const db = mongoClient.db("your-db"); // replace with your DB name
    const blocks = db.collection("study_blocks");

    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    // Find blocks starting in the next 10 minutes that haven't been notified
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

      // Send email
      await resend.emails.send({
        from: 'noreply@yoursite.com',
        to: userEmail,
        subject: "Your Silent Study Block Starts Soon",
        html: `<p>Hey! Your silent study block starts at <strong>${new Date(startTime).toLocaleTimeString()}</strong>.</p>`,
      });

      // Mark the block as notified
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
