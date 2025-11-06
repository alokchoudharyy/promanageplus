import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { ClockIcon, UserIcon, FolderIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function ActivityPage() {
  const { profile } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [profile])

  const fetchActivities = async () => {
    try {
      // Fetch recent task updates
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          updated_at,
          project:project_id (name),
          assignee:assignee_id  (full_name)
        `)
        .eq('created_by', profile.id)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (tasksError) throw tasksError

      const formattedActivities = tasks.map(task => ({
        id: task.id,
        type: 'task',
        title: `Task "${task.title}" updated`,
        description: `Status: ${task.status}`,
        project: task.project?.name,
        user: task.assignee?.full_name,
        timestamp: task.updated_at,
      }))

      setActivities(formattedActivities)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      case 'project':
        return <FolderIcon className="h-5 w-5 text-purple-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    return date.toLocaleDateString()
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600 mt-1">Recent team activities and updates</p>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      {activity.project && (
                        <p className="text-xs text-gray-500 mt-1">
                          Project: {activity.project}
                        </p>
                      )}
                      {activity.user && (
                        <p className="text-xs text-gray-500">
                          By: {activity.user}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
