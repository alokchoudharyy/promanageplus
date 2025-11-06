import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FolderIcon,
  CheckSquareIcon,
  UserIcon,
  ClockIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import { useDebounce } from '../hooks/useDebounce'

export default function GlobalSearch() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [results, setResults] = useState({
    projects: [],
    tasks: [],
    members: [],
  })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  const isManager = profile?.role === 'manager'

  // ✅ Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ✅ Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // ✅ Search function
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults({ projects: [], tasks: [], members: [] })
      return
    }

    if (isManager) {
      searchAsManager(debouncedSearch)
    } else {
      searchAsEmployee(debouncedSearch)
    }
  }, [debouncedSearch, isManager])

  // ✅ Manager Search
  const searchAsManager = async (query) => {
    setLoading(true)
    try {
      const searchTerm = `%${query}%`

      // Search Projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .eq('created_by', profile.id)
        .ilike('name', searchTerm)
        .limit(5)

      // Search Tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id, 
          title, 
          status, 
          priority,
          project_id,
          project:project_id(name)
        `)
        .eq('created_by', profile.id)
        .ilike('title', searchTerm)
        .limit(5)

      // Search Team Members
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('manager_id', profile.id)
        .ilike('full_name', searchTerm)
        .limit(5)

      setResults({
        projects: projects || [],
        tasks: tasks || [],
        members: members || [],
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Employee Search
  const searchAsEmployee = async (query) => {
    setLoading(true)
    try {
      const searchTerm = `%${query}%`

      // Search Projects (where employee has tasks)
      const { data: myTasks } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('assignee_id ', profile.id)

      const projectIds = [...new Set(myTasks?.map(t => t.project_id) || [])]

      let projects = []
      if (projectIds.length > 0) {
        const { data } = await supabase
          .from('projects')
          .select('id, name, status')
          .in('id', projectIds)
          .ilike('name', searchTerm)
          .limit(5)
        
        projects = data || []
      }

      // Search My Tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id, 
          title, 
          status, 
          priority,
          project_id,
          project:project_id(name)
        `)
        .eq('assignee_id ', profile.id)
        .ilike('title', searchTerm)
        .limit(5)

      // Search Team Members (colleagues with same manager)
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('manager_id', profile.manager_id)
        .neq('id', profile.id)
        .ilike('full_name', searchTerm)
        .limit(5)

      setResults({
        projects: projects || [],
        tasks: tasks || [],
        members: members || [],
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Navigate to result
  const handleSelect = (type, item) => {
    setIsOpen(false)
    setSearchQuery('')

    if (type === 'project') {
      if (isManager) {
        navigate(`/projects/${item.id}/tasks`)
      } else {
        navigate(`/employee/projects/${item.id}/chat`)
      }
    } else if (type === 'task') {
      if (isManager) {
        navigate(`/projects/${item.project_id}/tasks`)
      } else {
        navigate(`/employee/tasks`)
      }
    } else if (type === 'member') {
      if (isManager) {
        navigate(`/teams`)
      } else {
        navigate(`/employee/profile`)
      }
    }
  }

  // ✅ Keyboard navigation
  const allResults = [
    ...results.projects.map(p => ({ type: 'project', data: p })),
    ...results.tasks.map(t => ({ type: 'task', data: t })),
    ...results.members.map(m => ({ type: 'member', data: m })),
  ]

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault()
        const selected = allResults[selectedIndex]
        handleSelect(selected.type, selected.data)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allResults])

  const totalResults = results.projects.length + results.tasks.length + results.members.length

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-gray-600 text-sm"
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden lg:inline-block px-2 py-1 text-xs bg-white border border-gray-300 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
          <div
            ref={searchRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  isManager 
                    ? "Search projects, tasks, team members..." 
                    : "Search my tasks, projects, colleagues..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-lg"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Searching...
                </div>
              ) : searchQuery.length < 2 ? (
                <div className="p-8 text-center text-gray-500">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Type at least 2 characters to search</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {isManager 
                      ? 'Search across projects, tasks, and team members'
                      : 'Search your tasks, projects, and colleagues'
                    }
                  </p>
                </div>
              ) : totalResults === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Projects Section */}
                  {results.projects.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">
                        {isManager ? 'Projects' : 'My Projects'}
                      </h3>
                      {results.projects.map((project, idx) => (
                        <button
                          key={project.id}
                          onClick={() => handleSelect('project', project)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                            selectedIndex === idx
                              ? 'bg-cyan-50 text-cyan-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <FolderIcon className="h-5 w-5 text-blue-500" />
                          <div className="flex-1 text-left">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-xs text-gray-500">{project.status}</p>
                          </div>
                          <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks Section */}
                  {results.tasks.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">
                        {isManager ? 'Tasks' : 'My Tasks'}
                      </h3>
                      {results.tasks.map((task, idx) => {
                        const globalIdx = results.projects.length + idx
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleSelect('task', task)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                              selectedIndex === globalIdx
                                ? 'bg-cyan-50 text-cyan-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <CheckSquareIcon className="h-5 w-5 text-green-500" />
                            <div className="flex-1 text-left">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-gray-500">
                                {task.project?.name} • {task.status}
                              </p>
                            </div>
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
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Members Section */}
                  {results.members.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">
                        {isManager ? 'Team Members' : 'Colleagues'}
                      </h3>
                      {results.members.map((member, idx) => {
                        const globalIdx = results.projects.length + results.tasks.length + idx
                        return (
                          <button
                            key={member.id}
                            onClick={() => handleSelect('member', member)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                              selectedIndex === globalIdx
                                ? 'bg-cyan-50 text-cyan-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                              {member.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium">{member.full_name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                            <UserIcon className="h-4 w-4 text-gray-400" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              {totalResults > 0 && (
                <span>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}
