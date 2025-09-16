// src/app/api/create-block/route.js

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import clientPromise from '../../../../lib/mongodb'

export async function POST(req) {
  const body = await req.json()
  const { startTime, endTime } = body

  // Await cookies once here
  const cookieStore = await cookies()

  // Create Supabase client with cookieStore (sync access)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set() {}, // no-op for edge functions
        remove() {}
      }
    }
  )

  // Get user session from Supabase
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user || userError) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  // Validate input
  if (!startTime || !endTime) {
    return new Response(JSON.stringify({ error: 'Missing times' }), { status: 400 })
  }

  // Insert quiet block into Supabase with RLS
  const { data, error } = await supabase
    .from('quiet_blocks')
    .insert([
      {
        user_id: user.id,
        start_time: new Date(startTime),
        end_time: new Date(endTime),
      },
    ])
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db('your-real-db-name')  // ⚠️ Replace with your MongoDB DB name
    const jobs = db.collection('quietBlockJobs')

    // Create job document to insert
    const job = {
      blockId: data.id,
      userId: data.user_id,
      startTime: new Date(data.start_time),
      endTime: new Date(data.end_time),
      emailSent: false,
      createdAt: new Date(),
    }

    console.log('📦 Inserting into MongoDB:', job)

    // Insert job into MongoDB
    await jobs.insertOne(job)

    // Respond success
    return new Response(
      JSON.stringify({ message: 'Block created and synced', block: data }),
      { status: 200 }
    )
  } catch (mongoError) {
    console.error('🔥 MongoDB Error:', mongoError)

    return new Response(
      JSON.stringify({
        error: 'MongoDB insert failed',
        details: mongoError.message,
        stack: mongoError.stack,
      }),
      { status: 500 }
    )
  }
}
