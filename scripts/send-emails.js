// Adjust path as per your folder structure
import clientPromise from '../lib/mongodb.js'
import 'dotenv/config'

import nodemailer from 'nodemailer' // or another email service

// Example sendEmail function (replace with your actual email logic)
async function sendEmailToUser(userId, startTime) {
  // Setup your transporter here or use your email service
  const transporter = nodemailer.createTransport({
    // e.g. SMTP config or a service like SendGrid, Mailgun, etc.
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@example.com',
      pass: 'your-email-password',
    },
  })

  const mailOptions = {
    from: '"Your App" <no-reply@yourapp.com>',
    to: userId, // assuming userId is user's email, else fetch email from DB
    subject: 'Reminder: Your silent study block starts soon',
    text: `Hi! Your silent study block starts at ${startTime}.`,
  }

  await transporter.sendMail(mailOptions)
  console.log(`Email sent to ${userId}`)
}

const run = async () => {
  try {
    // Await the MongoDB connection promise
    const client = await clientPromise
    const db = client.db('your-db-name') // replace with your DB name
    const jobs = db.collection('quietBlockJobs')

    const now = new Date()
    const tenMinsFromNow = new Date(now.getTime() + 10 * 60 * 1000)

    const upcomingJobs = await jobs.find({
      emailSent: false,
      startTime: { $gte: now, $lte: tenMinsFromNow }
    }).toArray()

    if (upcomingJobs.length === 0) {
      console.log('No upcoming jobs within 10 minutes.')
      return
    }

    for (const job of upcomingJobs) {
      try {
        // Send email to userId (or fetch user email if userId isn't email)
        await sendEmailToUser(job.userId, job.startTime)

        // Mark email as sent
        await jobs.updateOne({ _id: job._id }, { $set: { emailSent: true } })

        console.log(`📨 Email sent for block ${job.blockId}`)
      } catch (err) {
        console.error(`❌ Failed to send email for ${job.blockId}:`, err)
      }
    }
  } catch (error) {
    console.error('Error running email sender:', error)
  } finally {
    // Optionally close client if you want
    // await client.close()
  }
}

run()
