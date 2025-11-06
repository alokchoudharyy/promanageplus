import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

class WebSocketService {
  constructor() {
    this.socket = null
    this.typingTimeout = null
  }

  connect(userId, userName) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnection: true,
        reconnectionDelay: 1000,
      })

      this.socket.on('connect', () => {
        console.log('✅ Socket connected')
        // Authenticate user
        this.socket.emit('authenticate', userId)
      })

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected')
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })
    }

    return this.socket
  }

  // ═══════════════════════════════════════════════════════════
  // CHAT METHODS
  // ═══════════════════════════════════════════════════════════

  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join-room', roomId)
      console.log('📥 Joined room:', roomId)
    }
  }

  leaveRoom(roomId) {
    if (this.socket) {
      this.socket.emit('leave-room', roomId)
      console.log('📤 Left room:', roomId)
    }
  }

  sendMessage(roomId, message, senderId, senderName, senderRole, messageType = 'text', fileData = null) {
    if (this.socket) {
      this.socket.emit('send-message', {
        roomId,
        message,
        senderId,
        senderName,
        senderRole,
        messageType,
        fileData,
      })
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback)
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new-message')
    }
  }

  // Typing indicators
  startTyping(roomId, userId, userName) {
    if (this.socket) {
      this.socket.emit('typing-start', { roomId, userId, userName })
    }
  }

  stopTyping(roomId, userId) {
    if (this.socket) {
      this.socket.emit('typing-stop', { roomId, userId })
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback)
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on('user-stopped-typing', callback)
    }
  }

  // Online status
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user-online', callback)
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user-offline', callback)
    }
  }

  // Mark messages as read
  markAsRead(roomId, userId) {
    if (this.socket) {
      this.socket.emit('mark-read', { roomId, userId })
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages-read', callback)
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export default new WebSocketService()
