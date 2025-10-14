import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

const OAUTH_PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' },
]

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function Login() {
  const navigate = useNavigate()
  const query = useQuery()
  const expectedRole = query.get('role') // ?role=manager or employee

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Email / password flow ──────────────────────────────────────
  async function handleEmailLogin() {
    if (!email.includes('@')) {
      toast.error('Enter a valid email')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // verify role before routing
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profErr || !profile) {
      toast.error('Unable to load profile')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }
    if (expectedRole && profile.role !== expectedRole) {
      toast.error(`Account is not a ${expectedRole}`)
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    toast.success('Login successful')
    navigate(profile.role === 'manager' ? '/manager' : '/employee-dashboard')
  }

  // ── OAuth flow ────────────────────────────────────────────────
  async function handleOAuth(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/manager` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 rounded-xl bg-white/10 backdrop-blur border border-white/20">
        {/* back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-300 hover:text-cyan-400"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Home
        </button>

        {/* header */}
        <h2 className="text-center text-2xl font-semibold text-white mb-6">
          {expectedRole ? `Login – ${expectedRole}` : 'Login'}
        </h2>

        {/* email */}
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full mb-4 rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* password */}
        <div className="relative mb-6">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full rounded-md bg-slate-800 px-4 py-2 pr-10 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
          >
            {showPwd ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <button
          disabled={loading}
          onClick={handleEmailLogin}
          className="w-full rounded-md bg-gradient-to-r from-cyan-400 to-indigo-500 py-2 font-medium text-white hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <button
          onClick={() => navigate('/forgot-password')}
          className="block text-center text-sm mt-4 text-cyan-400 hover:underline"
        >
          Forgot password?
        </button>

        {/* divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-3 text-slate-400 text-sm">OR</span>
          </div>
        </div>

        {/* OAuth buttons */}
        {OAUTH_PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleOAuth(p.id)}
            className="w-full mb-3 rounded-md border border-slate-600 py-2 text-slate-200 hover:bg-slate-800"
          >
            Sign in with {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
