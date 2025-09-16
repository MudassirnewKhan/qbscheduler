// app/login/page.js
'use client'

import { createClient } from '../../../lib/supabase' // Adjust import path
import { useState } from 'react'
import { useRouter } from 'next/navigation' // Import the router

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null) // 1. Add state for the error
  const router = useRouter() // Initialize the router
  
  const supabase = createClient()

  // 2. Accept the event 'e' to prevent default form submission
  const handleLogin = async (e) => {
    e.preventDefault() 
    setError(null) // Clear previous errors

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // 3. Set the error state if login fails
      setError(error.message) 
    } else {
      // 4. Use the router for a clean client-side redirect
      router.push('/dashboard')
      router.refresh() // Optional: refetches server components
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">Welcome back</h1>
      {/* The form's onSubmit now correctly calls our async handler */}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* This now correctly reads from the component's state */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Log In
        </button>
      </form>
    </div>
  )
}