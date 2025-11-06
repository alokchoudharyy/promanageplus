import { supabase } from '../supabaseClient'

// ═══════════════════════════════════════════════════════════
// NOTIFICATION HELPER SERVICE
// ═══════════════════════════════════════════════════════════

/**
 * Send in-app notification
 */
export const sendNotification = async ({
  userId,
  type,
  title,
  message,
  link = null,
  taskId = null,
  projectId = null,
}) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      task_id: taskId,
      project_id: projectId,
      is_read: false,
    })

    if (error) throw error
    console.log('✅ Notification sent:', { userId, type, title })
    return { success: true }
  } catch (error) {
    console.error('❌ Notification error:', error)
    return { success: false, error }
  }
}

/**
 * Send notification to all employees of a manager
 */
export const notifyAllEmployees = async (managerId, notification) => {
  try {
    // Get all employees
    const { data: employees, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('manager_id', managerId)
      .eq('role', 'employee')

    if (error) throw error

    // Send notification to each
    const promises = employees.map(employee =>
      sendNotification({ userId: employee.id, ...notification })
    )

    await Promise.all(promises)
    console.log(`✅ Notified ${employees.length} employees`)
    return { success: true, count: employees.length }
  } catch (error) {
    console.error('❌ Bulk notification error:', error)
    return { success: false, error }
  }
}

/**
 * Get task details for notification
 */
export const getTaskDetails = async (taskId) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        project_id,
        assignee_id ,
        created_by,
        project:project_id(name)
      `)
      .eq('id', taskId)
      .single()

    if (error) throw error
    return { success: true, task: data }
  } catch (error) {
    console.error('❌ Get task error:', error)
    return { success: false, error }
  }
}
