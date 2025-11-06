const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// ═══════════════════════════════════════════════════════════
// IMPORTS - Middleware & Config
// ═══════════════════════════════════════════════════════════
const { authenticate } = require('./middleware/auth');
const { supabaseAdmin } = require('./config/supabase');

// ═══════════════════════════════════════════════════════════
// IMPORTS - Route Handlers
// ═══════════════════════════════════════════════════════════
const employeeRouter = require('./routes/employees');
const projectRouter = require('./routes/projects.routes');
const taskRouter = require('./routes/tasks.routes');

// ═══════════════════════════════════════════════════════════
// OPTIONAL SERVICES
// ═══════════════════════════════════════════════════════════
let notificationService, aiService;

try {
  notificationService = require('./services/notificationService');
  console.log('✅ Notification Service loaded');
} catch (err) {
  console.log('⚠️ Notification Service not found');
}

try {
  aiService = require('./services/aiService');
  console.log('✅ AI Service loaded');
} catch (err) {
  console.log('⚠️ AI Service not found');
}

// ═══════════════════════════════════════════════════════════
// EXPRESS & SOCKET.IO SETUP
// ═══════════════════════════════════════════════════════════
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        process.env.CLIENT_URL,
        'https://promanage-app.vercel.app'
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ═══════════════════════════════════════════════════════════
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  'https://promanage-app.vercel.app',
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

app.use(express.json());

// ═══════════════════════════════════════════════════════════
// PUBLIC SUPABASE CLIENT (for reads if needed)
// ═══════════════════════════════════════════════════════════
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ═══════════════════════════════════════════════════════════
// LOGGING MIDDLEWARE
// ═══════════════════════════════════════════════════════════
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  next();
});

// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════
app.use('/api/employees', employeeRouter);
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);

console.log('✅ Routes loaded: /api/employees, /api/projects, /api/tasks');

// ═══════════════════════════════════════════════════════════
// BASIC HEALTH CHECK
// ═══════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({ 
    message: 'ProManage+ API is running',
    version: '1.0.0',
    endpoints: {
      employees: '/api/employees',
      projects: '/api/projects',
      tasks: '/api/tasks',
      ai: '/api/ai/*',
      notifications: '/api/notifications/*',
      onlineUsers: '/api/online-users'
    }
  });
});

// ═══════════════════════════════════════════════════════════
// SOCKET.IO - REAL-TIME CHAT & PRESENCE
// ═══════════════════════════════════════════════════════════
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);
  
  let currentUserId = null;

  socket.on('authenticate', async (userId) => {
    currentUserId = userId;
    activeUsers.set(userId, socket.id);
    
    try {
      await supabaseAdmin.from('user_presence').upsert({ 
        user_id: userId, 
        is_online: true, 
        last_seen: new Date().toISOString() 
      });
      
      io.emit('user-online', { userId, isOnline: true });
      console.log(`✅ User ${userId} authenticated`);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 User joined room: ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`📤 User left room: ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    const { roomId, message, senderId, senderName, senderRole, messageType, fileData } = data;
    
    try {
      const { data: savedMessage, error } = await supabaseAdmin.from('chat_messages')
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

      console.log(`💬 Message sent to room ${roomId}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
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
      await supabaseAdmin.from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      
      socket.to(roomId).emit('messages-read', { roomId, userId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', async () => {
    if (currentUserId) {
      activeUsers.delete(currentUserId);
      
      try {
        await supabaseAdmin.from('user_presence').upsert({ 
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

// ═══════════════════════════════════════════════════════════
// ONLINE USERS ENDPOINT
// ═══════════════════════════════════════════════════════════
app.get('/api/online-users', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_presence')
      .select('user_id, is_online, last_seen')
      .eq('is_online', true);

    if (error) throw error;
    res.json({ users: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// AI ENDPOINTS (Groq Integration)
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
// NOTIFICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════
if (notificationService) {
  app.post('/api/notifications/task-assigned', async (req, res) => {
    try {
      const { taskId, assigneeId, managerId } = req.body;

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          project:project_id (name),
          manager:created_by (full_name, email)
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      const { data: assignee, error: assigneeError } = await supabaseAdmin
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

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          project:project_id (name, id),
          assignee:assignee_id (full_name),
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

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (full_name, email)
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

      const { data: user, error: userError } = await supabaseAdmin
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
      const { data: users, error } = await supabaseAdmin
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

// ═══════════════════════════════════════════════════════════
// ✅ NEW: SOCKET EVENT - TASK STATUS UPDATE WITH EMAIL
// ═══════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  // ... existing connection handlers above ...

  // ✅ NEW: Handle task status updates from drag-and-drop
  socket.on('task-status-updated', async (data) => {
    const { taskId, newStatus, projectId } = data;
    
    console.log(`🔄 Task status updated: ${taskId} -> ${newStatus}`);

    // ✅ Send completion email when task moved to "done"
    if (newStatus === 'done' && notificationService) {
      try {
        const { data: task, error: taskError } = await supabaseAdmin
          .from('tasks')
          .select(`
            *,
            project:project_id (name),
            assignee:assignee_id (full_name),
            manager:created_by (full_name, email)
          `)
          .eq('id', taskId)
          .single();

        if (taskError) throw taskError;

        // Send in-app notification
        if (task.created_by) {
          await supabaseAdmin.from('notifications').insert({
            user_id: task.created_by,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${task.title}" has been completed by ${task.assignee?.full_name || 'team member'}`,
            link: `/projects/${projectId}/tasks`,
            task_id: taskId,
            project_id: projectId,
          });
        }

        // ✅ Send email to manager
        if (task.manager?.email && task.assignee) {
          await notificationService.sendTaskCompletedEmail(
            {
              title: task.title,
              projectName: task.project?.name || 'N/A',
              projectId: projectId
            },
            task.manager.email,
            task.manager.full_name,
            task.assignee.full_name
          );
          console.log('✅ Task completion email sent to:', task.manager.email);
        }
      } catch (emailError) {
        console.warn('⚠️ Task completion email failed (non-critical):', emailError.message);
      }
    }

    // ✅ Send "task started" email when moved to in-progress
    if (newStatus === 'in-progress' && notificationService) {
      try {
        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select(`
            *,
            assignee:assignee_id (full_name),
            manager:created_by (email, full_name)
          `)
          .eq('id', taskId)
          .single();

        // In-app notification
        if (task.created_by) {
          await supabaseAdmin.from('notifications').insert({
            user_id: task.created_by,
            type: 'task_started',
            title: 'Task Started',
            message: `${task.assignee?.full_name || 'Team member'} started working on "${task.title}"`,
            link: `/projects/${projectId}/tasks`,
            task_id: taskId,
            project_id: projectId,
          });
        }

        console.log('✅ Task started notification created');
      } catch (error) {
        console.warn('⚠️ Task started notification failed:', error.message);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════
server.listen(PORT, () => {
  console.log('\n🚀 ════════════════════════════════════════════════════');
  console.log(`   ProManage+ Backend Server`);
  console.log('   ════════════════════════════════════════════════════');
  console.log(`   🌐 API Server: http://localhost:${PORT}`);
  console.log(`   🔌 Socket.IO: http://localhost:${PORT}`);
  console.log('   ════════════════════════════════════════════════════');
  console.log('   📌 Routes:');
  console.log('      • POST /api/employees/create-employee (auth)');
  console.log('      • GET  /api/projects (auth)');
  console.log('      • POST /api/projects (auth)');
  console.log('      • GET  /api/tasks (auth)');
  console.log('      • POST /api/tasks (auth)');
  console.log('      • POST /api/ai/analyze-task');
  console.log('      • POST /api/notifications/*');
  console.log('   📧 Email Notifications:');
  console.log('      • Task Assignment → Real-time email ✅');
  console.log('      • Task Completion → Real-time email ✅');
  console.log('      • Task Started → In-app notification ✅');
  console.log('   ════════════════════════════════════════════════════\n');
  
  // Start cron jobs if enabled
  try {
    const { startNotificationJobs } = require('./jobs/notificationJobs');
    
    if (process.env.ENABLE_CRON_JOBS === 'true') {
      startNotificationJobs();
      console.log('   📧 Email cron jobs: ENABLED');
    } else {
      console.log('   📧 Email cron jobs: DISABLED (set ENABLE_CRON_JOBS=true)');
    }
  } catch (error) {
    console.log('   📧 Cron jobs not configured (optional)');
  }
  
  console.log('\n');
});
