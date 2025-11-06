import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline'
import { sendNotification, getTaskDetails } from '../services/notificationService'

export default function TaskComments({ taskId }) {
  const { profile } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [taskId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setSubmitting(true)
    try {
      // ✅ 1. Add comment
      const { error } = await supabase.from('task_comments').insert({
        task_id: taskId,
        user_id: profile.id,
        comment: newComment.trim(),
      })

      if (error) throw error

      // ✅ 2. Get task details
      const { task } = await getTaskDetails(taskId)
      if (!task) throw new Error('Task not found')

      // ✅ 3. Send notification to relevant person
      if (profile.role === 'employee') {
        // Employee commented → Notify manager
        await sendNotification({
          userId: task.created_by,
          type: 'task_commented',
          title: '💬 New Comment on Task',
          message: `${profile.full_name} commented on "${task.title}"`,
          link: `/projects/${task.project_id}/tasks`,
          taskId: taskId,
          projectId: task.project_id,
        })
      } else if (profile.role === 'manager') {
        // Manager commented → Notify assigned employee
        if (task.assignee_id ) {
          await sendNotification({
            userId: task.assignee_id ,
            type: 'task_commented',
            title: '💬 New Comment from Manager',
            message: `Your manager commented on "${task.title}"`,
            link: `/employee/tasks`,
            taskId: taskId,
            projectId: task.project_id,
          })
        }
      }

      toast.success('Comment added!')
      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return

    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      toast.success('Comment deleted')
      fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">
          Comments ({comments.length})
        </h4>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {comment.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {comment.user?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {comment.user_id === profile.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                    title="Delete comment"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          rows={2}
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-sm"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="self-end px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
          {submitting ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
