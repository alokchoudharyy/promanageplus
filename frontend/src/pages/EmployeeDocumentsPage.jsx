import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function EmployeeDocumentsPage() {
  const { profile } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null,
  })

  useEffect(() => {
    fetchDocuments()
  }, [profile])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      
      // Fetch shared company docs + employee's own docs
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`is_shared_all.eq.true,uploaded_by.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setDocuments(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFormData({ ...formData, file })
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!formData.file) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileExt = formData.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file)

      if (uploadError) throw uploadError

      // Save to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          title: formData.title,
          description: formData.description,
          file_name: formData.file.name,
          file_path: filePath,
          file_size: formData.file.size,
          file_type: formData.file.type,
          document_type: 'personal',
          uploaded_by: profile.id,
          is_shared_all: false,
        })

      if (dbError) throw dbError

      toast.success('Document uploaded successfully!')
      setShowModal(false)
      setFormData({ title: '', description: '', file: null })
      fetchDocuments()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = document.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Download started!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download document')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
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
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Company documents and your personal files</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 shadow-lg font-semibold"
        >
          <PlusIcon className="h-5 w-5" />
          Upload Document
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <DocumentTextIcon className="h-12 w-12 text-purple-500 flex-shrink-0" />
              <button
                onClick={() => handleDownload(doc)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 truncate">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description || 'No description'}</p>

            <div className="space-y-1 text-xs text-gray-500">
              <p>Size: {formatFileSize(doc.file_size)}</p>
              <p>Type: {doc.document_type === 'company' ? '🏢 Company' : '👤 My Document'}</p>
              <p>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No documents available yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90"
            >
              <PlusIcon className="h-5 w-5" />
              Upload Document
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
              <button onClick={() => setShowModal(false)}>
                <XMarkIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., My Certificate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File * (Max 10MB)
                </label>
                <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition cursor-pointer">
                  <div className="text-center">
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.file ? formData.file.name : 'Click to upload file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 font-semibold transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
