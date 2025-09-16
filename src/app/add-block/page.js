// src/app/add-block/page.js

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // CHANGED: Correct import for App Router
import { createClient } from '../../../lib/supabase'; // CHANGED: Using path alias

export default function AddBlock() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState(''); // ADDED: State for end time
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // ✅ Add this line

  
  const router = useRouter();
  const supabase = createClient(); // Create client instance

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  // Validate inputs
  if (!startTime || !endTime) {
    setError("Both start and end times are required.");
    setLoading(false);
    return;
  }

  // ✅ Get user ID from Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    setError("You must be logged in to create a block.");
    setLoading(false);
    return;
  }

  try {
    // ✅ Send correct field names
    const res = await fetch('/api/create-block', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        startTime,
        endTime,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || 'Failed to create block');
      setLoading(false);
      return;
    }

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (err) {
    setError('Something went wrong: ' + err.message);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Quiet Block</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full border px-2 py-1 rounded-md"
            />
        </div>
        {/* ADDED: Input for end time */}
        <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full border px-2 py-1 rounded-md"
            />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md w-full">
          Save Block
        </button>
        {error && <p className="text-red-600 text-center">{error}</p>}
      </form>
    </div>
  );
}