import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { ChatBubbleLeftRightIcon, FolderIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function ManagerChatsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [profile])

  const fetchProjects = async () => {
    try {
      // Fetch all projects created by manager
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false })

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
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ChatBubbleLeftRightIcon className="h-10 w-10" />
          <h1 className="text-3xl font-bold">Project Chats</h1>
        </div>
        <p className="text-cyan-100">
          Communicate with your team members across all projects
        </p>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Projects Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first project to start team communication.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-6 py-3 rounded-md hover:opacity-90 shadow-lg"
          >
            <FolderIcon className="h-5 w-5" />
            Create Project
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}/chat`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-cyan-500 transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-cyan-100 p-3 rounded-lg group-hover:bg-cyan-200 transition">
                    <FolderIcon className="h-6 w-6 text-cyan-600" />
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
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

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-cyan-600 transition">
                  {project.name}
                </h3>
                
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-cyan-600 font-medium">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Open Chat
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserGroupIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Quick Stats</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1 font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-blue-700">{projects.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1 font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-green-700">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1 font-medium">Completed Projects</p>
                <p className="text-3xl font-bold text-purple-700">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
