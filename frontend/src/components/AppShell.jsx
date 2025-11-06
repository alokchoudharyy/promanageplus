import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bars3Icon, XMarkIcon, HomeIcon, FolderIcon, ListBulletIcon,
  UserGroupIcon, ChartBarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";

const nav = [
  { label: "Overview", to: "/manager", icon: HomeIcon },
  { label: "Projects", to: "/projects", icon: FolderIcon },
  { label: "Tasks", to: "/tasks", icon: ListBulletIcon },
  { label: 'Add Member', to: '/add-member', icon: UserGroupIcon }, 
  { label: "Teams", to: "/teams", icon: UserGroupIcon },
  { label: "Reports", to: "/reports", icon: ChartBarIcon },
  { label: "Settings", to: "/settings", icon: Cog6ToothIcon },
];

export default function AppShell({ children, userName = "User", onSignOut }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-indigo-600" />
              <span className="font-semibold">ProManage+</span>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <SearchBar 
              placeholder="Search projects, tasks, team members..." 
              onSearch={(query) => console.log('Searching:', query)}
            />
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
                {userName?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm text-gray-700">{userName}</span>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar 
            placeholder="Search..." 
            onSearch={(query) => console.log('Searching:', query)}
          />
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white">
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t p-3 text-xs text-gray-500">v1.0 • © 2025</div>
        </aside>

        {/* Sidebar mobile */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-72 bg-white border-r shadow-xl flex flex-col">
              <div className="h-16 flex items-center justify-between px-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-indigo-600" />
                  <span className="font-semibold">ProManage+</span>
                </div>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-1">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                              isActive
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            }`
                          }
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="border-t p-3 text-xs text-gray-500">v1.0 • © 2025</div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} ProManage+. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <a href="/privacy" className="hover:text-gray-900">Privacy</a>
            <a href="/terms" className="hover:text-gray-900">Terms</a>
            <a href="/status" className="hover:text-gray-900">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
