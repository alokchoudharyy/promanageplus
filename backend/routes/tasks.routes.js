const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Optional: AI service for task analysis
let aiService;
try {
  aiService = require('../services/aiService');
} catch (err) {
  console.log('⚠️ AI Service not available');
}

// Optional: Notification service
let notificationService;
try {
  notificationService = require('../services/notificationService');
} catch (err) {
  console.log('⚠️ Notification Service not available');
}

// Apply authentication to all routes
router.use(authenticate);

// ═══════════════════════════════════════════════════════════
// CREATE TASK (with optional AI analysis)
// ═══════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const {
      project_id,
      title,
      description,
      assignee_id,
      priority,
      deadline,
      status,
      useAI // Flag to use AI analysis
    } = req.body;
    const userId = req.user.id;

    console.log('📥 Create task request:', { title, project_id, assignee_id });

    // Validate
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Optional: Get AI analysis
    let aiAnalysis = null;
    if (useAI && aiService) {
      try {
        const result = await aiService.analyzeTask(title, description || '');
        if (result.success) {
          aiAnalysis = result.data;
        }
      } catch (aiError) {
        console.warn('⚠️ AI analysis failed:', aiError.message);
      }
    }

    // Create task
    const taskData = {
      project_id,
      title: title.trim(),
      description: description?.trim() || null,
      assignee_id: assignee_id || null,
      created_by: userId,
      status: status || 'todo',
      priority: aiAnalysis?.priority || priority || 'medium',
      deadline: aiAnalysis?.suggestedDeadline || deadline || null,
      ai_analysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
    };

    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert(taskData)
      .select(`
        *,
        project:project_id(id, name),
        assignee:assignee_id(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .single();

    if (taskError) {
      console.error('❌ Task creation error:', taskError);
      throw taskError;
    }

    console.log('✅ Task created:', task.id);

    // ✅ Send notification to assignee
    if (assignee_id && assignee_id !== userId && notificationService) {
      try {
        const { data: assignee } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', assignee_id)
          .single();

        const { data: manager } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single();

        if (assignee && manager) {
          await notificationService.sendTaskAssignedEmail(
            {
              title: task.title,
              description: task.description,
              priority: task.priority,
              deadline: task.deadline,
              projectName: task.project?.name || 'N/A',
              managerName: manager.full_name,
            },
            assignee.email,
            assignee.full_name
          );
          console.log('✅ Task assignment email sent to:', assignee.email);
        }

        // Also create in-app notification
        await supabaseAdmin.from('notifications').insert({
          user_id: assignee_id,
          type: 'task_assigned',
          title: `New Task: ${task.title}`,
          message: `You have been assigned a new task in ${task.project?.name}`,
          link: `/employee/tasks`,
          task_id: task.id,
          project_id: task.project_id,
        });
      } catch (notifError) {
        console.warn('⚠️ Notification failed (non-critical):', notifError.message);
      }
    }

    // ✅ Add employee to project chat if not already there
    if (assignee_id && assignee_id !== userId) {
      try {
        const { data: chatRoom } = await supabaseAdmin
          .from('chat_rooms')
          .select('id')
          .eq('project_id', project_id)
          .eq('room_type', 'project')
          .maybeSingle();

        if (chatRoom) {
          // Check if already participant
          const { data: existing } = await supabaseAdmin
            .from('chat_participants')
            .select('id')
            .eq('room_id', chatRoom.id)
            .eq('user_id', assignee_id)
            .maybeSingle();

          if (!existing) {
            await supabaseAdmin.from('chat_participants').insert({
              room_id: chatRoom.id,
              user_id: assignee_id,
            });
            console.log('✅ Added assignee to project chat');
          }
        }
      } catch (chatError) {
        console.warn('⚠️ Chat participant addition failed (non-critical):', chatError.message);
      }
    }

    res.status(201).json({
      success: true,
      task,
      aiAnalysis: aiAnalysis || null,
    });
  } catch (error) {
    console.error('❌ Create task error:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET ALL TASKS (with filters)
// ═══════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, status, priority, assignee_id } = req.query;

    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        project:project_id(id, name, status),
        assignee:assignee_id(id, full_name, email, role),
        creator:created_by(id, full_name, email)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (project_id) query = query.eq('project_id', project_id);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (assignee_id) query = query.eq('assignee_id', assignee_id);

    const { data: tasks, error } = await query;

    if (error) throw error;

    res.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET SINGLE TASK
// ═══════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        project:project_id(id, name, status),
        assignee:assignee_id(id, full_name, email, role),
        creator:created_by(id, full_name, email),
        comments:task_comments(
          *,
          user:user_id(id, full_name, email)
        ),
        attachments:task_attachments(
          *,
          uploader:uploaded_by(id, full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Task not found' });
      }
      throw error;
    }

    res.json({ task });
  } catch (error) {
    console.error('❌ Get task error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch task' });
  }
});

// ═══════════════════════════════════════════════════════════
// UPDATE TASK (with reassignment email support)
// ═══════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assignee_id,
      status,
      priority,
      deadline,
    } = req.body;
    const userId = req.user.id;

    // ✅ Get old task data to check for reassignment
    const { data: oldTask, error: oldTaskError } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        project:project_id(id, name),
        old_assignee:assignee_id(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (oldTaskError) throw oldTaskError;

    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (deadline !== undefined) updates.deadline = deadline;

    // Mark as completed if status changed to 'done'
    if (status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:project_id(id, name),
        assignee:assignee_id(id, full_name, email)
      `)
      .single();

    if (error) throw error;

    console.log('✅ Task updated:', task.id);

    // ✅ Send email if task was reassigned to a different person
    if (
      assignee_id && 
      assignee_id !== oldTask.assignee_id && 
      assignee_id !== userId && 
      notificationService
    ) {
      try {
        const { data: newAssignee } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', assignee_id)
          .single();

        const { data: manager } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single();

        if (newAssignee && manager) {
          // Send assignment email to new assignee
          await notificationService.sendTaskAssignedEmail(
            {
              title: task.title,
              description: task.description,
              priority: task.priority,
              deadline: task.deadline,
              projectName: task.project?.name || 'N/A',
              managerName: manager.full_name,
            },
            newAssignee.email,
            newAssignee.full_name
          );
          console.log('✅ Task reassignment email sent to:', newAssignee.email);
        }

        // Create in-app notification for new assignee
        await supabaseAdmin.from('notifications').insert({
          user_id: assignee_id,
          type: 'task_assigned',
          title: `Task Re-assigned: ${task.title}`,
          message: `You have been assigned to "${task.title}" in ${task.project?.name}`,
          link: `/employee/tasks`,
          task_id: task.id,
          project_id: task.project_id,
        });

        // ✅ Notify old assignee that task was reassigned
        if (oldTask.assignee_id && oldTask.assignee_id !== assignee_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: oldTask.assignee_id,
            type: 'task_unassigned',
            title: `Task Reassigned: ${task.title}`,
            message: `"${task.title}" has been reassigned to another team member`,
            link: `/employee/tasks`,
            task_id: task.id,
            project_id: task.project_id,
          });
        }

      } catch (notifError) {
        console.warn('⚠️ Reassignment notification failed (non-critical):', notifError.message);
      }
    }

    // ✅ Send completion email if status changed to done
    if (
      status === 'done' && 
      oldTask.status !== 'done' && 
      task.assignee_id && 
      notificationService
    ) {
      try {
        const { data: manager } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', task.created_by)
          .single();

        const { data: employee } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', task.assignee_id)
          .single();

        if (manager?.email && employee) {
          await notificationService.sendTaskCompletedEmail(
            {
              title: task.title,
              projectName: task.project?.name || 'N/A',
              projectId: task.project_id
            },
            manager.email,
            manager.full_name,
            employee.full_name
          );
          console.log('✅ Task completion email sent to:', manager.email);
        }

        // In-app notification to manager
        await supabaseAdmin.from('notifications').insert({
          user_id: task.created_by,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${employee?.full_name || 'Team member'} completed "${task.title}"`,
          link: `/projects/${task.project_id}/tasks`,
          task_id: task.id,
          project_id: task.project_id,
        });

      } catch (completionError) {
        console.warn('⚠️ Completion notification failed (non-critical):', completionError.message);
      }
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ Update task error:', error);
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

// ═══════════════════════════════════════════════════════════
// UPDATE TASK STATUS (for drag-and-drop)
// ═══════════════════════════════════════════════════════════
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // ✅ Get old task data to check status change
    const { data: oldTask } = await supabaseAdmin
      .from('tasks')
      .select('status, assignee_id, created_by, project_id, title')
      .eq('id', id)
      .single();

    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Mark as completed if moved to 'done'
    if (status === 'done') {
      updates.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:project_id(name),
        assignee:assignee_id(full_name),
        manager:created_by(full_name, email)
      `)
      .single();

    if (error) throw error;

    console.log('✅ Task status updated:', task.id, '→', status);

    // ✅ Send completion email if status changed to done
    if (
      status === 'done' && 
      oldTask.status !== 'done' && 
      task.created_by && 
      notificationService
    ) {
      try {
        if (task.manager?.email && task.assignee) {
          await notificationService.sendTaskCompletedEmail(
            {
              title: task.title,
              projectName: task.project?.name || 'N/A',
              projectId: task.project_id
            },
            task.manager.email,
            task.manager.full_name,
            task.assignee.full_name
          );
          console.log('✅ Completion email sent (drag-drop):', task.manager.email);
        }

        // In-app notification
        await supabaseAdmin.from('notifications').insert({
          user_id: task.created_by,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${task.assignee?.full_name || 'Team member'} completed "${task.title}"`,
          link: `/projects/${task.project_id}/tasks`,
          task_id: task.id,
          project_id: task.project_id,
        });

      } catch (notifError) {
        console.warn('⚠️ Completion notification failed (non-critical):', notifError.message);
      }
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ Update task status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update task status' });
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE TASK
// ═══════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Task deleted:', id);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Delete task error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

module.exports = router;
