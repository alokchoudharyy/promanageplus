import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import toast, { Toaster } from 'react-hot-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    handleEmailVerification()
  }, [])

  async function handleEmailVerification() {
    try {
      // Get the session from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const access_token = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (!access_token) {
        throw new Error('No access token found')
      }

      // Set the session
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token
      })

      if (sessionError) throw sessionError

      const user = sessionData.user
      if (!user) throw new Error('No user found')

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingProfile) {
        // Create profile if it doesn't exist (email verification case)
        const role = searchParams.get('role') || user.user_metadata?.role || 'employee'
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            role: role,
            manager_id: null,
            mobile: user.user_metadata?.mobile || '',
          })

        if (profileError) throw profileError

        setStatus('success')
        toast.success('✅ Email verified! Redirecting...')
        
        setTimeout(() => {
          navigate(role === 'manager' ? '/manager' : '/employee-dashboard')
        }, 2000)
      } else {
        // Profile already exists
        setStatus('success')
        toast.success('✅ Logged in successfully!')
        
        setTimeout(() => {
          navigate(existingProfile.role === 'manager' ? '/manager' : '/employee-dashboard')
        }, 1500)
      }

    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      toast.error(error.message || 'Verification failed')
      
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="text-center p-8 rounded-xl bg-white/10 backdrop-blur border border-white/20">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Verifying your email...
            </h2>
            <p className="text-slate-400">Please wait a moment</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Verification Successful!
            </h2>
            <p className="text-slate-400">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-slate-400">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  )
}
