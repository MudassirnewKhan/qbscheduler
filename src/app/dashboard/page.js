import QuietBlocksDashboard from '@/components/QuietBlocksDashboard' // Adjust path if needed
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4 sm:p-8">
      <main className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/add-block" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            + Add New Block
          </Link>
        </div>
        <QuietBlocksDashboard />
      </main>
    </div>
  )
}