import { useState } from 'react'
import { 
  DocumentArrowDownIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline'

export default function ChatMessage({ 
  message, 
  currentUserId, 
  onDelete, 
  onEdit 
}) {
  const [showActions, setShowActions] = useState(false)
  const isOwnMessage = message.sender_id === currentUserId
  const isManager = message.sender?.role === 'manager'
  const isSystemMessage = message.message_type === 'system'

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    }
    
    if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  // System message
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-full">
          {message.message_text}
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
        isManager 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
          : 'bg-gradient-to-br from-cyan-500 to-blue-500'
      }`}>
        {message.sender?.full_name?.charAt(0).toUpperCase() || 'U'}
      </div>

      {/* Message Bubble */}
      <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Role Badge */}
        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-sm font-semibold text-gray-900">
            {message.sender?.full_name || 'Unknown'}
          </span>
          
          {/* ⭐ MANAGER BADGE - HIGHLIGHTED ⭐ */}
          {isManager && (
            <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg">
              👑 MANAGER
            </span>
          )}
          
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
        </div>

        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-3 ${
          isOwnMessage 
            ? isManager
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' // Manager's own messages
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'   // Employee's own messages
            : isManager
              ? 'bg-purple-50 text-gray-900 border-2 border-purple-300 shadow-md'  // ⭐ Manager's messages - HIGHLIGHTED ⭐
              : 'bg-gray-100 text-gray-900'                               // Employee's messages
        }`}>
          {/* Text Message */}
          {message.message_type === 'text' && (
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.message_text}
            </p>
          )}

          {/* File Message */}
          {message.message_type === 'file' && (
            <div className="flex items-center gap-3">
              <DocumentArrowDownIcon className="h-6 w-6" />
              <div className="flex-1">
                <p className="text-sm font-medium">{message.file_name}</p>
                <p className="text-xs opacity-75">
                  {(message.file_size / 1024).toFixed(2)} KB
                </p>
              </div>
              <a
                href={message.file_url}
                download={message.file_name}
                className="text-xs underline"
              >
                Download
              </a>
            </div>
          )}

          {/* Edited indicator */}
          {message.is_edited && (
            <span className="text-xs opacity-75 italic mt-1 block">
              (edited)
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && isOwnMessage && message.message_type === 'text' && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onEdit(message)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <PencilIcon className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => onDelete(message.id)}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <TrashIcon className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
