import { useState, useRef } from 'react'
import { 
  PaperAirplaneIcon, 
  PaperClipIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline'
import EmojiPicker from 'emoji-picker-react'

export default function ChatInput({ 
  onSendMessage, 
  onFileUpload, 
  onTyping,
  disabled = false 
}) {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      setShowEmojiPicker(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await onFileUpload(file)
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    
    if (onTyping) {
      onTyping(true)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false)
      }, 2000)
    }
  }

  return (
    <div className="relative border-t border-gray-200 p-4 bg-white">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          disabled={disabled}
        >
          <FaceSmileIcon className="h-6 w-6" />
        </button>

        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          disabled={disabled || uploading}
        >
          {uploading ? (
            <div className="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
          ) : (
            <PaperClipIcon className="h-6 w-6" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Message Input */}
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32"
          style={{ minHeight: '48px' }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <PaperAirplaneIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Character Count */}
      {message.length > 0 && (
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500">
            {message.length} / 1000
          </span>
        </div>
      )}
    </div>
  )
}
