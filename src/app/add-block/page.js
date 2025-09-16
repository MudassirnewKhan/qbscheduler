'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase';

export default function AddBlock() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const toUTCISOString = (localDateTimeStr) => new Date(localDateTimeStr).toISOString();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!startTime || !endTime) {
      setError('Both start and end times are required.');
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('You must be logged in to create a block.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/create-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          startTime: toUTCISOString(startTime),
          endTime: toUTCISOString(endTime),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(
          typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
        );
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError(
        err.message ? `Something went wrong: ${err.message}` : JSON.stringify(err)
      );
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
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-md text-white ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Saving...' : 'Save Block'}
        </button>
        {error && <p className="text-red-600 text-center mt-2">{error}</p>}
      </form>
    </div>
  );
}
