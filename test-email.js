import 'dotenv/config';
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  try {
    const response = await resend.emails.send({
      from:"qsscheduler <onboarding@resend.dev>",
      to: "mudassir.wamique.khan@gmail.com",
      subject: "Test Email from Resend",
      html: "<p>This is a test email sent to verify your Resend configuration.</p>",
    });
    console.log("Test email sent successfully:", response);
  } catch (error) {
    console.error("Failed to send test email:", error);
  }
}

sendTestEmail();
