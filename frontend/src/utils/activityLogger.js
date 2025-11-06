import { supabase } from '../supabaseClient'

export const logActivity = async ({
  userId,
  actionType,
  entityType,
  entityId,
  description,
  metadata = null
}) => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        description: description,
        metadata: metadata
      })

    if (error) throw error
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// Helper functions for common activities
export const ActivityLogger = {
  // Projects
  projectCreated: (userId, projectId, projectName) => {
    return logActivity({
      userId,
      actionType: 'project_created',
      entityType: 'project',
      entityId: projectId,
      description: `Created project "${projectName}"`
    })
  },

  projectUpdated: (userId, projectId, projectName) => {
    return logActivity({
      userId,
      actionType: 'project_updated',
      entityType: 'project',
      entityId: projectId,
      description: `Updated project "${projectName}"`
    })
  },

  projectDeleted: (userId, projectId, projectName) => {
    return logActivity({
      userId,
      actionType: 'project_deleted',
      entityType: 'project',
      entityId: projectId,
      description: `Deleted project "${projectName}"`
    })
  },

  // Tasks
  taskCreated: (userId, taskId, taskTitle, projectName) => {
    return logActivity({
      userId,
      actionType: 'task_created',
      entityType: 'task',
      entityId: taskId,
      description: `Created task "${taskTitle}" in ${projectName}`
    })
  },

  taskUpdated: (userId, taskId, taskTitle) => {
    return logActivity({
      userId,
      actionType: 'task_updated',
      entityType: 'task',
      entityId: taskId,
      description: `Updated task "${taskTitle}"`
    })
  },

  taskStatusChanged: (userId, taskId, taskTitle, oldStatus, newStatus) => {
    return logActivity({
      userId,
      actionType: 'task_status_changed',
      entityType: 'task',
      entityId: taskId,
      description: `Moved task "${taskTitle}" from ${oldStatus} to ${newStatus}`,
      metadata: { oldStatus, newStatus }
    })
  },

  taskAssigned: (userId, taskId, taskTitle, assigneeName) => {
    return logActivity({
      userId,
      actionType: 'task_assigned',
      entityType: 'task',
      entityId: taskId,
      description: `Assigned task "${taskTitle}" to ${assigneeName}`
    })
  },

  taskDeleted: (userId, taskId, taskTitle) => {
    return logActivity({
      userId,
      actionType: 'task_deleted',
      entityType: 'task',
      entityId: taskId,
      description: `Deleted task "${taskTitle}"`
    })
  },

  // Comments
  commentAdded: (userId, commentId, taskTitle) => {
    return logActivity({
      userId,
      actionType: 'comment_added',
      entityType: 'comment',
      entityId: commentId,
      description: `Added comment on "${taskTitle}"`
    })
  },

  // Files
  fileUploaded: (userId, fileId, fileName, taskTitle) => {
    return logActivity({
      userId,
      actionType: 'file_uploaded',
      entityType: 'file',
      entityId: fileId,
      description: `Uploaded file "${fileName}" to task "${taskTitle}"`
    })
  },

  fileDeleted: (userId, fileId, fileName) => {
    return logActivity({
      userId,
      actionType: 'file_deleted',
      entityType: 'file',
      entityId: fileId,
      description: `Deleted file "${fileName}"`
    })
  },

  // Team
  memberAdded: (userId, memberId, memberName) => {
    return logActivity({
      userId,
      actionType: 'member_added',
      entityType: 'member',
      entityId: memberId,
      description: `Added team member "${memberName}"`
    })
  }
}
