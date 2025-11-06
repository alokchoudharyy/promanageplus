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

      // ✅ FIXED: Employee Performance - assignee_id instead of assignee_id 
      const employeeData = await Promise.all(
        (members || []).slice(0, 8).map(async (member) => {
          const { data: memberTasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('assignee_id', member.id)

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

      // ✅ FIXED: assignee:assignee_id instead of assignee:assignee_id 
      const { data: allTasks } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id(full_name),
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

  const handleExportTeamPerformance = async (format) => {
    try {
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('manager_id', profile.id)

      // ✅ FIXED: assignee_id instead of assignee_id 
      const memberStats = await Promise.all(
        (members || []).map(async (member) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status, deadline')
            .eq('assignee_id', member.id)

          const total = tasks?.length || 0
          const completed = tasks?.filter(t => t.status === 'done').length || 0
          const pending = total - completed
          const overdue = tasks?.filter(t => 
            t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
          ).length || 0

          return {
            name: member.full_name,
            email: member.email,
            totalTasks: total,
            completedTasks: completed,
            pendingTasks: pending,
            overdueTasks: overdue,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          }
        })
      )

      const result = exportTeamPerformanceReport(memberStats, format)
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

  const handleExportComplete = async (format) => {
    try {
      // Fetch all data
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', profile.id)

      const projectIds = projects?.map(p => p.id) || []

      // ✅ FIXED: assignee:assignee_id instead of assignee:assignee_id 
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id(full_name),
          project:project_id(name)
        `)
        .in('project_id', projectIds)

      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('manager_id', profile.id)

      // ✅ FIXED: Team stats with assignee_id
      const teamStats = await Promise.all(
        (members || []).map(async (member) => {
          const memberTasks = tasks?.filter(t => t.assignee_id === member.id) || []
          const completed = memberTasks.filter(t => t.status === 'done').length

          return {
            name: member.full_name,
            email: member.email,
            totalTasks: memberTasks.length,
            completedTasks: completed,
            pendingTasks: memberTasks.length - completed,
            completionRate: memberTasks.length > 0 
              ? Math.round((completed / memberTasks.length) * 100) 
              : 0,
          }
        })
      )

      const result = exportCompleteReport(
        projects || [],
        tasks || [],
        teamStats,
        format
      )

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
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive project and team insights</p>
        </div>
        
        <div className="flex gap-3">
          <ExportButton
            onExport={handleExportTasks}
            formats={['excel', 'pdf', 'csv']}
            label="Export Tasks"
          />
          <ExportButton
            onExport={handleExportComplete}
            formats={['excel', 'pdf']}
            label="Export All"
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
        {/* Tasks by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tasks by Status</h3>
            <ExportButton
              onExport={handleExportTasks}
              formats={['excel', 'csv']}
              label="Export"
              size="sm"
            />
          </div>
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

        {/* Tasks by Priority */}
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

        {/* Project Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
            <ExportButton
              onExport={handleExportProjects}
              formats={['excel', 'pdf']}
              label="Export"
              size="sm"
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
              <Bar dataKey="total" stackId="a" fill="#E5E7EB" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Employee Performance</h3>
            <ExportButton
              onExport={handleExportTeamPerformance}
              formats={['excel', 'csv']}
              label="Export"
              size="sm"
            />
          </div>
          {employeePerformance.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No employee data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Tasks Report</h4>
            <p className="text-sm text-gray-600 mb-3">Export all task details with assignments</p>
            <ExportButton
              onExport={handleExportTasks}
              formats={['excel', 'pdf', 'csv']}
              label="Export Tasks"
            />
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Projects Report</h4>
            <p className="text-sm text-gray-600 mb-3">Export project status and progress</p>
            <ExportButton
              onExport={handleExportProjects}
              formats={['excel', 'pdf']}
              label="Export Projects"
            />
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Team Performance</h4>
            <p className="text-sm text-gray-600 mb-3">Export employee performance metrics</p>
            <ExportButton
              onExport={handleExportTeamPerformance}
              formats={['excel', 'csv']}
              label="Export Team"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
