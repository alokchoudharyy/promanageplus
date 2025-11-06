import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function NotificationBell() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications()
      
      // Real-time subscription
      const channel = supabase
        .channel(`notifications-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            console.log('🔔 Real-time notification event:', payload.eventType)
            
            if (payload.eventType === 'INSERT') {
              // Add new notification
              setNotifications(prev => [payload.new, ...prev])
              setUnreadCount(prev => prev + 1)
              toast.success(payload.new.title, { icon: '🔔' })
            } else if (payload.eventType === 'UPDATE') {
              // Update notification
              setNotifications(prev => 
                prev.map(n => n.id === payload.new.id ? payload.new : n)
              )
              // Recalculate unread
              setUnreadCount(prev => {
                if (payload.old.is_read === false && payload.new.is_read === true) {
                  return Math.max(0, prev - 1)
                }
                return prev
              })
            } else if (payload.eventType === 'DELETE') {
              // Remove notification
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
              if (payload.old.is_read === false) {
                setUnreadCount(prev => Math.max(0, prev - 1))
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status)
        })

      return () => {
        console.log('🔌 Unsubscribing from notifications')
        supabase.removeChannel(channel)
      }
    }
  }, [profile?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      console.log('📥 Fetching notifications for user:', profile.id)
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Fetch error:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} notifications`)
      setNotifications(data || [])
      
      const unread = data?.filter(n => !n.is_read).length || 0
      setUnreadCount(unread)
      console.log(`📊 Unread count: ${unread}`)
    } catch (error) {
      console.error('❌ Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      console.log('📝 Marking as read:', notificationId)
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      
      console.log('✅ Marked as read successfully')
    } catch (error) {
      console.error('❌ Error marking as read:', error)
      toast.error('Failed to mark as read')
      // Revert on error
      fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    if (isMarkingAll) return
    
    try {
      setIsMarkingAll(true)
      console.log('📝 Marking all as read...')
      
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)

      if (error) throw error
      
      console.log('✅ All marked as read successfully')
      toast.success('All marked as read')
    } catch (error) {
      console.error('❌ Error marking all as read:', error)
      toast.error('Failed to mark all as read')
      // Revert on error
      fetchNotifications()
    } finally {
      setIsMarkingAll(false)
    }
  }

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    
    try {
      console.log('🗑️ Deleting notification:', notificationId)
      
      // Find the notification to check if it's unread
      const notification = notifications.find(n => n.id === notificationId)
      const wasUnread = notification && !notification.is_read
      
      // Optimistic update - remove immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      
      console.log('✅ Deleted successfully')
      toast.success('Notification deleted')
    } catch (error) {
      console.error('❌ Error deleting notification:', error)
      toast.error('Failed to delete notification')
      // Revert on error
      fetchNotifications()
    }
  }

  const handleNotificationClick = (notification) => {
    console.log('🖱️ Clicked notification:', notification.type)
    
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    // Navigate
    const role = profile.role === 'manager' ? '' : '/employee'
    
    if (notification.type === 'task_assigned' || notification.type === 'task_updated') {
      navigate(`${role}/tasks`)
    } else if (notification.type === 'announcement') {
      navigate(`${role}/announcements`)
    } else if (notification.type === 'message' || notification.type === 'chat') {
      navigate(`${role}/chats`)
    } else if (notification.project_id) {
      navigate(`${role}/projects/${notification.project_id}/chat`)
    }
    
    setShowDropdown(false)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned': return '📋'
      case 'task_updated': return '✏️'
      case 'task_completed': return '✅'
      case 'project_update': return '📁'
      case 'message':
      case 'chat': return '💬'
      case 'announcement': return '📢'
      default: return '🔔'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
            <div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-xs text-white/90">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAll}
                className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition font-medium disabled:opacity-50"
              >
                <CheckIcon className="h-3 w-3" />
                {isMarkingAll ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No notifications</p>
                <p className="text-sm text-gray-500 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteNotification(notification.id, e)}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      aria-label="Delete notification"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
