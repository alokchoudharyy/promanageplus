import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FolderIcon, ClipboardDocumentListIcon, UserIcon } from '@heroicons/react/24/solid'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function SearchBar({ placeholder = "Search..." }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ projects: [], tasks: [], members: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { profile } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search function with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ projects: [], tasks: [], members: [] })
      setIsOpen(false)
      return
    }

    const timer = setTimeout(() => {
      handleSearch(query)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = async (searchQuery) => {
    if (!profile?.id) return

    setLoading(true)
    try {
      const lowerQuery = searchQuery.toLowerCase()

      // Search Projects (for managers)
      let projects = []
      if (profile.role === 'manager') {
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('created_by', profile.id)
          .ilike('name', `%${lowerQuery}%`)
          .limit(5)
        projects = projectData || []
      }

      // Search Tasks
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`
          *,
          project:project_id(name)
        `)
        .or(`title.ilike.%${lowerQuery}%,description.ilike.%${lowerQuery}%`)
        .limit(5)

      const tasks = (taskData || []).filter(task => {
        if (profile.role === 'manager') {
          // Managers see all tasks from their projects
          return task.project
        } else {
          // Employees only see their assigned tasks
          return task.assignee_id  === profile.id
        }
      })

      // Search Team Members (managers only)
      let members = []
      if (profile.role === 'manager') {
        const { data: memberData } = await supabase
          .from('profiles')
          .select('*')
          .eq('manager_id', profile.id)
          .or(`full_name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%`)
          .limit(5)
        members = memberData || []
      }

      setResults({ projects, tasks, members })
      setIsOpen(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults({ projects: [], tasks: [], members: [] })
    setIsOpen(false)
  }

  const handleResultClick = (type, item) => {
    setIsOpen(false)
    setQuery('')

    if (type === 'project') {
      navigate(`/projects/${item.id}/tasks`)
    } else if (type === 'task') {
      if (profile.role === 'manager') {
        navigate(`/projects/${item.project_id}/tasks`)
      } else {
        navigate('/employee/tasks')
      }
    } else if (type === 'member') {
      navigate('/teams')
    }
  }

  const totalResults = results.projects.length + results.tasks.length + results.members.length

  return (
    <div className="relative w-full" ref={inputRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {/* Projects Section */}
              {results.projects.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Projects
                  </div>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleResultClick('project', project)}
                      className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      <FolderIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {project.name}
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks Section */}
              {results.tasks.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Tasks
                  </div>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleResultClick('task', task)}
                      className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full ${
                            task.status === 'done'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {task.status}
                          </span>
                          {task.project?.name && (
                            <span className="truncate">📁 {task.project.name}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Team Members Section */}
              {results.members.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Team Members
                  </div>
                  {results.members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleResultClick('member', member)}
                      className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold flex-shrink-0">
                        {member.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {member.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {member.email}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
