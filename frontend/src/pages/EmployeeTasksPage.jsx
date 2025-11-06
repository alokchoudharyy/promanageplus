import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskFilters from '../components/TaskFilters'
import { KanbanSkeleton } from '../components/LoadingSkeleton'
import TaskComments from '../components/TaskComments'
import TaskAttachments from '../components/TaskAttachments'
import { ClipboardDocumentListIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function EmployeeTasksPage() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState({ todo: [], 'in-progress': [], done: [] })
  const [loading, setLoading] = useState(true)
  const [viewingComments, setViewingComments] = useState(null)
  const [activeTab, setActiveTab] = useState('comments')
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  })

  useEffect(() => {
    fetchTasks()
  }, [profile, filters])

  const fetchTasks = async () => {
    if (!profile?.id) return

    setLoading(true)
    try {
      // ✅ FIXED: assignee_id instead of assignee_id 
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(name)
        `)
        .eq('assignee_id', profile.id)
        .order('deadline', { ascending: true })

      if (error) throw error

      let filteredTasks = data || []
      
      if (filters.status) {
        filteredTasks = filteredTasks.filter(t => t.status === filters.status)
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === filters.priority)
      }

      const grouped = {
        todo: filteredTasks?.filter(t => t.status === 'todo') || [],
        'in-progress': filteredTasks?.filter(t => t.status === 'in-progress') || [],
        done: filteredTasks?.filter(t => t.status === 'done') || [],
      }
      setTasks(grouped)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    try {
      await supabase
        .from('tasks')
        .update({ status: destination.droppableId })
        .eq('id', draggableId)

      toast.success('Task status updated!')
      fetchTasks()
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  const columns = [
    { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
    { key: 'in-progress', label: 'In Progress', color: 'bg-yellow-100' },
    { key: 'done', label: 'Done', color: 'bg-green-100' },
  ]

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-1">Drag and drop to update task status</p>
      </div>

      <TaskFilters
        filters={filters}
        onFilterChange={setFilters}
        showAssigneeFilter={false}
      />

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
                      snapshot.isDraggingOver ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {column.label} ({tasks[column.key].length})
                    </h3>
                    <div className="space-y-3">
                      {tasks[column.key].length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No tasks</p>
                        </div>
                      ) : (
                        tasks[column.key].map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-purple-500' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
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

                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="text-xs text-gray-500 space-y-1">
                                  {task.project?.name && (
                                    <div>📁 {task.project.name}</div>
                                  )}
                                  {task.deadline && (
                                    <div>📅 {new Date(task.deadline).toLocaleDateString()}</div>
                                  )}
                                  <button
                                    onClick={() => setViewingComments(task)}
                                    className="text-blue-600 hover:text-blue-800 mt-2 block font-medium"
                                  >
                                    💬 View Comments
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

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

            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 px-2 font-medium text-sm transition ${
                  activeTab === 'comments'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                💬 Comments
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`pb-3 px-2 font-medium text-sm transition ${
                  activeTab === 'attachments'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📎 Attachments
              </button>
            </div>

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
