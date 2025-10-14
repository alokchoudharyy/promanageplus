import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function RegisterManager() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  // Email/Password registration with email verification
  async function signUpEmail(e) {
    e.preventDefault()
    
    if (!form.email.includes('@')) {
      toast.error('Enter a valid email')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!form.fullName.trim()) {
      toast.error('Enter your full name')
      return
    }

    setLoading(true)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?role=manager`,
          data: {
            full_name: form.fullName,
            mobile: form.mobile || '',
            role: 'manager'
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Check if email confirmation is required
      if (!authData.session) {
        // Email confirmation required
        toast.success('✅ Check your email to confirm your account!', {
          duration: 5000
        })
        
        // Show message and redirect to login after delay
        setTimeout(() => {
          navigate('/login?role=manager&verified=pending')
        }, 3000)
      } else {
        // Auto-confirmed (shouldn't happen with confirm email ON)
        await insertProfile(authData.user)
        toast.success('✅ Manager account created!')
        setTimeout(() => navigate('/manager'), 2000)
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
    } finally {
      setLoading(false)
      setForm({ fullName: '', email: '', mobile: '', password: '' })
    }
  }

  // Helper to insert profile (will be called from callback page)
  async function insertProfile(user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        role: 'manager',
        manager_id: null,
        mobile: user.user_metadata?.mobile || '',
      })

    if (profileError) throw profileError
  }

  async function signUpWithGoogle() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-callback?role=manager`,
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('OAuth error:', error)
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 rounded-xl bg-white/10 backdrop-blur border border-white/20">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-300 hover:text-cyan-400"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Home
        </button>

        <h2 className="text-center text-2xl font-semibold text-white mb-2">
          Manager Registration
        </h2>
        <p className="text-center text-sm text-slate-400 mb-6">
          Create your account to manage teams
        </p>

        <button
          onClick={signUpWithGoogle}
          disabled={loading}
          className="w-full mb-4 flex items-center justify-center gap-3 rounded-md bg-white px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing up...' : 'Continue with Google'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-3 text-slate-400 text-sm">OR</span>
          </div>
        </div>

        <form onSubmit={signUpEmail} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="tel"
            placeholder="Mobile (Optional)"
            className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password (min 8 characters)"
            required
            className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-indigo-500 to-cyan-400 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-40 transition"
          >
            {loading ? 'Creating Account...' : 'Create Manager Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400">Already have an account? </span>
          <button
            onClick={() => navigate('/login?role=manager')}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
