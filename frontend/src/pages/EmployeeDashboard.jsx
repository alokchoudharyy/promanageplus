import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

export default function EmployeeDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    if (!profile?.id) return

    try {
      // ✅ FIXED: assignee_id instead of assignee_id 
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(name)
        `)
        .eq('assignee_id', profile.id)
        .order('deadline', { ascending: true })

      if (error) throw error

      const now = new Date()
      const tasks = data || []

      setStats({
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'done').length,
        overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'done').length,
      })

      setRecentTasks(tasks.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Tasks',
      value: stats.total,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'To Do',
      value: stats.todo,
      icon: ClockIcon,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      name: 'In Progress',
      value: stats.inProgress,
      icon: FireIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Employee'}! 👋
        </h1>
        <p className="text-cyan-100">
          Here's your task overview for today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {stats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <FireIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-900">
                You have {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}!
              </p>
              <p className="text-sm text-red-700">
                Please review and complete them as soon as possible.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/employee/tasks"
          className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-lg p-6 hover:from-cyan-600 hover:to-blue-600 transition shadow-lg hover:shadow-xl"
        >
          <ClipboardDocumentListIcon className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-semibold">View All Tasks</h3>
          <p className="text-sm text-cyan-100 mt-1">Manage your assigned tasks</p>
        </Link>

        <Link
          to="/employee/calendar"
          className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg p-6 hover:from-blue-600 hover:to-indigo-600 transition shadow-lg hover:shadow-xl"
        >
          <CalendarIcon className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-semibold">Calendar View</h3>
          <p className="text-sm text-blue-100 mt-1">See deadlines and schedules</p>
        </Link>

        <Link
          to="/employee/performance"
          className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg p-6 hover:from-green-600 hover:to-emerald-600 transition shadow-lg hover:shadow-xl"
        >
          <ChartBarIcon className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-semibold">Performance</h3>
          <p className="text-sm text-green-100 mt-1">Track your progress</p>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
          <Link
            to="/employee/tasks"
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No tasks assigned yet</p>
            </div>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        📁 {task.project?.name || 'No Project'}
                      </span>
                      {task.deadline && (
                        <span className={`text-xs ${
                          new Date(task.deadline) < new Date() && task.status !== 'done'
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-500'
                        }`}>
                          📅 {new Date(task.deadline).toLocaleDateString()}
                          {new Date(task.deadline) < new Date() && task.status !== 'done' && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'done'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
