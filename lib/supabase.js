import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Pass your environment variables to the client
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}