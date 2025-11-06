import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import ExportButton from '../components/ExportButton'
import { exportTeamPerformanceReport } from '../services/exportService'
import {
  UserGroupIcon,
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function TeamsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberTasks, setMemberTasks] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [profile])

  const fetchTeamMembers = async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // For each member, get their task stats
      const membersWithStats = await Promise.all(
        (data || []).map(async (member) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('assignee_id ', member.id)

          const totalTasks = tasks?.length || 0
          const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
          const activeTasks = tasks?.filter(t => t.status !== 'done').length || 0

          return {
            ...member,
            totalTasks,
            completedTasks,
            activeTasks,
          }
        })
      )

      setTeamMembers(membersWithStats)
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const viewMemberDetails = async (member) => {
    setSelectedMember(member)
    setShowModal(true)

    // Fetch member's tasks
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(name)
        `)
        .eq('assignee_id ', member.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMemberTasks(data || [])
    } catch (error) {
      console.error('Error fetching member tasks:', error)
      toast.error('Failed to load tasks')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedMember(null)
    setMemberTasks([])
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT HANDLER
  // ═══════════════════════════════════════════════════════════

  const handleExportTeam = async (format) => {
    try {
      const result = exportTeamPerformanceReport(teamMembers, format)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export team data')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage your team • {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {teamMembers.length > 0 && (
            <ExportButton
              onExport={handleExportTeam}
              label="Export"
              formats={['excel', 'pdf', 'csv']}
              size="sm"
            />
          )}
          <button
            onClick={() => navigate('/add-member')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-6 py-3 rounded-md hover:opacity-90 transition shadow-lg"
          >
            <PlusIcon className="h-5 w-5" />
            Add Member
          </button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.reduce((sum, m) => sum + m.completedTasks, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.reduce((sum, m) => sum + m.activeTasks, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      {teamMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No team members yet</h3>
          <p className="text-gray-600 mb-6">Add your first team member to get started</p>
          <button
            onClick={() => navigate('/add-member')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-6 py-3 rounded-md hover:opacity-90 transition"
          >
            <PlusIcon className="h-5 w-5" />
            Add Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-6">
                {/* Member Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                    {member.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {member.full_name || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <EnvelopeIcon className="h-3 w-3" />
                      {member.email}
                    </div>
                    {member.mobile && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <PhoneIcon className="h-3 w-3" />
                        {member.mobile}
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-lg font-bold text-gray-900">{member.totalTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Active</p>
                    <p className="text-lg font-bold text-yellow-600">{member.activeTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Done</p>
                    <p className="text-lg font-bold text-green-600">{member.completedTasks}</p>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => viewMemberDetails(member)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-4 py-2 rounded-md hover:opacity-90 transition font-medium"
                >
                  View Tasks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Details Modal */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold">
                  {selectedMember.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedMember.full_name || 'Unknown'}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedMember.email}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedMember.totalTasks}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-2xl font-bold text-yellow-600">{selectedMember.activeTasks}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{selectedMember.completedTasks}</p>
                </div>
              </div>

              {/* Tasks List */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Tasks</h3>
              {memberTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BriefcaseIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No tasks assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-cyan-500 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            task.status === 'done'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>📁 {task.project?.name || 'Unknown Project'}</span>
                        {task.deadline && (
                          <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
