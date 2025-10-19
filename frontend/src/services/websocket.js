import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.typingTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId, userName) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting to WebSocket:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // ✅ ADDED: polling fallback
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000, // ✅ ADDED
      timeout: 20000, // ✅ ADDED
      autoConnect: true,
      forceNew: false, // ✅ ADDED
      withCredentials: true // ✅ ADDED for CORS
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.reconnectAttempts = 0; // ✅ ADDED: Reset on successful connect
      this.socket.emit('authenticate', userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // ✅ ADDED: Auto reconnect if server disconnected
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++; // ✅ ADDED
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnect attempts reached');
      }
    });

    // ✅ ADDED: Reconnect handler
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      this.socket.emit('authenticate', userId);
    });

    // ✅ ADDED: Keepalive ping/pong for Render
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 25000);

    this.socket.on('pong', () => {
      console.log('🏓 Pong received');
    });

    return this.socket;
  }

  // ═══════════════════════════════════════════════════════════
  // CHAT METHODS (Keep all your existing methods)
  // ═══════════════════════════════════════════════════════════

  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join-room', roomId);
      console.log('📥 Joined room:', roomId);
    }
  }

  leaveRoom(roomId) {
    if (this.socket) {
      this.socket.emit('leave-room', roomId);
      console.log('📤 Left room:', roomId);
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
      });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new-message');
    }
  }

  // ✅ ADDED: Message error handler
  onMessageError(callback) {
    if (this.socket) {
      this.socket.on('message-error', callback);
    }
  }

  // Typing indicators
  startTyping(roomId, userId, userName) {
    if (this.socket) {
      this.socket.emit('typing-start', { roomId, userId, userName });
    }
  }

  stopTyping(roomId, userId) {
    if (this.socket) {
      this.socket.emit('typing-stop', { roomId, userId });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on('user-stopped-typing', callback);
    }
  }

  // Online status
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user-online', callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user-offline', callback);
    }
  }

  // Mark messages as read
  markAsRead(roomId, userId) {
    if (this.socket) {
      this.socket.emit('mark-read', { roomId, userId });
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages-read', callback);
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔴 Socket manually disconnected');
    }
  }

  // ✅ ADDED: Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();
