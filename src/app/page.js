'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    
    <main className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="p-8 text-center bg-red-100">
      <h1 className="text-4xl font-bold text-yellow-700">✅ Tailwind is working!</h1>
    </div>
      <h1 className="text-3xl font-bold mb-4">📚 Quiet Hours Scheduler</h1>
      <p className="mb-6 text-lg">Plan your focused study blocks and get notified 10 minutes before they start.</p>

      {user ? (
        <>
          <p className="mb-4">👋 Welcome, {user.email}</p>
          <div className="space-x-4">
            <Link href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</Link>
            <Link href="/add-block" className="bg-green-500 text-white px-4 py-2 rounded">Add Quiet Block</Link>
            <button onClick={handleLogout} className="bg-gray-500 text-white px-4 py-2 rounded">Logout</button>
          </div>
        </>
      ) : (
        <div className="space-x-4">
          <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded">Login</Link>
          <Link href="/signup" className="bg-green-500 text-white px-4 py-2 rounded">Sign Up</Link>
        </div>
      )}
    </main>
  )
}
