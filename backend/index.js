const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import auth middleware
const { authenticate } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// ✅ PRODUCTION-READY SOCKET.IO CONFIGURATION
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.CLIENT_URL,
        'https://promanageplus-frontend.vercel.app'
      ].filter(Boolean);
      
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  // ✅ CRITICAL FOR RENDER DEPLOYMENT
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
  path: '/socket.io/',
  allowUpgrades: true,
  perMessageDeflate: false,
  httpCompression: false
});

const PORT = process.env.PORT || 5000;

// ✅ CORS Configuration for Production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  'https://promanageplus-frontend.vercel.app',
];

const validOrigins = allowedOrigins.filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (validOrigins.includes(origin)) {
      callback(null, true);
    } else if (origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Email transporter with production settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-char App Password
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.log('   Check EMAIL_USER and EMAIL_PASS environment variables');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Optional services (load with error handling)
let notificationService, aiService;

try {
  notificationService = require('./services/notificationService');
  console.log('✅ Notification service loaded');
} catch (err) {
  console.log('⚠️ Notification Service not found - notifications disabled');
}

try {
  aiService = require('./services/aiService');
  console.log('✅ AI service loaded');
} catch (err) {
  console.log('⚠️ AI Service not found - AI features disabled');
}

// ═══════════════════════════════════════════════════════════
// BASIC ENDPOINTS
// ═══════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.json({ 
    message: 'ProManage+ API is running',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ═══════════════════════════════════════════════════════════
// EMPLOYEE MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Create employee (non-API route for backward compatibility)
app.post('/create-employee', authenticate, async (req, res) => {
  const { email, full_name, mobile, password } = req.body;
  const manager_id = req.user.id;

  try {
    const finalPassword = password || Math.random().toString(36).slice(-8);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      full_name,
      mobile: mobile || '',
      role: 'employee',
      manager_id,
    });

    if (profileError) throw profileError;

    res.json({ 
      success: true, 
      message: 'Employee created successfully',
      userId: authData.user.id 
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create employee endpoint with auth (API route)
app.post('/api/create-employee', authenticate, async (req, res) => {
  const { email, full_name, mobile, password } = req.body;
  const manager_id = req.user.id;

  try {
    const finalPassword = password || Math.random().toString(36).slice(-8);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      full_name,
      mobile: mobile || '',
      role: 'employee',
      manager_id,
    });

    if (profileError) throw profileError;

    // Send welcome email if password was auto-generated
    if (!password && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"ProManage+ 📋" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to ProManage+',
        html: `
          <h2>Welcome to ProManage+!</h2>
          <p>Your account has been created.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${finalPassword}</p>
          <p>Please login and change your password.</p>
          <a href="${process.env.CLIENT_URL}/login">Login Now</a>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent to:', email);
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ 
      success: true, 
      message: 'Employee created successfully',
      userId: authData.user.id 
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invite employee (non-API route)
app.post('/invite-employee', authenticate, async (req, res) => {
  const { email } = req.body;
  const manager_id = req.user.id;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: inviteError } = await supabase.from('invites').insert({
      email,
      manager_id,
      token,
      expires_at
    });

    if (inviteError) throw inviteError;

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

    res.json({ 
      success: true,
      inviteLink,
      message: 'Invitation created successfully' 
    });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Invite employee endpoint with auth (API route)
app.post('/api/invite-employee', authenticate, async (req, res) => {
  const { email } = req.body;
  const manager_id = req.user.id;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .insert({
        email,
        manager_id,
        token,
        expires_at
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

    res.json({ 
      success: true,
      inviteLink,
      message: 'Invitation created successfully' 
    });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send invitation endpoint (legacy - with email)
app.post('/api/send-invitation', async (req, res) => {
  const { email, manager_id, manager_name } = req.body;

  try {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: inviteError } = await supabase.from('invites').insert({
      email,
      token,
      manager_id,
      expires_at,
    });

    if (inviteError) throw inviteError;

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"ProManage+ 📋" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'You have been invited to ProManage+',
        html: `
          <h2>You're Invited to Join ProManage+!</h2>
          <p>${manager_name} has invited you to join their team.</p>
          <p>Click the link below to create your account:</p>
          <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#06b6d4;color:white;text-decoration:none;border-radius:6px;">Accept Invitation</a>
          <p>This invitation expires in 7 days.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Invitation email sent to:', email);
    }

    res.json({ success: true, message: 'Invitation sent successfully', inviteLink });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// PROFILE & AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// Import controllers
const authController = require('./src/controllers/auth.controller');

// Profile update endpoint
app.put('/api/profile', authenticate, authController.updateProfile);

// Get current user profile
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ACCEPT INVITE ENDPOINT
// ═══════════════════════════════════════════════════════════

// Handle OPTIONS preflight for accept-invite
app.options('/accept-invite', cors());

app.post('/accept-invite', async (req, res) => {
  const { token, password, full_name, mobile } = req.body;

  // Add CORS headers explicitly
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log('📨 Accept invite request:', { token, full_name });

    // 1. Verify token from invites table
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('❌ Invalid token:', token);
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    // Check if token expired
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if already used
    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'Invitation already used' });
    }

    // 2. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        mobile: mobile || '',
        role: 'employee'
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    console.log('✅ User created in auth:', authData.user.id);

    // 3. Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: invite.email,
        full_name: full_name,
        mobile: mobile || '',
        role: 'employee',
        manager_id: invite.manager_id
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return res.status(400).json({ error: profileError.message });
    }

    console.log('✅ Profile created');

    // 4. Update invitation status
    await supabase
      .from('invites')
      .update({ status: 'accepted' })
      .eq('token', token);

    console.log('✅ Invitation marked as accepted');

    res.json({ 
      success: true, 
      message: 'Account created successfully',
      userId: authData.user.id
    });

  } catch (error) {
    console.error('❌ Accept invite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// NOTIFICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Send generic notification
app.post('/api/notifications/send', authenticate, async (req, res) => {
  try {
    const { userId, type, title, message, link, projectId } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!notificationService) {
      // Fallback: just save to database without email
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: type || 'info',
          title: title,
          message: message,
          link: link,
          project_id: projectId,
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({ success: true, notificationId: data.id });
    }

    const result = await notificationService.sendNotification({
      userId,
      type: type || 'info',
      title,
      message,
      link,
      projectId
    });

    res.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user notifications
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ notifications: data || [] });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
app.patch('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// SOCKET.IO - CHAT FUNCTIONALITY
// ═══════════════════════════════════════════════════════════

const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);
  
  let currentUserId = null;

  // ✅ Keepalive ping/pong for Render
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // User authentication
  socket.on('authenticate', async (userId) => {
    currentUserId = userId;
    activeUsers.set(userId, socket.id);
    
    try {
      await supabase
        .from('user_presence')
        .upsert({ 
          user_id: userId, 
          is_online: true, 
          last_seen: new Date().toISOString() 
        });
      
      io.emit('user-online', { userId, isOnline: true });
      console.log(`✅ User ${userId} authenticated and online`);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  });

  // Join chat room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 User ${currentUserId} joined room: ${roomId}`);
  });

  // Leave chat room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`📤 User ${currentUserId} left room: ${roomId}`);
  });

  // Send message
  socket.on('send-message', async (data) => {
    const { roomId, message, senderId, senderName, senderRole, messageType, fileData } = data;
    
    try {
      const { data: savedMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: senderId,
          message_text: message,
          message_type: messageType || 'text',
          file_url: fileData?.url || null,
          file_name: fileData?.name || null,
          file_size: fileData?.size || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Broadcast to room with sender info
      io.to(roomId).emit('new-message', {
        ...savedMessage,
        sender: {
          id: senderId,
          full_name: senderName,
          role: senderRole,
        },
      });

      console.log(`💬 Message sent to room ${roomId} by ${senderName}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('message-error', { error: error.message });
    }
  });

  // Typing indicators
  socket.on('typing-start', (data) => {
    const { roomId, userId, userName } = data;
    socket.to(roomId).emit('user-typing', { userId, userName });
  });

  socket.on('typing-stop', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user-stopped-typing', { userId });
  });

  // Mark messages as read
  socket.on('mark-read', async (data) => {
    const { roomId, userId } = data;
    
    try {
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      
      socket.to(roomId).emit('messages-read', { roomId, userId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Disconnect handler
  socket.on('disconnect', async () => {
    if (currentUserId) {
      activeUsers.delete(currentUserId);
      
      try {
        await supabase
          .from('user_presence')
          .upsert({ 
            user_id: currentUserId, 
            is_online: false, 
            last_seen: new Date().toISOString() 
          });
        
        io.emit('user-offline', { userId: currentUserId, isOnline: false });
        console.log(`🔴 User ${currentUserId} disconnected`);
      } catch (error) {
        console.error('Error updating presence on disconnect:', error);
      }
    }
  });
});

// Get online users
app.get('/api/online-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_presence')
      .select('user_id, is_online, last_seen')
      .eq('is_online', true);

    if (error) throw error;
    res.json({ users: data || [], count: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// AI ENDPOINTS
// ═══════════════════════════════════════════════════════════

app.post('/api/ai/analyze-task', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!aiService) {
      return res.json({
        success: false,
        data: {
          priority: 'medium',
          estimatedDays: 7,
          complexity: 'moderate',
          suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reasoning: 'AI service not available',
          suggestions: []
        }
      });
    }

    const result = await aiService.analyzeTask(title, description);
    res.json(result);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: {
        priority: 'medium',
        estimatedDays: 7,
        complexity: 'moderate',
        suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reasoning: 'AI service error',
        suggestions: []
      }
    });
  }
});

app.post('/api/ai/suggest-priority', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!aiService) {
      return res.json({ success: false, priority: 'medium' });
    }
    const result = await aiService.suggestPriority(title, description);
    res.json(result);
  } catch (error) {
    console.error('Priority Suggestion Error:', error);
    res.json({ success: false, priority: 'medium' });
  }
});

app.post('/api/ai/suggest-deadline', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!aiService) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      return res.json({ 
        success: false, 
        estimatedDays: 7,
        suggestedDeadline: deadline.toISOString().split('T')[0]
      });
    }
    const result = await aiService.suggestDeadline(title, description);
    res.json(result);
  } catch (error) {
    console.error('Deadline Suggestion Error:', error);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    res.json({ 
      success: false, 
      estimatedDays: 7,
      suggestedDeadline: deadline.toISOString().split('T')[0]
    });
  }
});

app.post('/api/ai/get-tips', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!aiService) {
      return res.json({ 
        success: false, 
        tips: ['Break down into steps', 'Set milestones', 'Track progress'] 
      });
    }
    const result = await aiService.getTaskTips(title, description);
    res.json(result);
  } catch (error) {
    console.error('Tips Generation Error:', error);
    res.json({ 
      success: false, 
      tips: ['Break down into steps', 'Set milestones', 'Track progress'] 
    });
  }
});

// ═══════════════════════════════════════════════════════════
// EMAIL NOTIFICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════

if (notificationService) {
  app.post('/api/notifications/task-assigned', async (req, res) => {
    try {
      const { taskId, assigneeId, managerId } = req.body;

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id (name),
          manager:created_by (full_name, email)
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      const { data: assignee, error: assigneeError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', assigneeId)
        .single();

      if (assigneeError) throw assigneeError;

      const result = await notificationService.sendTaskAssignedEmail(
        {
          title: task.title,
          description: task.description,
          priority: task.priority,
          deadline: task.deadline,
          projectName: task.project?.name || 'N/A',
          managerName: task.manager?.full_name || 'Your Manager',
        },
        assignee.email,
        assignee.full_name
      );

      res.json(result);
    } catch (error) {
      console.error('Error sending task assigned email:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/notifications/task-completed', async (req, res) => {
    try {
      const { taskId, userId } = req.body;

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id (name, id),
          assignee:assigned_to (full_name),
          manager:created_by (full_name, email)
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      if (!task.manager?.email) {
        return res.json({ success: false, error: 'Manager email not found' });
      }

      const result = await notificationService.sendTaskCompletedEmail(
        {
          title: task.title,
          projectName: task.project?.name || 'N/A',
          projectId: task.project?.id || '',
        },
        task.manager.email,
        task.manager.full_name,
        task.assignee?.full_name || 'Team Member'
      );

      res.json(result);
    } catch (error) {
      console.error('Error sending task completed email:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/notifications/deadline-reminder', async (req, res) => {
    try {
      const { taskId } = req.body;

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to (full_name, email)
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      if (!task.assignee?.email) {
        return res.json({ success: false, error: 'Assignee email not found' });
      }

      const result = await notificationService.sendDeadlineReminderEmail(
        {
          title: task.title,
          deadline: task.deadline,
        },
        task.assignee.email,
        task.assignee.full_name
      );

      res.json(result);
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/notifications/daily-digest', async (req, res) => {
    try {
      const { userId } = req.body;

      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('full_name, email, notification_preferences')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const prefs = user.notification_preferences || {};
      if (prefs.dailyDigest === false) {
        return res.json({ success: false, message: 'Daily digest disabled for user' });
      }

      const result = await notificationService.sendDailyDigestEmail(
        userId,
        user.email,
        user.full_name
      );

      res.json(result);
    } catch (error) {
      console.error('Error sending daily digest:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/notifications/daily-digest-all', async (req, res) => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, notification_preferences')
        .neq('email', null);

      if (error) throw error;

      const results = [];
      for (const user of users) {
        const prefs = user.notification_preferences || {};
        if (prefs.dailyDigest !== false) {
          const result = await notificationService.sendDailyDigestEmail(
            user.id,
            user.email,
            user.full_name
          );
          results.push({ userId: user.id, ...result });
        }
      }

      res.json({ 
        success: true, 
        message: `Sent ${results.length} daily digests`,
        results 
      });
    } catch (error) {
      console.error('Error sending bulk daily digests:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email not configured. Set EMAIL_USER and EMAIL_PASS environment variables.' 
      });
    }
    
    const mailOptions = {
      from: `"ProManage+ Test 📧" <${process.env.EMAIL_USER}>`,
      to: to || process.env.EMAIL_USER,
      subject: '✅ ProManage+ Email Test',
      html: '<h1>Email is working! 🎉</h1><p>Your email configuration is correct.</p>'
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method 
  });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log('\n🚀 ═══════════════════════════════════════════════════════════');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🗄️  Database: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`🔔 Notifications: ${notificationService ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`🤖 AI Service: ${aiService ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    const { startNotificationJobs } = require('./jobs/notificationJobs');
    
    if (process.env.ENABLE_CRON_JOBS === 'true') {
      startNotificationJobs();
      console.log('📧 Email notification cron jobs started');
    } else {
      console.log('📧 Cron jobs disabled (ENABLE_CRON_JOBS=false)');
    }
  } catch (error) {
    console.log('📧 Cron jobs not configured (optional feature)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('🛑 HTTP server closed');
    process.exit(0);
  });
});
