const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// ═══════════════════════════════════════════════════════════
// CREATE PROJECT + AUTO-CREATE CHAT ROOM
// ═══════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { name, description, priority, start_date, end_date } = req.body;
    const userId = req.user.id;

    console.log('📥 Create project request:', { name, userId });

    // Validate
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Create project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        priority: priority || 'medium',
        start_date: start_date || null,
        end_date: end_date || null,
        status: 'active',
        created_by: userId,
        manager_id: userId,
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Project creation error:', projectError);
      throw projectError;
    }

    console.log('✅ Project created:', project.id);

    // ✅ AUTO-CREATE CHAT ROOM for this project
    const { data: chatRoom, error: roomError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        name: `${project.name} - Team Chat`,
        room_type: 'project',
        project_id: project.id,
        created_by: userId,
      })
      .select()
      .single();

    if (roomError) {
      console.error('❌ Chat room creation error:', roomError);
      // Don't fail project creation if chat room fails
    } else {
      console.log('✅ Chat room created:', chatRoom.id);

      // Add manager as participant
      await supabaseAdmin.from('chat_participants').insert({
        room_id: chatRoom.id,
        user_id: userId,
      });
    }

    res.status(201).json({ 
      success: true, 
      project,
      chatRoom: chatRoom || null
    });
  } catch (error) {
    console.error('❌ Create project error:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET ALL PROJECTS (for logged-in manager)
// ═══════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        creator:created_by(full_name, email),
        tasks:tasks(id, status)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate task stats for each project
    const projectsWithStats = projects.map(project => ({
      ...project,
      taskStats: {
        total: project.tasks?.length || 0,
        todo: project.tasks?.filter(t => t.status === 'todo').length || 0,
        inProgress: project.tasks?.filter(t => t.status === 'in-progress').length || 0,
        done: project.tasks?.filter(t => t.status === 'done').length || 0,
      }
    }));

    res.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('❌ Get projects error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET SINGLE PROJECT
// ═══════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        creator:created_by(full_name, email),
        tasks:tasks(
          *,
          assignee:assignee_id(id, full_name, email)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Project not found' });
      }
      throw error;
    }

    res.json({ project });
  } catch (error) {
    console.error('❌ Get project error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch project' });
  }
});

// ═══════════════════════════════════════════════════════════
// UPDATE PROJECT
// ═══════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority, start_date, end_date } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('created_by')
      .eq('id', id)
      .single();

    if (checkError || !existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (existingProject.created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }

    // Update project
    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, project });
  } catch (error) {
    console.error('❌ Update project error:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE PROJECT
// ═══════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('created_by')
      .eq('id', id)
      .single();

    if (checkError || !existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (existingProject.created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    // Delete project (cascades to tasks, chat rooms, etc.)
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Delete project error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET PROJECT CHAT ROOM
// ═══════════════════════════════════════════════════════════
router.get('/:id/chat-room', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get or create chat room
    let { data: chatRoom, error } = await supabaseAdmin
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_participants(
          user:user_id(id, full_name, email, role)
        )
      `)
      .eq('project_id', id)
      .eq('room_type', 'project')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    // If no chat room exists, create one
    if (!chatRoom) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('name, created_by')
        .eq('id', id)
        .single();

      const { data: newRoom, error: createError } = await supabaseAdmin
        .from('chat_rooms')
        .insert({
          name: `${project.name} - Team Chat`,
          room_type: 'project',
          project_id: id,
          created_by: project.created_by,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add creator as participant
      await supabaseAdmin.from('chat_participants').insert({
        room_id: newRoom.id,
        user_id: project.created_by,
      });

      chatRoom = newRoom;
    }

    // Ensure current user is a participant
    const isParticipant = chatRoom.participants?.some(p => p.user.id === userId);
    if (!isParticipant) {
      await supabaseAdmin.from('chat_participants').insert({
        room_id: chatRoom.id,
        user_id: userId,
      });
    }

    res.json({ chatRoom });
  } catch (error) {
    console.error('❌ Get chat room error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat room' });
  }
});

module.exports = router;
