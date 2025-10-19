import { useState } from 'react'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { UserPlusIcon } from '@heroicons/react/24/outline'

export default function AddMember() {
  const [tab, setTab] = useState('create')
  const [fullName, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPwd] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState('')

  // ✅ Backend URL from environment or default
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  /* Create Employee */
  const createEmployee = async () => {
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Getting auth token...')
      const token = (await supabase.auth.getSession()).data.session?.access_token
      
      if (!token) {
        toast.error('Please login first')
        return
      }

      console.log('✅ Token obtained')
      console.log('📤 Sending request to:', `${BACKEND_URL}/api/create-employee`)

      const res = await fetch(`${BACKEND_URL}/api/create-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password, 
          full_name: fullName.trim(),
          mobile: mobile.trim() || ''
        }),
      })

      console.log('📥 Response status:', res.status)

      const data = await res.json()
      console.log('📦 Response data:', data)
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create employee')
      }
      
      toast.success('✅ Employee created successfully!')
      
      // Reset form
      setName('')
      setEmail('')
      setPwd('')
      setMobile('')
    } catch (err) {
      console.error('❌ Error:', err)
      toast.error(err.message || 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  /* Send Invite */
  const sendInvite = async () => {
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    setLoading(true)
    setLink('')
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) {
        toast.error('Please login first')
        return
      }

      console.log('📤 Sending invite to:', `${BACKEND_URL}/api/invite-employee`)

      const res = await fetch(`${BACKEND_URL}/api/invite-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }
      
      toast.success('✅ Invite sent successfully')
      setLink(data.inviteLink)
      setEmail('')
    } catch (err) {
      console.error('❌ Error:', err)
      toast.error(err.message || 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
    toast.success('Link copied!')
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Team Member</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create employee accounts directly or send invitation links
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Backend: {BACKEND_URL}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        {['create', 'invite'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-6 border-b-2 font-medium transition ${
              tab === t
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t === 'create' ? '👤 Create Account' : '✉️ Send Invite'}
          </button>
        ))}
      </div>

      {/* Create Employee Tab */}
      {tab === 'create' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Create Employee Account</h3>
          <p className="text-sm text-gray-600 mb-6">
            Employee can log in immediately with the credentials you set.
          </p>
          
          <div className="grid gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="John Doe"
                value={fullName}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="john@example.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile (Optional)
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Min 8 characters"
                type="password"
                value={password}
                onChange={e => setPwd(e.target.value)}
              />
            </div>

            <button
              onClick={createEmployee}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white py-2.5 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5" />
                  Create Employee
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Invite Employee Tab */}
      {tab === 'invite' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Send Employee Invite</h3>
          <p className="text-sm text-gray-600 mb-6">
            Employee will receive an email with a link to set their own password.
          </p>
          
          <div className="grid gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Email *
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="employee@example.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={sendInvite}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white py-2.5 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>

          {link && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-xl">✅</span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">
                    Invite Link Generated
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-md bg-white text-gray-700 select-all"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
