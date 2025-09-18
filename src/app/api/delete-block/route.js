import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import clientPromise from '../../../../lib/mongodb'

export async function DELETE(req) {
  const { searchParams } = new URL(req.url)
  const blockId = searchParams.get('id')

  if (!blockId) {
    return new Response(JSON.stringify({ error: 'Missing block ID' }), { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {}
      }
    }
  )

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user || userError) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  try {
    // 1. Delete from Supabase
    await supabase
      .from('quiet_blocks')
      .delete()
      .eq('id', blockId)
      .eq('user_id', user.id)

    // 2. Delete from MongoDB
    const client = await clientPromise
    const db = client.db('your-real-db-name')
    const jobs = db.collection('quietBlockJobs')

    await jobs.deleteOne({ blockId })

    return new Response(JSON.stringify({ message: 'Block deleted' }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
