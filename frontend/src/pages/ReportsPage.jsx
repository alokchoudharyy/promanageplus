import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import ExportButton from '../components/ExportButton'
import {
  exportTaskReport,
  exportProjectReport,
  exportTeamPerformanceReport,
  exportCompleteReport,
} from '../services/exportService'

export default function ReportsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
  })
  const [tasksByStatus, setTasksByStatus] = useState([])
  const [tasksByPriority, setTasksByPriority] = useState([])
  const [projectProgress, setProjectProgress] = useState([])
  const [employeePerformance, setEmployeePerformance] = useState([])

  useEffect(() => {
    fetchReportData()
  }, [profile])

  const fetchReportData = async () => {
    if (!profile?.id) return

    try {
      // Get all projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', profile.id)

      // Get all tasks across all projects
      const projectIds = projects?.map(p => p.id) || []
      let allTasks = []
      
      if (projectIds.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .in('project_id', projectIds)
        allTasks = tasks || []
      }

      // Get team members
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('manager_id', profile.id)

      // Calculate stats
      setStats({
        totalProjects: projects?.length || 0,
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter(t => t.status === 'done').length,
        teamMembers: members?.length || 0,
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

      // Project Progress
      const projectProgressData = await Promise.all(
        (projects || []).slice(0, 5).map(async (project) => {
          const { data: projectTasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('project_id', project.id)

          const total = projectTasks?.length || 0
          const completed = projectTasks?.filter(t => t.status === 'done').length || 0
          
          return {
            name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
            completed,
            total,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0
          }
        })
      )
      setProjectProgress(projectProgressData)

      // Employee Performance
      const employeeData = await Promise.all(
        (members || []).slice(0, 8).map(async (member) => {
          const { data: memberTasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('assigned_to', member.id)

          const total = memberTasks?.length || 0
          const completed = memberTasks?.filter(t => t.status === 'done').length || 0

          return {
            name: member.full_name?.split(' ')[0] || 'Unknown',
            completed,
            pending: total - completed,
            total
          }
        })
      )
      setEmployeePerformance(employeeData.filter(e => e.total > 0))

    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleExportTasks = async (format) => {
    try {
      // Fetch all tasks for export
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', profile.id)

      const projectIds = projectData?.map(p => p.id) || []

      if (projectIds.length === 0) {
        toast.error('No projects found to export')
        return
      }

      const { data: allTasks } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to(full_name),
          project:project_id(name)
        `)
        .in('project_id', projectIds)

      const result = exportTaskReport(allTasks || [], format)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export tasks')
    }
  }

  const handleExportProjects = async (format) => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', profile.id)

      // Add task counts
      const projectsWithStats = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('project_id', project.id)

          return {
            ...project,
            totalTasks: tasks?.length || 0,
            completedTasks: tasks?.filter(t => t.status === 'done').length || 0,
          }
        })
      )

      const result = exportProjectReport(projectsWithStats, format)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export projects')
    }
  }

  const handleExportTeam = async (format) => {
    try {
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', profile.id)

      // Add task stats
      const membersWithStats = await Promise.all(
        (members || []).map(async (member) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('assigned_to', member.id)

          return {
            ...member,
            totalTasks: tasks?.length || 0,
            completedTasks: tasks?.filter(t => t.status === 'done').length || 0,
            activeTasks: tasks?.filter(t => t.status !== 'done').length || 0,
          }
        })
      )

      const result = exportTeamPerformanceReport(membersWithStats, format)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export team performance')
    }
  }

  const handleExportComplete = async () => {
    try {
      // Fetch all data
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', profile.id)

      const projectIds = projects?.map(p => p.id) || []
      
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to(full_name),
          project:project_id(name)
        `)
        .in('project_id', projectIds)

      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', profile.id)

      // Add stats
      const projectsWithStats = await Promise.all(
        (projects || []).map(async (project) => {
          const projectTasks = tasks?.filter(t => t.project_id === project.id) || []
          return {
            ...project,
            totalTasks: projectTasks.length,
            completedTasks: projectTasks.filter(t => t.status === 'done').length,
          }
        })
      )

      const membersWithStats = await Promise.all(
        (members || []).map(async (member) => {
          const memberTasks = tasks?.filter(t => t.assigned_to === member.id) || []
          return {
            ...member,
            totalTasks: memberTasks.length,
            completedTasks: memberTasks.filter(t => t.status === 'done').length,
            activeTasks: memberTasks.filter(t => t.status !== 'done').length,
          }
        })
      )

      const result = exportCompleteReport({
        projects: projectsWithStats,
        tasks: tasks || [],
        teamMembers: membersWithStats,
      })

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export complete report')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Projects',
      value: stats.totalProjects,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Tasks',
      value: stats.totalTasks,
      icon: ClockIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Team Members',
      value: stats.teamMembers,
      icon: UserGroupIcon,
      color: 'bg-cyan-500',
    },
  ]

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header with Export Options */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your team's progress and performance</p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <ExportButton
            onExport={handleExportComplete}
            label="Export All"
            formats={['excel']}
          />
          <div className="h-8 w-px bg-gray-300"></div>
          <ExportButton
            onExport={handleExportTasks}
            label="Tasks"
            formats={['excel', 'pdf', 'csv']}
            size="sm"
          />
          <ExportButton
            onExport={handleExportProjects}
            label="Projects"
            formats={['excel', 'pdf', 'csv']}
            size="sm"
          />
          <ExportButton
            onExport={handleExportTeam}
            label="Team"
            formats={['excel', 'pdf', 'csv']}
            size="sm"
          />
        </div>
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

        {/* Tasks by Priority - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tasksByPriority}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {tasksByPriority.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project Progress - Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="total" fill="#6B7280" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Performance - Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
              <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Completion Rate</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-8 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-500"
                style={{
                  width: stats.totalTasks > 0
                    ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
                    : '0%'
                }}
              >
                {stats.totalTasks > 0
                  ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {stats.completedTasks}/{stats.totalTasks}
            </p>
            <p className="text-sm text-gray-600">Tasks Completed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
