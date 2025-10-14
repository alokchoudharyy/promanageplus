import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function EmployeeDocumentsPage() {
  const { profile } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [profile])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`uploaded_by.eq.${profile.manager_id},is_public.eq.true`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">Shared files and resources</p>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <DocumentTextIcon className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">{doc.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </span>
              <a
                href={doc.file_url}
                download
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No documents available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
