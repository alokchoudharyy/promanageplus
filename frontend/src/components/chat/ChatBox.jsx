import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import WebSocketService from '../../services/websocket'
import toast from 'react-hot-toast'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { 
  UserGroupIcon, 
  ArrowLeftIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function ChatBox({ roomId, roomName, onClose }) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  
  // Dropdown states
  const [showParticipants, setShowParticipants] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const participantsDropdownRef = useRef(null)
  const optionsDropdownRef = useRef(null)

  useEffect(() => {
    if (!roomId || !profile?.id) return

    // Connect to WebSocket
    WebSocketService.connect(profile.id, profile.full_name)
    
    // Join room
    WebSocketService.joinRoom(roomId)

    // Fetch initial data
    fetchMessages()
    fetchParticipants()
    markAsRead()

    // Listen for new messages
    WebSocketService.onNewMessage(handleNewMessage)
    
    // Listen for typing indicators
    WebSocketService.onUserTyping(handleUserTyping)
    WebSocketService.onUserStoppedTyping(handleUserStoppedTyping)
    
    // Listen for online status
    WebSocketService.onUserOnline(handleUserOnline)
    WebSocketService.onUserOffline(handleUserOffline)

    return () => {
      WebSocketService.leaveRoom(roomId)
      WebSocketService.offNewMessage()
    }
  }, [roomId, profile])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (participantsDropdownRef.current && !participantsDropdownRef.current.contains(event.target)) {
        setShowParticipants(false)
      }
      if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(event.target)) {
        setShowOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      console.log('📥 Fetching messages for room:', roomId)
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching messages:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} messages`)
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          user:user_id (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('room_id', roomId)

      if (error) throw error
      setParticipants(data?.map(p => p.user) || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const markAsRead = async () => {
    try {
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', profile.id)

      WebSocketService.markAsRead(roomId, profile.id)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message])
    
    // Mark as read if chat is open
    if (message.sender_id !== profile.id) {
      markAsRead()
    }
  }

  const handleUserTyping = ({ userId, userName }) => {
    if (userId !== profile.id) {
      setTypingUsers(prev => {
        if (!prev.find(u => u.id === userId)) {
          return [...prev, { id: userId, name: userName }]
        }
        return prev
      })
    }
  }

  const handleUserStoppedTyping = ({ userId }) => {
    setTypingUsers(prev => prev.filter(u => u.id !== userId))
  }

  const handleUserOnline = ({ userId }) => {
    setOnlineUsers(prev => new Set([...prev, userId]))
  }

  const handleUserOffline = ({ userId }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

const sendNotification = async (notificationData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        link: notificationData.link || null,
        project_id: notificationData.projectId || null,
        is_read: false,
      })

    if (error) {
      console.error('❌ Notification error:', error)
    } else {
      console.log('✅ Chat notification sent')
    }
  } catch (error) {
    console.error('❌ Failed to send notification:', error)
  }
}

 const handleSendMessage = (messageText) => {
  if (!messageText.trim()) return

  // Send message via WebSocket
  WebSocketService.sendMessage(
    roomId,
    messageText,
    profile.id,
    profile.full_name,
    profile.role,
    'text'
  )

  // ✅ Send notification to all other participants
  participants.forEach(async (participant) => {
    if (participant.id !== profile.id) {
      await sendNotification({
        userId: participant.id,
        type: 'chat',
        title: `💬 ${profile.full_name} in ${roomName}`,
        message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
        link: profile.role === 'manager' 
          ? `/projects/${roomId}/chat` 
          : `/employee/projects/${roomId}/chat`,
        projectId: roomId,
      })
    }
  })
}


  const handleFileUpload = async (file) => {
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `chat-files/${roomId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath)

      // Send file message
      WebSocketService.sendMessage(
        roomId,
        `Sent a file: ${file.name}`,
        profile.id,
        profile.full_name,
        profile.role,
        'file',
        {
          url: publicUrl,
          name: file.name,
          size: file.size,
        }
      )

      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload file')
    }
  }

  const handleTyping = (isTyping) => {
    if (isTyping) {
      WebSocketService.startTyping(roomId, profile.id, profile.full_name)
    } else {
      WebSocketService.stopTyping(roomId, profile.id)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(prev => prev.filter(m => m.id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleEditMessage = async (message) => {
    const newText = prompt('Edit message:', message.message_text)
    if (!newText || newText === message.message_text) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          message_text: newText,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id)

      if (error) throw error

      setMessages(prev => prev.map(m => 
        m.id === message.id 
          ? { ...m, message_text: newText, is_edited: true }
          : m
      ))
      toast.success('Message updated')
    } catch (error) {
      console.error('Edit error:', error)
      toast.error('Failed to update message')
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-white/20 rounded"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white truncate">{roomName}</h2>
            <p className="text-xs text-white/90">
              Team Chat • {participants.length} member{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Participants Dropdown */}
          <div className="relative" ref={participantsDropdownRef}>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-white">
                {onlineUsers.size}/{participants.length} online
              </span>
            </button>

            {/* Participants Dropdown Panel */}
            {showParticipants && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                  <h3 className="font-bold text-lg">Team Members</h3>
                  <p className="text-xs text-white/90">
                    {onlineUsers.size} online • {participants.length - onlineUsers.size} offline
                  </p>
                </div>
                
                <div className="overflow-y-auto max-h-72">
                  {/* Online Users */}
                  <div className="p-3 bg-green-50 border-b border-gray-200">
                    <p className="text-xs font-bold text-green-700 uppercase mb-2">
                      🟢 Online ({onlineUsers.size})
                    </p>
                    {participants
                      .filter(p => onlineUsers.has(p.id))
                      .map(participant => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition mb-1"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                            {participant.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {participant.full_name}
                              {participant.id === profile.id && (
                                <span className="text-xs text-gray-500 ml-2">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {participant.role === 'manager' && (
                              <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-bold">
                                👑 Manager
                              </span>
                            )}
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    {onlineUsers.size === 0 && (
                      <p className="text-xs text-gray-400 p-2">No one online</p>
                    )}
                  </div>

                  {/* Offline Users */}
                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                      ⚫ Offline ({participants.length - onlineUsers.size})
                    </p>
                    {participants
                      .filter(p => !onlineUsers.has(p.id))
                      .map(participant => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition mb-1 opacity-60"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                            {participant.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-700 truncate">
                              {participant.full_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{participant.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {participant.role === 'manager' && (
                              <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">
                                👑 Manager
                              </span>
                            )}
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    {participants.length - onlineUsers.size === 0 && (
                      <p className="text-xs text-gray-400 p-2">Everyone is online! 🎉</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Options Menu */}
          <div className="relative" ref={optionsDropdownRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <EllipsisVerticalIcon className="h-6 w-6 text-white" />
            </button>

            {/* Options Dropdown Panel */}
            {showOptions && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowParticipants(true)
                      setShowOptions(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition text-left"
                  >
                    <UserGroupIcon className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">View Participants</p>
                      <p className="text-xs text-gray-500">{participants.length} members in chat</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      markAsRead()
                      setShowOptions(false)
                      toast.success('Marked all as read')
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition text-left"
                  >
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Mark as Read</p>
                      <p className="text-xs text-gray-500">Clear unread messages</p>
                    </div>
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-bold text-gray-700 mb-1">Chat Info</p>
                    <p className="text-xs text-gray-500">
                      💬 {messages.length} messages<br/>
                      👥 {participants.length} participants<br/>
                      🟢 {onlineUsers.size} online now
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="hidden lg:block p-2 hover:bg-white/20 rounded-lg transition"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <UserGroupIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              currentUserId={profile.id}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
          <span className="italic">
            {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
            <span className="inline-flex gap-1 ml-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </span>
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <ChatInput
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          onTyping={handleTyping}
        />
      </div>
    </div>
  )
}
