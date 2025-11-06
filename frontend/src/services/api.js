// frontend/src/services/api.js

import { supabase } from '../supabaseClient'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// ═══════════════════════════════════════════════════════════
// TASKS API - FIXED VERSION
// ═══════════════════════════════════════════════════════════

export const tasksAPI = {
  // Get all tasks
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(id, name, status),
          assignee:assignee_id(id, full_name, email, role),
          creator:created_by(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (filters.project_id) query = query.eq('project_id', filters.project_id)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.priority) query = query.eq('priority', filters.priority)
      if (filters.assignee_id) query = query.eq('assignee_id', filters.assignee_id)

      const { data, error } = await query

      if (error) throw error
      return { data: data || [] }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  },

  // Get single task
  getById: async (id) => {
    try {
      const { data, error } = await supabase
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
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error('Error fetching task:', error)
      throw error
    }
  },

  // Create task
  create: async (taskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          assignee_id: taskData.assignee_id || null, // ✅ FIXED
        })
        .select(`
          *,
          project:project_id(id, name),
          assignee:assignee_id(id, full_name, email)
        `)
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Update task
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          assignee_id: updates.assignee_id !== undefined ? updates.assignee_id : undefined, // ✅ FIXED
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          project:project_id(id, name),
          assignee:assignee_id(id, full_name, email)
        `)
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Update task status (for drag-and-drop)
  updateStatus: async (id, status) => {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'done') {
        updates.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          project:project_id(id, name),
          assignee:assignee_id(id, full_name, email)
        `)
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error('Error updating task status:', error)
      throw error
    }
  },

  // Delete task
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },
}

// ═══════════════════════════════════════════════════════════
// PROJECTS API - FIXED VERSION
// ═══════════════════════════════════════════════════════════

export const projectsAPI = {
  // Get all projects
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:created_by(full_name, email),
          tasks:tasks(id, status)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [] }
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },

  // Get single project with tasks
  getById: async (id) => {
    try {
      const { data, error } = await supabase
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
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  },

  // Create project
  create: async (projectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  // Update project
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  },

  // Delete project
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  },
}

export default {
  tasks: tasksAPI,
  projects: projectsAPI,
}
