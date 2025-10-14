import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { ProjectCardSkeleton } from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import ExportButton from '../components/ExportButton'
import { exportProjectReport } from '../services/exportService'
import {
  PlusIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active',
  })

  useEffect(() => {
    fetchProjects()
  }, [profile])

  const fetchProjects = async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project)
      setForm({
        name: project.name,
        description: project.description || '',
        status: project.status,
      })
    } else {
      setEditingProject(null)
      setForm({ name: '', description: '', status: 'active' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProject(null)
    setForm({ name: '', description: '', status: 'active' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update({
            name: form.name,
            description: form.description,
            status: form.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProject.id)

        if (error) throw error
        toast.success('Project updated successfully')
      } else {
        const { error } = await supabase.from('projects').insert({
          name: form.name,
          description: form.description,
          status: form.status,
          created_by: profile.id,
        })

        if (error) throw error
        toast.success('Project created successfully')
      }

      fetchProjects()
      closeModal()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error(error.message || 'Failed to save project')
    }
  }

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project? All tasks will be deleted too.'))
      return

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId)

      if (error) throw error
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT HANDLER
  // ═══════════════════════════════════════════════════════════

  const handleExportProjects = async (format) => {
    try {
      // Add task counts to projects
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
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

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage all your projects • {projects.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <ExportButton
              onExport={handleExportProjects}
              label="Export"
              formats={['excel', 'pdf', 'csv']}
              size="sm"
            />
          )}
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-6 py-3 rounded-md hover:opacity-90 transition shadow-lg"
          >
            <PlusIcon className="h-5 w-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="No projects yet"
          description="Get started by creating your first project. Projects help you organize tasks and track progress."
          actionLabel="Create First Project"
          onAction={() => openModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.name}
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
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
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openModal(project)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>

                {/* View Tasks Button */}
                <button
                  onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-4 py-2 rounded-md hover:opacity-90 transition font-medium"
                >
                  View Tasks →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Website Redesign"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Brief description of the project..."
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-md hover:opacity-90 transition"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
