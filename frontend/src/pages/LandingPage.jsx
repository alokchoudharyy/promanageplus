/* src/pages/LandingPage.jsx - FINAL WORKING VERSION */
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  ChevronDownIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  EnvelopeIcon,
  UsersIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline"
import Logo from "../components/Logo"

export default function LandingPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const gotoRole = (role) => {
    setOpen(false)
    navigate(`/login?role=${role}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          {/* ✅ Logo wrapped in Link */}
          <Link to="/">
            <Logo size="default" />
          </Link>

          <nav className="hidden md:flex gap-8 font-medium text-gray-700">
            <a href="#features" className="hover:text-cyan-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-600 transition">How It Works</a>
            <a href="#contact" className="hover:text-cyan-600 transition">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            {/* ✅ FIXED Dropdown with proper z-index */}
            <div className="relative z-50">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-lg border border-cyan-500 px-4 py-2 text-cyan-600 hover:bg-cyan-50 transition"
              >
                Login
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white ring-1 ring-gray-200 shadow-xl z-[100]">
                  <button
                    onClick={() => gotoRole("employee")}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-50 rounded-t-lg transition"
                  >
                    Employee
                  </button>
                  <button
                    onClick={() => gotoRole("manager")}
                    className="block w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-lg transition"
                  >
                    Manager
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/register-manager"
              className="hidden md:inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/50 via-blue-100/30 to-transparent" />
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 border border-cyan-200 mb-8">
            <SparklesIcon className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-700">
              Smart Project Management Made Simple
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Manage Projects with
            <span className="block mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Intelligence
            </span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Create tasks, collaborate in real-time, and get AI suggestions for priorities and deadlines. 
            Everything your team needs in one powerful platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register-manager"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <RocketLaunchIcon className="w-5 h-5" />
              Get Started
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-cyan-500 px-8 py-4 font-semibold text-cyan-600 hover:bg-cyan-50 transition-all"
            >
              See Features
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: ClipboardDocumentListIcon, value: "Unlimited", label: "Projects" },
              { icon: ChatBubbleLeftRightIcon, value: "Real-time", label: "Team Chat" },
              { icon: SparklesIcon, value: "AI", label: "Smart Suggestions" },
              { icon: BellAlertIcon, value: "Instant", label: "Notifications" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Projects
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for modern teams
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: SparklesIcon,
                title: "AI-Powered Task Analysis", 
                desc: "Get intelligent suggestions for task priority, complexity, and estimated completion time.",
                gradient: "from-cyan-500 to-blue-600"
              },
              { 
                icon: ClipboardDocumentListIcon,
                title: "Kanban Board", 
                desc: "Visualize work with drag-and-drop task boards. Move tasks between To Do, In Progress, and Done.",
                gradient: "from-blue-500 to-indigo-600"
              },
              { 
                icon: ChatBubbleLeftRightIcon,
                title: "Real-Time Team Chat", 
                desc: "Built-in messaging for each project. Discuss tasks, share files, and stay connected.",
                gradient: "from-indigo-500 to-purple-600"
              },
              { 
                icon: BellAlertIcon,
                title: "Smart Notifications", 
                desc: "Get notified when tasks are assigned, completed, or approaching deadlines.",
                gradient: "from-purple-500 to-pink-600"
              },
              { 
                icon: EnvelopeIcon,
                title: "Email Notifications", 
                desc: "Automatic email alerts for task assignments and deadline reminders.",
                gradient: "from-pink-500 to-rose-600"
              },
              { 
                icon: UsersIcon,
                title: "Team Management", 
                desc: "Invite team members, assign roles, and track everyone's progress in one place.",
                gradient: "from-rose-500 to-orange-600"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-xl mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How ProManage+ Works
            </h2>
            <p className="text-xl text-gray-600">Simple, powerful, effective</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                step: "1", 
                icon: UsersIcon,
                title: "Create Your Project", 
                desc: "Sign up, create a project, and invite your team members.",
                color: "from-cyan-500 to-blue-600"
              },
              { 
                step: "2", 
                icon: SparklesIcon,
                title: "Add Tasks with AI", 
                desc: "Create tasks and let AI suggest priorities and deadlines automatically.",
                color: "from-blue-500 to-indigo-600"
              },
              { 
                step: "3", 
                icon: ChartBarIcon,
                title: "Collaborate & Complete", 
                desc: "Use real-time chat, track progress, and complete tasks efficiently.",
                color: "from-indigo-500 to-purple-600"
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-6 shadow-xl`}>
                  <item.icon className="w-10 h-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white border-4 border-cyan-100 flex items-center justify-center font-bold text-cyan-600 shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold text-xl mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-500 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2Mmgydi0yem0wLTRoLTJ2Mmgydi0yem0wIDhoLTJ2Mmgydi0yem00IDRoLTJ2Mmgydi0yem0wLTRoLTJ2Mmgydi0yem0wLThoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0tOCA0aC0ydjJoMnYtMnptMCA0aC0ydjJoMnYtMnptLTQgMGgtMnYyaDJ2LTJ6bTAgNGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6bTggNGgtMnYyaDJ2LTJ6bTAtNGgtMnYyaDJ2LTJ6bS00IDBoLTJ2Mmgydi0yem0wIDRoLTJ2Mmgydi0yem0tNCAwaC0ydjJoMnYtMnptMC00aC0ydjJoMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
            <RocketLaunchIcon className="w-8 h-8" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-xl mb-8 text-cyan-100">
            Join teams using ProManage+ to deliver projects faster and smarter.
          </p>
          <Link
            to="/register-manager"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-cyan-600 px-8 py-4 font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* ✅ Logo WITHOUT Link wrapper in footer */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="default" />
              </div>
              <p className="text-sm text-gray-400 mb-4">
                AI-powered project management platform for modern teams. Create, collaborate, and complete projects efficiently.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-cyan-400 transition flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" /> Features
                </a></li>
                <li><a href="#how-it-works" className="hover:text-cyan-400 transition flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4" /> How It Works
                </a></li>
                <li><Link to="/register-manager" className="hover:text-cyan-400 transition flex items-center gap-2">
                  <RocketLaunchIcon className="w-4 h-4" /> Get Started
                </Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-cyan-400" />
                  <a href="mailto:promanageplus@gmail.com" className="hover:text-cyan-400 transition">
                    promanageplus@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <BellAlertIcon className="w-4 h-4 text-cyan-400" />
                  +91 9302188377
                </li>
                <li className="text-gray-500">Available 9 AM - 6 PM IST</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2025 ProManage+. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-400">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
