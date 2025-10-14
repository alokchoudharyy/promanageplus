import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'employee'

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Check if profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', session.user.id)
            .maybeSingle()

          if (!profile) {
            // Create profile
            await supabase.from('profiles').insert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        session.user.email?.split('@')[0] || '',
              role: role,  // Use role from URL
              manager_id: null,
              mobile: session.user.user_metadata?.phone || '',
            })
          }

          // Wait for AuthContext to refresh
          await new Promise(resolve => setTimeout(resolve, 1500))

          // Redirect based on role
          if (role === 'manager') {
            navigate('/manager')
          } else {
            navigate('/employee-dashboard')
          }
        } else {
          navigate('/login')
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        navigate('/login')
      }
    }

    handleCallback()
  }, [navigate, role])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg">Setting up your account...</p>
      </div>
    </div>
  )
}
