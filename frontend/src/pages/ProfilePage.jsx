import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    teamMembers: 0,
    completedTasks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role === 'manager') {
      fetchManagerStats()
    }
  }, [profile])

  const fetchManagerStats = async () => {
    try {
      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', profile.id)

      const projectIds = projects?.map(p => p.id) || []

      // Fetch tasks
      let allTasks = []
      if (projectIds.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('status')
          .in('project_id', projectIds)
        allTasks = tasks || []
      }

      // Fetch team members
      const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', profile.id)

      setStats({
        totalProjects: projects?.length || 0,
        totalTasks: allTasks.length,
        teamMembers: members?.length || 0,
        completedTasks: allTasks.filter(t => t.status === 'done').length,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

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
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">View your account information and statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold mb-4">
                {profile.full_name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                {profile.full_name || 'Manager'}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600 uppercase">
                  {profile.role}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.email}
                  </p>
                </div>
              </div>

              {profile.mobile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <PhoneIcon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.mobile}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
              <BriefcaseIcon className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.totalProjects}</p>
              <p className="text-sm opacity-90">Total Projects</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-6 text-white">
              <UserCircleIcon className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.teamMembers}</p>
              <p className="text-sm opacity-90">Team Members</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-6 text-white">
              <ShieldCheckIcon className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.completedTasks}</p>
              <p className="text-sm opacity-90">Tasks Completed</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-6 text-white">
              <CalendarIcon className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.totalTasks}</p>
              <p className="text-sm opacity-90">Total Tasks</p>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Overall Task Completion Rate
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-8 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  >
                    {completionRate}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Account Type</span>
                <span className="text-sm font-semibold text-purple-600 uppercase flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4" />
                  Manager Account
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Account Status</span>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="text-sm font-mono text-gray-900">{profile.id.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm text-gray-900">
                  {new Date(profile.updated_at || profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
