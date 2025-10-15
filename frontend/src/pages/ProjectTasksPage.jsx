import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskFilters from '../components/TaskFilters'
import { KanbanSkeleton } from '../components/LoadingSkeleton'
import TaskComments from '../components/TaskComments'
import TaskAttachments from '../components/TaskAttachments'
import AIAnalysisPanel from '../components/AIAnalysisPanel'
import { sendNotification } from '../services/notificationService'
import { analyzeTask } from '../services/aiService'
import {
  PlusIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export default function ProjectTasksPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState({ todo: [], 'in-progress': [], done: [] })
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingComments, setViewingComments] = useState(null)
  const [activeTab, setActiveTab] = useState('comments')
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
  })
  
  // Task form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    deadline: '',
  })
  
  // AI state
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  
  useEffect(() => {
    fetchProjectData()
    fetchTeamMembers()
  }, [projectId, filters])

  const fetchProjectData = async () => {
    setLoading(true)
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to (full_name, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      // Apply filters
      let filteredTasks = tasksData || []
      
      if (filters.status) {
        filteredTasks = filteredTasks.filter(t => t.status === filters.status)
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === filters.priority)
      }
      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(t => t.assigned_to === filters.assignee)
      }

      const grouped = {
        todo: filteredTasks?.filter(t => t.status === 'todo') || [],
        'in-progress': filteredTasks?.filter(t => t.status === 'in-progress') || [],
        done: filteredTasks?.filter(t => t.status === 'done') || [],
      }
      setTasks(grouped)
    } catch (error) {
      console.error('Error fetching project data:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('manager_id', profile.id)

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task)
      setForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assigned_to: task.assigned_to || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
      })
    } else {
      setEditingTask(null)
      setForm({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        deadline: '',
      })
    }
    setShowModal(true)
    setShowAiPanel(false) // Reset AI panel
    setAiAnalysis(null) // Reset AI analysis
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setForm({
      title: '',
      description: '',
      priority: 'medium',
      assigned_to: '',
      deadline: '',
    })
    setShowAiPanel(false)
    setAiAnalysis(null)
  }

  // ═══════════════════════════════════════════════════════════
  // AI FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  const handleAIAnalysis = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a task title first')
      return
    }

    setAiLoading(true)
    setShowAiPanel(true)

    try {
      const result = await analyzeTask(form.title, form.description)
      
      if (result.success) {
        setAiAnalysis(result.data)
        toast.success('AI analysis complete!')
      } else {
        toast.error('AI analysis failed. Using defaults.')
        setAiAnalysis(result.data) // Still show fallback data
      }
    } catch (error) {
      console.error('AI Analysis Error:', error)
      toast.error('AI service unavailable')
    } finally {
      setAiLoading(false)
    }
  }

  const handleApplyAI = (aiData) => {
    if (aiData.priority) {
      setForm(prev => ({ ...prev, priority: aiData.priority }))
    }
    if (aiData.deadline) {
      setForm(prev => ({ ...prev, deadline: aiData.deadline }))
    }
    toast.success('AI suggestions applied!')
  }

  // Show AI badge if task was created with AI
  const renderAIBadge = (task) => {
    if (task.ai_generated) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full font-bold shadow-sm">
          <SparklesIcon className="h-3 w-3" />
          AI
        </span>
      )
    }
    return null
  }

  // ═══════════════════════════════════════════════════════════
  // TASK OPERATIONS
  // ═══════════════════════════════════════════════════════════

 const handleSubmit = async (e) => {
  e.preventDefault()

  if (!form.title.trim()) {
    toast.error('Task title is required')
    return
  }

  try {
    const taskData = {
      project_id: projectId,
      title: form.title,
      description: form.description,
      status: form.status || 'todo',
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      deadline: form.deadline || null,
      ai_generated: showAiPanel && aiAnalysis ? true : false,
      ai_analysis: aiAnalysis || null,
      created_by: profile.id,
    }

    if (editingTask) {
      // ✅ UPDATE TASK
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id)

      if (error) throw error

      // ✅ Notify if assignee changed
      if (form.assigned_to && form.assigned_to !== editingTask.assigned_to) {
        await sendNotification({
          userId: form.assigned_to,
          type: 'task_updated',
          title: '📋 Task Re-assigned',
          message: `You've been assigned to "${form.title}"`,
          link: '/employee/tasks',
          taskId: editingTask.id,
          projectId: projectId,
        })
      }

      toast.success('Task updated successfully')
    } else {
      // ✅ CREATE TASK
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (error) throw error

      // ✅ Notify assigned employee
      if (form.assigned_to && newTask) {
        await sendNotification({
          userId: form.assigned_to,
          type: 'task_assigned',
          title: '📋 New Task Assigned',
          message: `"${form.title}" has been assigned to you`,
          link: '/employee/tasks',
          taskId: newTask.id,
          projectId: projectId,
        })
      }

      toast.success('Task created successfully')
    }

    fetchProjectData()
    closeModal()
  } catch (error) {
    console.error('Error saving task:', error)
    toast.error(error.message || 'Failed to save task')
  }
}



  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
      toast.success('Task deleted')
      fetchProjectData()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

 // Drag and Drop Handler
// Drag and Drop Handler - COMPLETE VERSION
const onDragEnd = async (result) => {
  const { source, destination, draggableId } = result

  // If dropped outside droppable area
  if (!destination) return

  // If dropped in same position
  if (source.droppableId === destination.droppableId && source.index === destination.index) {
    return
  }

  const sourceColumn = source.droppableId
  const destColumn = destination.droppableId

  // If moved within same column (reordering)
  if (sourceColumn === destColumn) {
    const newTasks = Array.from(tasks[sourceColumn])
    const [removed] = newTasks.splice(source.index, 1)
    newTasks.splice(destination.index, 0, removed)

    setTasks({
      ...tasks,
      [sourceColumn]: newTasks,
    })
    return
  }

  // If moved to different column (status change)
  const sourceTasks = Array.from(tasks[sourceColumn])
  const destTasks = Array.from(tasks[destColumn])
  const [movedTask] = sourceTasks.splice(source.index, 1)

  movedTask.status = destColumn
  destTasks.splice(destination.index, 0, movedTask)

  // Update UI immediately (optimistic update)
  setTasks({
    ...tasks,
    [sourceColumn]: sourceTasks,
    [destColumn]: destTasks,
  })

  try {
    // Update task status in database
    const { error } = await supabase
      .from('tasks')
      .update({ status: destColumn })
      .eq('id', draggableId)

    if (error) throw error
    
    toast.success('Task moved successfully')

    // Create in-app notification if task completed
    if (destColumn === 'done' && movedTask.assigned_to) {
      await supabase.from('notifications').insert({
        user_id: movedTask.created_by,
        type: 'task_completed',
        title: 'Task Completed',
        message: `Task "${movedTask.title}" has been completed!`,
        link: `/projects/${projectId}/tasks`,
      })

      // 📧 Send email notification to manager
      try {
        console.log('📧 Sending task completion email...')
        
        const response = await fetch('http://localhost:5000/api/notifications/task-completed', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            taskId: draggableId,
            userId: movedTask.assigned_to,
          }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          console.log('✅ Task completion email sent successfully')
        } else {
          console.error('❌ Email API error:', result.error || 'Unknown error')
        }
      } catch (emailError) {
        console.error('❌ Failed to send task completion email:', emailError)
        // Don't show error to user - email is optional feature
      }
    }

    // 📧 Send email if task moved to "In Progress" (task started)
    if (destColumn === 'in-progress' && sourceColumn === 'todo' && movedTask.assigned_to) {
      try {
        console.log('📧 Sending task started notification...')
        
        // You can create a separate endpoint for this or use a generic notification
        await supabase.from('notifications').insert({
          user_id: movedTask.created_by,
          type: 'task_started',
          title: 'Task Started',
          message: `Task "${movedTask.title}" has been started by team member`,
          link: `/projects/${projectId}/tasks`,
        })
        
        console.log('✅ Task started notification sent')
      } catch (error) {
        console.error('❌ Failed to send task started notification:', error)
      }
    }

  } catch (error) {
    console.error('Error updating task:', error)
    toast.error('Failed to move task')
    
    // Revert optimistic update on error
    fetchProjectData()
  }
}



  const columns = [
    { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
    { key: 'in-progress', label: 'In Progress', color: 'bg-blue-100' },
    { key: 'done', label: 'Done', color: 'bg-green-100' },
  ]

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
            <p className="text-gray-600 mt-1">{project?.description || 'No description'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-4 py-2 rounded-md hover:opacity-90 shadow-lg"
          >
            <PlusIcon className="h-5 w-5" />
            New Task
          </button>
          
          <button
            onClick={() => navigate(`/projects/${projectId}/chat`)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-md hover:opacity-90 shadow-lg"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Team Chat
          </button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFilterChange={setFilters}
        showAssigneeFilter={true}
        members={teamMembers}
      />

      {/* Kanban Board or Loading */}
      {loading ? (
        <KanbanSkeleton />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <Droppable key={column.key} droppableId={column.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${column.color} rounded-lg p-4 min-h-[500px] ${
                      snapshot.isDraggingOver ? 'ring-2 ring-cyan-500' : ''
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {column.label} ({tasks[column.key].length})
                    </h3>
                    <div className="space-y-3">
                      {tasks[column.key].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-cyan-500' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
                                <div className="flex items-center gap-2">
                                  {renderAIBadge(task)}
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      task.priority === 'high'
                                        ? 'bg-red-100 text-red-700'
                                        : task.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {task.assignee && (
                                <div className="text-xs text-gray-500 mb-2">
                                  👤 {task.assignee.full_name}
                                </div>
                              )}

                              {task.deadline && (
                                <div className="text-xs text-gray-500 mb-3">
                                  📅 {new Date(task.deadline).toLocaleDateString()}
                                </div>
                              )}

                              <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <button
                                  onClick={() => openModal(task)}
                                  className="text-xs text-gray-600 hover:text-gray-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setViewingComments(task)}
                                  className="text-xs text-blue-600 hover:text-blue-900"
                                >
                                  Comments
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-xs text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Design homepage mockup"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Task details..."
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* AI Analysis Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAIAnalysis}
                  disabled={aiLoading || !form.title.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold shadow-lg"
                >
                  <SparklesIcon className="h-5 w-5" />
                  {aiLoading ? 'Analyzing with AI...' : '✨ Get AI Suggestions'}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  AI will suggest priority, deadline, and completion tips
                </p>
              </div>

              {/* AI Analysis Panel */}
              {showAiPanel && (
                <AIAnalysisPanel
                  analysis={aiAnalysis}
                  onApply={handleApplyAI}
                  onClose={() => setShowAiPanel(false)}
                  loading={aiLoading}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-md hover:opacity-90 transition"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments & Attachments Modal */}
      {viewingComments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {viewingComments.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Task Discussion & Files</p>
              </div>
              <button
                onClick={() => {
                  setViewingComments(null)
                  setActiveTab('comments')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 px-2 font-medium text-sm transition ${
                  activeTab === 'comments'
                    ? 'border-b-2 border-cyan-500 text-cyan-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                💬 Comments
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`pb-3 px-2 font-medium text-sm transition ${
                  activeTab === 'attachments'
                    ? 'border-b-2 border-cyan-500 text-cyan-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📎 Attachments
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'comments' ? (
              <TaskComments taskId={viewingComments.id} />
            ) : (
              <TaskAttachments taskId={viewingComments.id} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
