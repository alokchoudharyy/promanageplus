import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Auth + public pages
import LandingPage from './pages/LandingPage'
import RoleSelect from './pages/RoleSelect'
import Login from './pages/Login'
import RegisterManager from './pages/RegisterManager'
import AcceptInvite from './pages/AcceptInvite'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import OAuthCallback from './pages/OAuthCallback'
import AuthCallback from './components/auth/AuthCallback'

// Auth context and guards
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import ManagerLayout from './layouts/ManagerLayout'
import EmployeeLayout from './layouts/EmployeeLayout'

// Manager pages
import ManagerDashboard from './pages/ManagerDashboard'
import AddMember from './pages/AddMember'
import ProjectsPage from './pages/ProjectsPage'
import ProjectTasksPage from './pages/ProjectTasksPage'
import ProjectChatPage from './pages/ProjectChatPage'
import TeamsPage from './pages/TeamsPage'
import TeamManagementPage from './pages/TeamManagementPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import CompleteProfile from './pages/CompleteProfile'
import ManagerChatsPage from './pages/ManagerChatsPage'
import CalendarPage from './pages/CalendarPage'
import ActivityPage from './pages/ActivityPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import ProfilePage from './pages/ProfilePage'
import DocumentsPage from "./pages/DocumentPage"; 

// Employee pages
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployeeTasksPage from './pages/EmployeeTasksPage'
import EmployeePerformancePage from './pages/EmployeePerformancePage'
import EmployeeCalendarPage from './pages/EmployeeCalendarPage'
import EmployeeSettingsPage from './pages/EmployeeSettingsPage'
import EmployeeChatsPage from './pages/EmployeeChatsPage'

import EmployeeTimesheetPage from './pages/EmployeeTimesheetPage'
import EmployeeAnnouncementsPage from './pages/EmployeeAnnouncementsPage'
import EmployeeDocumentsPage from './pages/EmployeeDocumentsPage'
import EmployeeProfilePage from './pages/EmployeeProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* ═══════════════════════════════════════════════════ */}
            {/* Public/Auth Routes (No Layout) */}
            {/* ═══════════════════════════════════════════════════ */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/role-select" element={<RoleSelect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-manager" element={<RegisterManager />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />  
            <Route path="/auth/callback" element={<AuthCallback />} /> 
            

            {/* ═══════════════════════════════════════════════════ */}
            {/* Manager Area (Protected + With Layout) */}
            {/* ═══════════════════════════════════════════════════ */}
            
            {/* Manager Dashboard */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <ManagerDashboard />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* Projects Page */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <ProjectsPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* Project Tasks Page */}
            <Route
              path="/projects/:projectId/tasks"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <ProjectTasksPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* Project Chat Page - Manager */}
            <Route
              path="/projects/:projectId/chat"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <ProjectChatPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* Manager Chats List Page */}
            <Route
              path="/manager/chats"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <ManagerChatsPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* ✅ Calendar Page */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <CalendarPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* ✅ Team Management Page (with CRUD) */}
            <Route
              path="/teams"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <TeamManagementPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* Add Member Page */}
            <Route
              path="/add-member"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <AddMember />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Profile Page - With Layout */}
<Route
  path="/profile"
  element={
    <ProtectedRoute role="manager">
      <ManagerLayout>
        <ProfilePage />
      </ManagerLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/manager/profile"
  element={
    <ProtectedRoute role="manager">
      <ManagerLayout>
        <ProfilePage />
      </ManagerLayout>
    </ProtectedRoute>
  }
/>


            {/* ✅ Activity Log Page */}
            <Route
              path="/activity"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <ActivityPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* Reports Page */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <ReportsPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* ✅ Announcements Page */}
            <Route
              path="/announcements"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <AnnouncementsPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />
  {/* ✅ Documents Page - Manager - ADD THIS */}
         <Route
  path="/documents"
  element={
    <ProtectedRoute role="manager">
      <ManagerLayout>
        <DocumentsPage />
      </ManagerLayout>
    </ProtectedRoute>
  }
/>

            {/* Settings Page */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute role="manager">
                  <ManagerLayout>
                    <SettingsPage />
                  </ManagerLayout>
                </ProtectedRoute>
              }
            />

            {/* ═══════════════════════════════════════════════════ */}
            {/* Employee Area (Protected + With Layout) */}
            {/* ═══════════════════════════════════════════════════ */}

            {/* Employee Dashboard */}
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeDashboard />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Tasks Page */}
            <Route
              path="/employee/tasks"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeTasksPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Timesheet - FIXED: Added properly nested */}
            <Route
              path="/employee/timesheet"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeTimesheetPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Announcements - FIXED: Added properly */}
            <Route
              path="/employee/announcements"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeAnnouncementsPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Documents - FIXED: Added properly */}
            <Route
              path="/employee/documents"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeDocumentsPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Profile - FIXED: Added properly */}
            <Route
              path="/employee/profile"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeProfilePage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Calendar */}
            <Route
              path="/employee/calendar"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeCalendarPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Chats List */}
            <Route
              path="/employee/chats"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeChatsPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Project Chat */}
            <Route
              path="/employee/projects/:projectId/chat"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <ProjectChatPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Performance */}
            <Route
              path="/employee/performance"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeePerformancePage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee Settings */}
            <Route
              path="/employee/settings"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeLayout>
                    <EmployeeSettingsPage />
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* ═══════════════════════════════════════════════════ */}
            {/* Other Protected Routes */}
            {/* ═══════════════════════════════════════════════════ */}

            {/* Complete Profile */}
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            {/* ═══════════════════════════════════════════════════ */}
            {/* 404 Page - FIXED: className fully closed */}
            {/* ═══════════════════════════════════════════════════ */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>  {/* FIXED: Full "font-bold text-gray-900 mb-4" */}
                    <p className="text-xl text-gray-600 mb-6">Page Not Found</p>
                    <a
                      href="/"
                      className="inline-block bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-6 py-3 rounded-md hover:opacity-90 transition"
                    >
                      Go Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  )
}
  