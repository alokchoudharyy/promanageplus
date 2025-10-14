import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { taskAPI } from '../services/api'
import WebSocketService from '../services/websocket'
import toast from 'react-hot-toast'

/* ─────── helper ──────────────────────────────────── */
function Column({ title, id, tasks, children }) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-4 flex-1 min-h-[500px]">
      <h3 className="font-semibold text-slate-200 mb-4">
        {title} ({tasks.length})
      </h3>
      {children}
    </div>
  )
}

function SortableTask({ task, onStatusChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="card bg-white shadow-sm p-4 mb-3 cursor-grab"
    >
      <p className="font-medium">{task.title}</p>
      <p className="text-xs text-gray-500">{task.priority}</p>
    </div>
  )
}

export default function TaskBoard({ projectId }) {
  const [all, setAll] = useState({ todo: [], progress: [], done: [] })
  const [loading, setLoading] = useState(true)

  /* fetch once */
  useEffect(() => {
    fetchTasks()
    // socket listener
    const socket = WebSocketService.socket
    socket?.on('task-updated', fetchTasks)
    return () => socket?.off('task-updated', fetchTasks)
  }, [projectId])

  const fetchTasks = async () => {
    try {
      const res = await taskAPI.getByProject(projectId)
      const list = res.data
      setAll({
        todo: list.filter(t => t.status === 'todo'),
        progress: list.filter(t => t.status === 'in-progress'),
        done: list.filter(t => t.status === 'done'),
      })
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  /* sensors */
  const sensors = useSensors(useSensor(PointerSensor))

  /* handle drag finish */
  const handleDragEnd = async (ev) => {
    const { active, over } = ev
    if (!over) return

    const fromCol = getColumnByTaskId(active.id)
    const toCol   = getColumnByContainerId(over.id)

    if (fromCol === toCol) return            // same column → no change

    try {
      await taskAPI.updateStatus(active.id, toCol)
      toast.success('Status updated')
      fetchTasks()                           // refresh lists
      WebSocketService.socket?.emit('task-updated')   // broadcast
    } catch {
      toast.error('Update failed')
    }
  }

  /* helpers */
  const getColumnByTaskId = (id) =>
    Object.entries(all).find(([, arr]) => arr.some(t => t.id === id))[0]

  const getColumnByContainerId = (containerId) =>
    containerId === 'todo' ? 'todo' :
    containerId === 'progress' ? 'in-progress' : 'done'

  if (loading) return <p className="py-8 text-center">Loading tasks…</p>

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6">
        {['todo','progress','done'].map((col) => (
          <Column
            key={col}
            id={col}
            title={
              col === 'todo' ? 'To-do' :
              col === 'progress' ? 'In-Progress' : 'Done'
            }
            tasks={all[col]}
          >
            <SortableContext
              id={col}
              items={all[col].map(t => t.id)}
              strategy={rectSortingStrategy}
            >
              {all[col].map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onStatusChange={handleDragEnd}
                />
              ))}
            </SortableContext>
          </Column>
        ))}
      </div>
    </DndContext>
  )
}
