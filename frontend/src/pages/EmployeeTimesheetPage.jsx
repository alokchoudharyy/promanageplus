import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { ClockIcon, PlayIcon, StopIcon, CalendarIcon } from '@heroicons/react/24/outline'

export default function EmployeeTimesheetPage() {
  const { profile } = useAuth()
  const [timesheets, setTimesheets] = useState([])
  const [activeTimer, setActiveTimer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalHoursToday, setTotalHoursToday] = useState(0)

  useEffect(() => {
    fetchTimesheets()
  }, [profile])

  const fetchTimesheets = async () => {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('user_id', profile.id)
        .order('clock_in', { ascending: false })
        .limit(30)

      if (error) throw error

      setTimesheets(data || [])
      
      // Find active timer
      const active = data?.find(t => t.clock_in && !t.clock_out)
      setActiveTimer(active || null)

      // Calculate today's hours
      const today = new Date().toDateString()
      const todayRecords = data?.filter(t => new Date(t.clock_in).toDateString() === today) || []
      const totalMinutes = todayRecords.reduce((sum, record) => {
        if (record.clock_out) {
          const diff = new Date(record.clock_out) - new Date(record.clock_in)
          return sum + (diff / 1000 / 60)
        }
        return sum
      }, 0)
      setTotalHoursToday((totalMinutes / 60).toFixed(2))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clockIn = async () => {
    try {
      const { error } = await supabase
        .from('timesheets')
        .insert({
          user_id: profile.id,
          clock_in: new Date().toISOString(),
        })

      if (error) throw error
      toast.success('Clocked in!')
      fetchTimesheets()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to clock in')
    }
  }

  const clockOut = async () => {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', activeTimer.id)

      if (error) throw error
      toast.success('Clocked out!')
      fetchTimesheets()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to clock out')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Timesheet</h1>
        <p className="text-gray-600 mt-1">Track your work hours</p>
      </div>

      {/* Clock In/Out Card */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {activeTimer ? 'Currently Working' : 'Not Clocked In'}
            </h2>
            <p className="text-white/90">Today's Total: {totalHoursToday} hours</p>
          </div>
          <button
            onClick={activeTimer ? clockOut : clockIn}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTimer
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {activeTimer ? <StopIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
            {activeTimer ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Work History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clock In</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clock Out</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {timesheets.map(record => {
                const duration = record.clock_out
                  ? ((new Date(record.clock_out) - new Date(record.clock_in)) / 1000 / 60 / 60).toFixed(2)
                  : 'In Progress'
                
                return (
                  <tr key={record.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(record.clock_in).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(record.clock_in).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {duration} {duration !== 'In Progress' && 'hrs'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
