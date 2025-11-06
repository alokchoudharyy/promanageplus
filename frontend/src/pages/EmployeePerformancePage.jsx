import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/solid'

export default function EmployeePerformancePage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  })
  const [tasksByStatus, setTasksByStatus] = useState([])
  const [tasksByPriority, setTasksByPriority] = useState([])
  const [weeklyProgress, setWeeklyProgress] = useState([])
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    fetchPerformanceData()
  }, [profile])

  const fetchPerformanceData = async () => {
    if (!profile?.id) return

    try {
      // ✅ FIXED: assignee_id instead of assignee_id 
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', profile.id)

      const allTasks = tasks || []
      const completed = allTasks.filter(t => t.status === 'done')
      const pending = allTasks.filter(t => t.status !== 'done')

      // Stats
      setStats({
        total: allTasks.length,
        completed: completed.length,
        pending: pending.length,
        completionRate: allTasks.length > 0 
          ? Math.round((completed.length / allTasks.length) * 100) 
          : 0,
      })

      // Tasks by Status
      const statusData = [
        { name: 'To Do', value: allTasks.filter(t => t.status === 'todo').length, color: '#6B7280' },
        { name: 'In Progress', value: allTasks.filter(t => t.status === 'in-progress').length, color: '#F59E0B' },
        { name: 'Done', value: allTasks.filter(t => t.status === 'done').length, color: '#10B981' },
      ]
      setTasksByStatus(statusData)

      // Tasks by Priority
      const priorityData = [
        { name: 'Low', value: allTasks.filter(t => t.priority === 'low').length, color: '#6B7280' },
        { name: 'Medium', value: allTasks.filter(t => t.priority === 'medium').length, color: '#F59E0B' },
        { name: 'High', value: allTasks.filter(t => t.priority === 'high').length, color: '#EF4444' },
      ]
      setTasksByPriority(priorityData)

      // Weekly Progress (last 7 days)
      const weeklyData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const completedOnDay = completed.filter(t => 
          t.updated_at && t.updated_at.split('T')[0] === dateStr
        ).length

        weeklyData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          completed: completedOnDay,
        })
      }
      setWeeklyProgress(weeklyData)

      // Calculate Achievements
      const badges = []
      
      if (completed.length >= 1) {
        badges.push({
          icon: '🎯',
          title: 'First Task',
          description: 'Completed your first task',
          earned: true,
        })
      }
      
      if (completed.length >= 5) {
        badges.push({
          icon: '⭐',
          title: 'Rising Star',
          description: 'Completed 5 tasks',
          earned: true,
        })
      }
      
      if (completed.length >= 10) {
        badges.push({
          icon: '🏆',
          title: 'Task Master',
          description: 'Completed 10 tasks',
          earned: true,
        })
      }
      
      if (stats.completionRate >= 80) {
        badges.push({
          icon: '🔥',
          title: 'On Fire',
          description: '80%+ completion rate',
          earned: true,
        })
      }

      // Add locked achievements
      if (completed.length < 20) {
        badges.push({
          icon: '🌟',
          title: 'Super Star',
          description: 'Complete 20 tasks',
          earned: false,
        })
      }

      if (completed.length < 50) {
        badges.push({
          icon: '👑',
          title: 'Champion',
          description: 'Complete 50 tasks',
          earned: false,
        })
      }

      setAchievements(badges)

    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Tasks',
      value: stats.total,
      icon: ClockIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending',
      value: stats.pending,
      icon: FireIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: TrophyIcon,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
        <p className="text-gray-600 mt-1">Track your productivity and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress - Line Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Tasks Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Status - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tasksByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {tasksByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Priority - Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasksByPriority}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements 🏆</h3>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition ${
                  achievement.earned
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4 className="font-semibold text-sm text-gray-900 mb-1">
                  {achievement.title}
                </h4>
                <p className="text-xs text-gray-600">{achievement.description}</p>
                {achievement.earned && (
                  <div className="mt-2 text-xs text-purple-600 font-semibold">
                    ✓ Earned
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Completion Rate</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-8 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              >
                {stats.completionRate}%
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {stats.completed}/{stats.total}
            </p>
            <p className="text-sm text-gray-600">Tasks Completed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
