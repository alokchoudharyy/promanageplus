import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  PaperClipIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

export default function TaskAttachments({ taskId }) {
  const { profile } = useAuth()
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchAttachments()
  }, [taskId])

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select(`
          *,
          uploader:uploaded_by (full_name, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttachments(data || [])
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${taskId}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: profile.id,
        })

      if (dbError) throw dbError

      toast.success('File uploaded successfully!')
      fetchAttachments()
      event.target.value = '' // Reset input
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Download started!')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async (attachment) => {
    if (!confirm(`Delete "${attachment.file_name}"?`)) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([attachment.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) throw dbError

      toast.success('File deleted!')
      fetchAttachments()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return PhotoIcon
    if (fileType.includes('pdf')) return DocumentTextIcon
    return DocumentIcon
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
      {/* Upload Section */}
      <div>
        <label
          htmlFor={`file-upload-${taskId}`}
          className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition cursor-pointer"
        >
          <PaperClipIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {uploading ? 'Uploading...' : 'Click to upload file (Max 10MB)'}
          </span>
          <input
            id={`file-upload-${taskId}`}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Attachments List */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">
          Attachments ({attachments.length})
        </h4>

        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <PaperClipIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No attachments yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.file_type)
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <FileIcon className="h-8 w-8 text-cyan-600 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{attachment.uploader?.full_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(attachment.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-white rounded transition"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    {attachment.uploaded_by === profile.id && (
                      <button
                        onClick={() => handleDelete(attachment)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded transition"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
