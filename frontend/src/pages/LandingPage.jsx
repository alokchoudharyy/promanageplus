/* src/pages/LandingPage.jsx */
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronDownIcon, SparklesIcon, RocketLaunchIcon } from "@heroicons/react/24/solid"
import Logo from "../components/Logo"

export default function LandingPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const gotoRole = (role) => {
    setOpen(false)
    navigate(`/login?role=${role}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50 shadow-lg">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Logo size="default" />

          <nav className="hidden md:flex gap-8 font-medium">
            <a href="#features" className="relative group">
              <span className="hover:text-cyan-300 transition">Features</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#premium" className="relative group">
              <span className="hover:text-cyan-300 transition">Premium</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#contact" className="relative group">
              <span className="hover:text-cyan-300 transition">Contact</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 group-hover:w-full transition-all duration-300" />
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 rounded-lg border border-cyan-400/40 px-4 py-2 hover:bg-cyan-400/10 hover:border-cyan-400/60 transition-all duration-300 backdrop-blur"
              >
                Login
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-800/95 ring-1 ring-slate-700/50 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => gotoRole("employee")}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-700/70 rounded-t-lg transition-colors first:rounded-t-lg"
                  >
                    Employee
                  </button>
                  <button
                    onClick={() => gotoRole("manager")}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-700/70 rounded-b-lg transition-colors last:rounded-b-lg"
                  >
                    Manager
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/register-manager"
              className="hidden md:inline-block relative group rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2 text-sm font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Register</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Advanced Animations */}
      <section className="relative pt-28 pb-32 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-40 -right-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-500" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-2 h-2 bg-cyan-400 rounded-full animate-float" />
          <div className="absolute top-40 right-[15%] w-3 h-3 bg-indigo-400 rounded-full animate-float-delayed" />
          <div className="absolute bottom-40 left-[20%] w-2 h-2 bg-purple-400 rounded-full animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur-xl border border-cyan-400/20 mb-8 animate-fade-in-down">
            <SparklesIcon className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Cloud-Based Intelligent Platform
            </span>
          </div>

          {/* Main Heading with Large Animated Logo */}
          <div className="flex flex-col items-center gap-6 animate-fade-in-up">
            {/* Large Logo Icon */}
            <Logo size="large" showText={false} />

            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="block mb-2">Cloud-Based</span>
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Intelligent
              </span>
              <span className="block mt-2">Project Management</span>
            </h2>
          </div>
          
          <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in delay-200">
            Orchestrate projects, chat in real-time, and predict delivery
            dates with built-in AI—all from a single, blazing-fast dashboard.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in delay-400">
            <a
              href="#features"
              className="group relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 px-8 py-4 font-semibold shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
            >
              <RocketLaunchIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span>Explore Free Features</span>
            </a>
            <a
              href="#premium"
              className="group inline-flex items-center gap-2 rounded-lg border-2 border-cyan-400/60 px-8 py-4 font-semibold hover:bg-cyan-400/10 backdrop-blur transition-all duration-300 hover:border-cyan-400 hover:scale-105"
            >
              <SparklesIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>View Premium</span>
            </a>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in delay-600">
            {[
              { value: "99.9%", label: "Uptime" },
              { value: "10k+", label: "Active Users" },
              { value: "500+", label: "Projects" },
              { value: "24/7", label: "Support" }
            ].map((stat, index) => (
              <div key={index} className="group hover:scale-110 transition-transform duration-300">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative bg-slate-900/60 py-24 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Free Features
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Everything you need to manage projects efficiently, at no cost
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: "📋", 
                title: "Task Board", 
                text: "Create, assign and track progress with intuitive drag-and-drop.",
                gradient: "from-cyan-500/10 to-blue-500/10",
                border: "border-cyan-500/20"
              },
              { 
                icon: "💬", 
                title: "Team Chat", 
                text: "Real-time communication with instant notifications.",
                gradient: "from-indigo-500/10 to-purple-500/10",
                border: "border-indigo-500/20"
              },
              { 
                icon: "🔔", 
                title: "Deadline Alerts", 
                text: "Never miss a milestone with smart reminders.",
                gradient: "from-purple-500/10 to-pink-500/10",
                border: "border-purple-500/20"
              },
              { 
                icon: "🗺️", 
                title: "Roadmap", 
                text: "Visualize delivery timelines and dependencies.",
                gradient: "from-pink-500/10 to-rose-500/10",
                border: "border-pink-500/20"
              },
            ].map(({ icon, title, text, gradient, border }, index) => (
              <div
                key={title}
                className={`group relative rounded-2xl bg-gradient-to-br ${gradient} p-6 backdrop-blur-sm border ${border} hover:border-opacity-50 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-indigo-500/0 group-hover:from-cyan-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />
                <div className="relative">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                  </div>
                  <h4 className="font-semibold text-xl mb-3 text-white">{title}</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section id="premium" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 backdrop-blur-xl border border-cyan-400/20 mb-6">
            <SparklesIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Premium Plan</span>
          </div>

          <h3 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Upgrade to Premium
          </h3>
          <p className="text-slate-300 text-lg mb-12 max-w-3xl mx-auto">
            Unlock unlimited projects, video meetings, granular analytics and
            priority support for mission-critical teams.
          </p>

          <div className="max-w-2xl mx-auto mb-12 grid md:grid-cols-2 gap-4 text-left">
            {[
              { icon: "🚀", text: "Unlimited projects & advanced tasks" },
              { icon: "📹", text: "Built-in video conferencing" },
              { icon: "🤖", text: "AI-driven reporting & insights" },
              { icon: "🛡️", text: "Priority SLA & enhanced security" },
            ].map(({ icon, text }, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 backdrop-blur border border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-slate-200">{text}</span>
              </div>
            ))}
          </div>

          <Link
            to="/register-manager"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-10 py-4 text-lg font-semibold shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
          >
            <RocketLaunchIcon className="w-5 h-5 group-hover:translate-y-[-4px] transition-transform" />
            <span>Start Building Projects</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
            
            {/* Brand & Description Column */}
            <div className="lg:col-span-2">
              <Logo size="default" className="mb-4" />
              
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                Cloud-based intelligent project management platform. Streamline your workflow, 
                collaborate in real-time, and achieve more with AI-powered insights.
              </p>
              
              {/* Newsletter Signup */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-300">Subscribe to our newsletter</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                  <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                {[
                  { name: "Features", href: "#features" },
                  { name: "Premium", href: "#premium" },
                  { name: "Pricing", href: "/pricing" },
                  { name: "Roadmap", href: "/roadmap" },
                  { name: "Changelog", href: "/changelog" },
                  { name: "API Docs", href: "/docs" },
                ].map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-cyan-400 group-hover:w-2 transition-all duration-300" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                {[
                  { name: "About Us", href: "/about" },
                  { name: "Blog", href: "/blog" },
                  { name: "Careers", href: "/careers" },
                  { name: "Press Kit", href: "/press" },
                  { name: "Partners", href: "/partners" },
                  { name: "Contact", href: "#contact-form" },
                ].map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-cyan-400 group-hover:w-2 transition-all duration-300" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support & Legal Column */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-3">
                {[
                  { name: "Help Center", href: "/help" },
                  { name: "Documentation", href: "/docs" },
                  { name: "Community", href: "/community" },
                  { name: "Status", href: "/status" },
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Terms of Service", href: "/terms" },
                ].map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-slate-400 hover:text-cyan-400 text-sm transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-cyan-400 group-hover:w-2 transition-all duration-300" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mt-16 pt-12 border-t border-slate-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Email Contact */}
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-1 text-sm">Email Us</h5>
                  <a href="mailto:support@promanageplus.com" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                    support@promanageplus.com
                  </a>
                  <p className="text-slate-500 text-xs mt-1">We reply within 24 hours</p>
                </div>
              </div>

              {/* Phone Contact */}
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-1 text-sm">Call Us</h5>
                  <a href="tel:+911234567890" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                    +91 123 456 7890
                  </a>
                  <p className="text-slate-500 text-xs mt-1">Mon-Fri, 9AM-6PM IST</p>
                </div>
              </div>

              {/* Office Location */}
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-1 text-sm">Visit Us</h5>
                  <p className="text-slate-400 text-sm">
                    123 Tech Park, Sector 5<br />
                    Bengaluru, Karnataka 560001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media & Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Social Media Links */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Follow us:</span>
                <div className="flex gap-3">
                  {[
                    { name: "Twitter", icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z", href: "https://twitter.com/promanageplus" },
                    { name: "LinkedIn", icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z", href: "https://linkedin.com/company/promanageplus" },
                    { name: "GitHub", icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22", href: "https://github.com/promanageplus" },
                    { name: "YouTube", icon: "M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z M9.75 15.02l0-6.53 5.75 3.27z", href: "https://youtube.com/@promanageplus" },
                  ].map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-indigo-500/10 hover:border-cyan-400/50 transition-all duration-300 hover:scale-110 group"
                      aria-label={social.name}
                    >
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={social.icon} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Copyright */}
              <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-slate-400">
                <p>© 2025 ProManage+. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <span className="hidden md:block text-slate-700">|</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-slate-400">All Systems Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 pt-8 border-t border-slate-800/30">
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-slate-500 text-xs flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                SSL Secured
              </div>
              <div className="text-slate-500 text-xs flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                </svg>
                GDPR Compliant
              </div>
              <div className="text-slate-500 text-xs flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ISO 27001
              </div>
              <div className="text-slate-500 text-xs flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                99.9% Uptime
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(10px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
        
        .delay-400 {
          animation-delay: 400ms;
        }
        
        .delay-600 {
          animation-delay: 600ms;
        }
        
        .delay-500 {
          animation-delay: 500ms;
        }
        
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  )
}
