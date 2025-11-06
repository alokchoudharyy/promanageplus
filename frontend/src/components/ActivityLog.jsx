import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  PlusCircleIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function ActivityLog() {
  const { profile } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [profile])

  const fetchActivities = async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:user_id (full_name, email)
        `)
        .or(`user_id.eq.${profile.id},entity_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: Added null/undefined check
  const getActivityIcon = (action) => {
    // Safety check
    if (!action) return <ClockIcon className="h-5 w-5 text-gray-400" />

    const actionLower = action.toLowerCase()

    if (actionLower.includes('create')) {
      return <PlusCircleIcon className="h-5 w-5 text-green-500" />
    }
    if (actionLower.includes('complete')) {
      return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
    }
    if (actionLower.includes('start')) {
      return <PlayCircleIcon className="h-5 w-5 text-cyan-500" />
    }
    if (actionLower.includes('delete')) {
      return <TrashIcon className="h-5 w-5 text-red-500" />
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <PencilIcon className="h-5 w-5 text-yellow-500" />
    }
    return <ClockIcon className="h-5 w-5 text-gray-400" />
  }

  // ✅ FIXED: Better formatting for action text
  const formatAction = (action) => {
    if (!action) return 'Unknown action'
    
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Activity logs will appear here as team members work on projects.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
            <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.action)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">
                  {activity.user?.full_name || 'Unknown User'}
                </span>{' '}
                <span className="text-gray-600">{formatAction(activity.action)}</span>
              </p>
              {activity.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {activity.description}
                </p>
              )}
              {activity.entity_type && (
                <p className="text-xs text-gray-400 mt-1">
                  {activity.entity_type}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {formatTimestamp(activity.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
