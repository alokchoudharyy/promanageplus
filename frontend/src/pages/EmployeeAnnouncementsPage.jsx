import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { BellAlertIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

export default function EmployeeAnnouncementsPage() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.manager_id) {
      fetchAnnouncements()
    }
  }, [profile])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      
      // ✅ SIMPLE QUERY - NO JOIN
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('created_by', profile.manager_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setAnnouncements(data || [])
    } catch (error) {
      console.error('❌ Error fetching announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600 mt-1">Important updates from management</p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
              announcement.priority === 'urgent'
                ? 'border-red-500'
                : announcement.priority === 'high'
                ? 'border-orange-500'
                : 'border-blue-500'
            }`}
          >
            <div className="flex items-start gap-4">
              <BellAlertIcon className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                  {announcement.priority !== 'normal' && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold ${
                        announcement.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {announcement.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap mb-3">{announcement.message}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Posted by: Your Manager</span>
                  <span>•</span>
                  <span>{new Date(announcement.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BellAlertIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No announcements yet</p>
            <p className="text-sm text-gray-500">
              Your manager hasn't posted any announcements
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
