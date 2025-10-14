import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { 
  BellAlertIcon, 
  PlusIcon, 
  XMarkIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline'

export default function AnnouncementsPage() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal',
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [profile])

  // ✅ READ - Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  // ✅ CREATE or UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingAnnouncement) {
        // UPDATE existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formData.title,
            message: formData.message,
            priority: formData.priority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAnnouncement.id)

        if (error) throw error
        toast.success('Announcement updated successfully!')
      } else {
        // CREATE new announcement
        const { data: newAnnouncement, error } = await supabase
          .from('announcements')
          .insert({
            ...formData,
            created_by: profile.id,
          })
          .select()
          .single()

        if (error) throw error

        // Notify all employees
        const { data: employees } = await supabase
          .from('profiles')
          .select('id')
          .eq('manager_id', profile.id)
          .eq('role', 'employee')

        if (employees && employees.length > 0) {
          const notifications = employees.map(employee => ({
            user_id: employee.id,
            type: 'announcement',
            title: `📢 ${formData.priority === 'urgent' ? '🚨 URGENT: ' : ''}${formData.title}`,
            message: formData.message.substring(0, 100) + (formData.message.length > 100 ? '...' : ''),
            link: '/employee/announcements',
            is_read: false,
          }))

          await supabase.from('notifications').insert(notifications)
          console.log(`✅ Notified ${employees.length} employees`)
        }

        toast.success(`Announcement posted! ${employees?.length || 0} employees notified.`)
      }

      fetchAnnouncements()
      closeModal()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to save announcement')
    }
  }

  // ✅ DELETE
  const handleDelete = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId)

      if (error) throw error

      toast.success('Announcement deleted successfully!')
      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  // Open modal for CREATE
  const openCreateModal = () => {
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      message: '',
      priority: 'normal',
    })
    setShowModal(true)
  }

  // Open modal for UPDATE
  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
    })
    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      message: '',
      priority: 'normal',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Post important updates for your team</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90 shadow-lg font-semibold"
        >
          <PlusIcon className="h-5 w-5" />
          New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
              announcement.priority === 'high'
                ? 'border-red-500'
                : announcement.priority === 'urgent'
                ? 'border-orange-500'
                : 'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <BellAlertIcon className="h-5 w-5 text-gray-500" />
                  <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                  {announcement.priority !== 'normal' && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold ${
                        announcement.priority === 'urgent'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {announcement.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{announcement.message}</p>
                <p className="text-sm text-gray-500 mt-3">
                  Posted: {new Date(announcement.created_at).toLocaleString()}
                </p>
                {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
                  <p className="text-xs text-gray-400">
                    Updated: {new Date(announcement.updated_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Edit & Delete Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => openEditModal(announcement)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BellAlertIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No announcements yet</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90"
            >
              <PlusIcon className="h-5 w-5" />
              Create First Announcement
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={closeModal}>
                <XMarkIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  rows="5"
                  placeholder="Announcement details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 font-semibold transition"
                >
                  {editingAnnouncement ? 'Update' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
