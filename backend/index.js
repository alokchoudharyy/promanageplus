const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// ✅ FIXED: Import auth middleware correctly
const authenticate = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// ═══════════════════════════════════════════════════════════
// ✅ PRODUCTION-READY SOCKET.IO CONFIGURATION
// ═══════════════════════════════════════════════════════════
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.CLIENT_URL,
        'https://promanageplus-frontend.vercel.app'
      ].filter(Boolean);
      
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

// ═══════════════════════════════════════════════════════════
// ✅ CORS Configuration
// ═══════════════════════════════════════════════════════════
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

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// ═══════════════════════════════════════════════════════════
// Supabase Client
// ═══════════════════════════════════════════════════════════
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ═══════════════════════════════════════════════════════════
// ✅ Email Transporter Configuration
// ═══════════════════════════════════════════════════════════
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.log('⚠️  Check EMAIL_USER and EMAIL_PASS environment variables');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ═══════════════════════════════════════════════════════════
// Optional Services
// ═══════════════════════════════════════════════════════════
let notificationService, aiService;

try {
  notificationService = require('./services/notificationService');
  console.log('✅ Notification service loaded');
} catch (err) {
  console.log('⚠️  Notification Service not found - notifications disabled');
}

try {
  aiService = require('./services/aiService');
  console.log('✅ AI service loaded');
} catch (err) {
  console.log('⚠️  AI Service not found - AI features disabled');
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ═══════════════════════════════════════════════════════════
// ✅ ACCEPT INVITE ENDPOINT - FULLY FIXED
// ═══════════════════════════════════════════════════════════
app.options('/accept-invite', cors());

app.post('/accept-invite', async (req, res) => {
  const { token, password, full_name, mobile } = req.body;

  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log('🔄 Accept invite request:', { token, full_name });

    // 1. Verify token
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (inviteError || !invite) {
      console.error('❌ Invalid token:', token);
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'Invitation already used' });
    }

    // 2. Create user in auth
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

    // 3. Create profile
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
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    console.log('✅ Profile created');

    // 4. Update invitation status
    await supabase
      .from('invites')
      .update({ status: 'accepted' })
      .eq('token', token);

    console.log('✅ Invitation marked as accepted');

    // 5. Send welcome email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `ProManage+ <${process.env.EMAIL_USER}>`,
          to: invite.email,
          subject: 'Welcome to ProManage+! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0891b2;">Welcome to ProManage+!</h1>
              <p>Hi <strong>${full_name}</strong>,</p>
              <p>Your account has been successfully created!</p>
              <a href="${process.env.CLIENT_URL}/login" 
                 style="display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Login Now
              </a>
            </div>
          `,
        });
        console.log('✅ Welcome email sent');
      } catch (emailError) {
        console.error('⚠️  Email sending failed:', emailError);
      }
    }

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
// EMPLOYEE MANAGEMENT
// ═══════════════════════════════════════════════════════════
app.post('/api/invite-employee', authenticate, async (req, res) => {
  const { email } = req.body;
  const manager_id = req.user.id;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${existingInvite.token}`;
      return res.json({
        success: true,
        inviteLink,
        message: 'Invitation already sent'
      });
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .insert({
        email,
        manager_id,
        token,
        expires_at,
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

    // Get manager info
    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', manager_id)
      .single();

    // Send invitation email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `ProManage+ <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `You're Invited to Join ProManage+ by ${managerProfile?.full_name || 'Your Manager'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #0891b2;">You're Invited to ProManage+!</h1>
              <p><strong>${managerProfile?.full_name || 'Your manager'}</strong> has invited you to join their team.</p>
              <a href="${inviteLink}" 
                 style="display: inline-block; padding: 14px 28px; background: #0891b2; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
                Accept Invitation
              </a>
              <p style="color: #64748b; font-size: 12px; margin-top: 30px;">Link: ${inviteLink}</p>
            </div>
          `,
        });
        console.log('✅ Invitation email sent to:', email);
      } catch (emailError) {
        console.error('⚠️  Email sending failed:', emailError);
      }
    }

    res.json({
      success: true,
      inviteLink,
      message: 'Invitation sent successfully'
    });

  } catch (err) {
    console.error('❌ Invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// PROFILE ROUTES
// ═══════════════════════════════════════════════════════════
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

// ✅ FIXED: Profile update
app.put('/api/profile', authenticate, async (req, res) => {
  try {
    const { full_name, mobile, notification_preferences } = req.body;

    const updates = {
      full_name,
      mobile,
      notification_preferences,
      updated_at: new Date().toISOString()
    };

    // Remove undefined
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: data 
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
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
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIXED: Use is_read instead of read
app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIXED: Notification send with correct function signature
app.post('/api/notifications/send', authenticate, async (req, res) => {
  try {
    const { userId, type, title, message, link, projectId } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!notificationService) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: type || 'info',
          title: title,
          message: message,
          link: link,
          project_id: projectId,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, notificationId: data.id });
    }

    // ✅ FIXED: Correct function call
    const result = await notificationService.sendNotification(
      userId,
      type || 'info',
      title,
      message,
      link,
      projectId
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Send notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// SOCKET.IO - CHAT
// ═══════════════════════════════════════════════════════════
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  let currentUserId = null;

  socket.on('ping', () => {
    socket.emit('pong');
  });

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
      console.log(`✅ User ${userId} online`);
    } catch (error) {
      console.error('❌ Presence error:', error);
    }
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`✅ User joined room: ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
  });

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

      io.to(roomId).emit('new-message', {
        ...savedMessage,
        sender: {
          id: senderId,
          full_name: senderName,
          role: senderRole,
        },
      });

      console.log(`✅ Message sent to room ${roomId}`);
    } catch (error) {
      console.error('❌ Message error:', error);
      socket.emit('message-error', { error: error.message });
    }
  });

  socket.on('typing-start', (data) => {
    const { roomId, userId, userName } = data;
    socket.to(roomId).emit('user-typing', { userId, userName });
  });

  socket.on('typing-stop', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user-stopped-typing', { userId });
  });

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
      console.error('❌ Mark read error:', error);
    }
  });

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
        console.log(`✅ User ${currentUserId} disconnected`);
      } catch (error) {
        console.error('❌ Disconnect error:', error);
      }
    }
  });
});

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
    console.error('❌ AI Analysis Error:', error);
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

// ═══════════════════════════════════════════════════════════
// TEST EMAIL
// ═══════════════════════════════════════════════════════════
app.post('/api/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email not configured' 
      });
    }
    
    await transporter.sendMail({
      from: `ProManage+ <${process.env.EMAIL_USER}>`,
      to: to || process.env.EMAIL_USER,
      subject: '✅ ProManage+ Email Test',
      html: '<h1>Email is working! 🎉</h1>'
    });
    
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('❌ Test email error:', error);
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
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🗄️  Database: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`🔔 Notifications: ${notificationService ? '✅ Enabled' : '⚠️  Disabled'}`);
  console.log(`🤖 AI Service: ${aiService ? '✅ Enabled' : '⚠️  Disabled'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Cron jobs
  try {
    const { startNotificationJobs } = require('./jobs/notificationJobs');
    
    if (process.env.ENABLE_CRON_JOBS === 'true') {
      startNotificationJobs();
      console.log('✅ Email notification cron jobs started');
    } else {
      console.log('⚠️  Cron jobs disabled (ENABLE_CRON_JOBS=false)');
    }
  } catch (error) {
    console.log('⚠️  Cron jobs not configured (optional)');
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
