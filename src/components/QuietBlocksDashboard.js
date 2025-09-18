'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase' // <-- 1. Import from your new helper file
import Link from 'next/link'
// After (runs only once)

export default function QuietBlocksDashboard() {
  const supabase = createClient()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('quiet_blocks')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
         setBlocks(Array.isArray(data) ? data : [])

      }
      setLoading(false)
    }

    fetchBlocks()
  }, []) // <-- Dependency array updated for simplicity

  const handleDelete = async (id) => {
  const confirmed = window.confirm('Are you sure you want to delete this block?')
  if (!confirmed) return

  try {
    const res = await fetch(`/api/delete-block?id=${id}`, {
      method: 'DELETE',
    })

    const result = await res.json()

    if (!res.ok) {
      alert(`Failed to delete block: ${result.error || 'Unknown error'}`)
      return
    }

    // Remove from local UI
    setBlocks(blocks.filter(block => block.id !== id))
  } catch (err) {
    alert(`Something went wrong: ${err.message}`)
  }
}

  
  // No changes needed below this line, the rendering logic is the same
  if (loading) return <p className="text-center">Loading your schedule...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>
  if (blocks.length === 0) {
    return (
      <div className="text-center text-black">
        <p>You have not scheduled any quiet time yet.</p>
        <Link href="/add-block" className="mt-2 inline-block text-indigo-600 hover:underline">
          Schedule your first block
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-gray-800">Your Scheduled Blocks</h2>
      <ul className="divide-y divide-gray-200">
        {blocks.map((block) => (
          <li key={block.id} className="flex items-center justify-between py-4 text-emerald-800">
            <div>
              <p className="font-semibold">
                {new Date(block.start_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
              <p className="text-sm text-gray-500">
                Ends at {new Date(block.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(block.id)}
              className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}