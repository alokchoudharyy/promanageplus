import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { XMarkIcon } from '@heroicons/react/24/outline'

const localizer = momentLocalizer(moment)

export default function EmployeeCalendarPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month')

  useEffect(() => {
    fetchTasks()
  }, [profile])

  const fetchTasks = async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(name)
        `)
        .eq('assignee_id ', profile.id)

      if (error) throw error

      const calendarEvents = (data || [])
        .filter(task => task.deadline)
        .map(task => ({
          id: task.id,
          title: task.title,
          start: new Date(task.deadline),
          end: new Date(task.deadline),
          allDay: true,
          resource: task,
          style: {
            backgroundColor:
              task.status === 'done'
                ? '#10B981'
                : task.priority === 'high'
                ? '#EF4444'
                : task.priority === 'medium'
                ? '#F59E0B'
                : '#6B7280',
          },
        }))

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event) => {
    setSelectedTask(event.resource)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedTask(null)
  }

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.style.backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontWeight: 'bold',
        fontSize: '12px',
      },
    }
  }

  const handleNavigate = (date) => {
    setCurrentDate(date)
  }

  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-1">View all your task deadlines</p>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-sm text-gray-600">Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day', 'agenda']}
            view={currentView}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            popup
            selectable
          />
        </div>
      </div>

      {/* Task Detail Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {selectedTask.title}
                </p>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-600 mt-1">{selectedTask.description}</p>
                </div>
              )}

              {/* Project */}
              {selectedTask.project && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Project</label>
                  <p className="text-gray-900 mt-1">📁 {selectedTask.project.name}</p>
                </div>
              )}

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTask.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : selectedTask.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTask.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : selectedTask.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm font-medium text-gray-700">Deadline</label>
                <p className="text-gray-900 mt-1">
                  📅 {new Date(selectedTask.deadline).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
