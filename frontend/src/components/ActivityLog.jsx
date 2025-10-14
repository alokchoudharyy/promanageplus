import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  ClockIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'

export default function ActivityLog({ limit = 50 }) {
  const { profile } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [profile])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (actionType) => {
    if (actionType.includes('project')) return FolderIcon
    if (actionType.includes('task')) return ClipboardDocumentListIcon
    if (actionType.includes('comment')) return ChatBubbleLeftIcon
    if (actionType.includes('file')) return PaperClipIcon
    if (actionType.includes('member')) return UserPlusIcon
    return ClockIcon
  }

  const getActivityColor = (actionType) => {
    if (actionType.includes('created')) return 'text-green-600 bg-green-50'
    if (actionType.includes('updated')) return 'text-blue-600 bg-blue-50'
    if (actionType.includes('deleted')) return 'text-red-600 bg-red-50'
    if (actionType.includes('assigned')) return 'text-purple-600 bg-purple-50'
    return 'text-gray-600 bg-gray-50'
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.action_type)
        const colorClass = getActivityColor(activity.action_type)

        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
          >
            <div className={`p-3 rounded-lg ${colorClass}`}>
              <Icon className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 mb-1">
                <span className="font-semibold">
                  {activity.user?.full_name || 'Unknown User'}
                </span>{' '}
                {activity.description}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimestamp(activity.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
