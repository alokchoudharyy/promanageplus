import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { ChatBubbleLeftRightIcon, FolderIcon } from '@heroicons/react/24/outline'

export default function EmployeeChatsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [profile])

  const fetchProjects = async () => {
    try {
      // Get all tasks assigned to employee
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('assignee_id ', profile.id)

      if (tasksError) throw tasksError

      // Get unique project IDs
      const projectIds = [...new Set(tasks.map(t => t.project_id))]

      if (projectIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch project details
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)

      if (projectsError) throw projectsError

      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Chats</h1>
        <p className="text-gray-600 mt-1">
          Communicate with your team on project-related topics
        </p>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Projects Yet
          </h3>
          <p className="text-gray-600">
            You haven't been assigned to any projects yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/employee/projects/${project.id}/chat`)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition">
                  <FolderIcon className="h-6 w-6 text-purple-600" />
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

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              
              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center text-sm text-purple-600 font-medium">
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Open Chat
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
