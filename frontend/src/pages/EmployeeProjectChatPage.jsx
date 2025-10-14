import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import ChatBox from '../components/chat/ChatBox'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function EmployeeProjectChatPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/employee/chats')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {project?.name || 'Project Chat'}
          </h1>
          <p className="text-gray-600 mt-1">Team Communication</p>
        </div>
      </div>

      {/* Chat Box */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ChatBox roomId={`project-${projectId}`} />
      </div>
    </div>
  )
}
