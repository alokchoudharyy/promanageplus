import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import SearchBar from '../components/SearchBar'
import Logo from '../components/Logo'
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  BellAlertIcon,
  UserCircleIcon,
  DocumentTextIcon, 
} from '@heroicons/react/24/outline'


export default function ManagerLayout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path) => location.pathname === path

 const navigation = [
  {
    name: 'Dashboard',
    path: '/manager',
    icon: HomeIcon,
  },
  {
    name: 'Projects',
    path: '/projects',
    icon: FolderIcon,
  },
  {
    name: 'Project Chats',
    path: '/manager/chats',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Calendar',
    path: '/calendar',
    icon: CalendarDaysIcon,
  },
  {
    name: 'Team',
    path: '/teams',
    icon: UserGroupIcon,
  },
  {
    name: 'Add Member',
    path: '/add-member',
    icon: UserPlusIcon,
  },
  {
    name: 'Activity',
    path: '/activity',
    icon: ClockIcon,
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: ChartBarIcon,
  },
  {
    name: 'Announcements',
    path: '/announcements',
    icon: BellAlertIcon,
  },
  // ✅ ADD THIS:
  {
    name: 'Documents',
    path: '/documents',
    icon: DocumentTextIcon, 
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Cog6ToothIcon,
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: UserCircleIcon,
  },
]


  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
          text-white transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <Logo size="small" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-lg 
                  transition-all duration-200 text-sm
                  ${isActive(item.path)
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center gap-2.5 mb-2 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {profile?.full_name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {profile?.full_name || 'Manager'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Manager
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar - PROPERLY ALIGNED */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* LEFT SIDE: Mobile menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Title (mobile) OR Search Bar (desktop) */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 lg:hidden">
                  Manager Dashboard
                </h2>
                <div className="hidden lg:block max-w-2xl">
                  <SearchBar placeholder="Search projects, tasks, team members..." />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Notification + Profile (ALIGNED AT END) */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="flex-shrink-0">
                <NotificationBell />
              </div>

              {/* Profile Info (Desktop only) */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'Manager'}
                  </p>
                  <p className="text-xs text-gray-500">Manager</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'M'}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar (below header) */}
          <div className="lg:hidden px-6 pb-4">
            <SearchBar placeholder="Search projects, tasks, members..." />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
