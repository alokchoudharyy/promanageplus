import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ActivityLog from '../components/ActivityLog'
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

export default function ManagerDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalMembers: 0,
    overdueTasks: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false })

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', profile.id)

      // Fetch team members
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', profile.id)

      // Calculate stats
      const now = new Date()
      const overdue = tasks?.filter(
        (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'done'
      ).length || 0

      setStats({
        totalProjects: projects?.length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter((t) => t.status === 'done').length || 0,
        pendingTasks: tasks?.filter((t) => t.status !== 'done').length || 0,
        totalMembers: members?.length || 0,
        overdueTasks: overdue,
      })

      setRecentProjects(projects?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderIcon,
      color: 'bg-blue-500',
      link: '/projects',
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500',
      link: '/projects',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      link: '/projects',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/projects',
    },
    {
      title: 'Team Members',
      value: stats.totalMembers,
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      link: '/teams',
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: ExclamationCircleIcon,
      color: 'bg-red-500',
      link: '/projects',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name || 'Manager'}! 👋
        </h1>
        <p className="text-cyan-100">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              onClick={() => navigate(stat.link)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition"
          >
            <div className="bg-cyan-100 p-2 rounded-lg">
              <PlusIcon className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">New Project</p>
              <p className="text-xs text-gray-600">Create a new project</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/add-member')}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="bg-indigo-100 p-2 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Add Team Member</p>
              <p className="text-xs text-gray-600">Invite a new member</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
          >
            <div className="bg-purple-100 p-2 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Reports</p>
              <p className="text-xs text-gray-600">Analytics & insights</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Projects & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View All →
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No projects found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 p-2 rounded">
                      <FolderIcon className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="max-h-[400px] overflow-y-auto">
            <ActivityLog limit={5} />
          </div>
        </div>
      </div>
    </div>
  )
}
