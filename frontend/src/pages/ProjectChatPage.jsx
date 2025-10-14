import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import ChatBox from '../components/chat/ChatBox'
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function ProjectChatPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [project, setProject] = useState(null)
  const [chatReady, setChatReady] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // ✅ Prevent multiple setups
  const setupRef = useRef(false)
  const setupPromiseRef = useRef(null)

  useEffect(() => {
    // Reset on project change
    if (projectId) {
      setupRef.current = false
      setupPromiseRef.current = null
    }
  }, [projectId])

  useEffect(() => {
    if (profile?.id && projectId && !setupRef.current) {
      setupRef.current = true
      
      // If already setting up, return the existing promise
      if (setupPromiseRef.current) {
        return
      }
      
      setupPromiseRef.current = setupChat()
    }
  }, [projectId, profile?.id])

  const setupChat = async () => {
    try {
      console.log('🔄 Setting up chat for project:', projectId)

      // 1. Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)
      console.log('✅ Project loaded:', projectData.name)

      // 2. Room ID = Project ID
      const roomId = projectId

      // 3. Check if room exists
      const { data: existingRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle()

      if (roomError && roomError.code !== 'PGRST116') {
        throw roomError
      }

      // 4. Create room if it doesn't exist
      if (!existingRoom) {
        console.log('📝 Creating chat room...')
        
        const { error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            id: roomId,
            room_type: 'project',
            project_id: projectId,
            name: `${projectData.name} - Team Chat`,
            created_by: profile.id,
          })

        if (createError && createError.code !== '23505') {
          throw createError
        }

        console.log('✅ Chat room created')
      } else {
        console.log('✅ Chat room exists')
      }

      // 5. Add current user as participant (only if not exists)
      const { data: existingParticipant } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', profile.id)
        .maybeSingle()

      if (!existingParticipant) {
        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert({
            room_id: roomId,
            user_id: profile.id,
            joined_at: new Date().toISOString(),
          })

        if (participantError && participantError.code !== '23505') {
          console.error('Participant error:', participantError)
        } else {
          console.log('✅ User added as participant')
        }
      } else {
        console.log('✅ User already participant')
      }

      // 6. All set!
      setChatReady(true)

    } catch (error) {
      console.error('❌ Error setting up chat:', error)
      toast.error('Failed to load chat')
    } finally {
      setLoading(false)
      setupPromiseRef.current = null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!chatReady || !project) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Go Back
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Chat</h2>
          <p className="text-gray-600">
            There was an error loading the chat room. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(profile.role === 'manager' ? '/manager/chats' : '/employee/chats')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {project.name}
          </h1>
          <p className="text-gray-600 mt-1">
            💬 Team Group Chat • Real-time collaboration
          </p>
        </div>
      </div>

      {/* Chat Box */}
      <div 
        className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden" 
        style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}
      >
        <ChatBox
          roomId={projectId}
          roomName={project.name}
        />
      </div>
    </div>
  )
}
