  import { useEffect, useState } from 'react'
  import { useNavigate, useSearchParams } from 'react-router-dom'
  import { supabase } from '../../supabaseClient'
  import toast, { Toaster } from 'react-hot-toast'

  export default function AuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('verifying')

    useEffect(() => {
      handleCallback()
    }, [])

    async function handleCallback() {
      try {
        console.log('🔄 AuthCallback started...')
        console.log('📍 Full URL:', window.location.href)
        console.log('📍 Hash:', window.location.hash)
        console.log('📍 Search params:', window.location.search)

        // ✅ FIX 1: Let Supabase handle the session automatically
        // The supabaseClient.js has detectSessionInUrl: true, so getSession() will read the hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        console.log('📦 Session check result:', {
          hasSession: !!session,
          error: sessionError?.message,
          userId: session?.user?.id
        })

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          throw new Error(`Session error: ${sessionError.message}`)
        }

        if (!session) {
          // ✅ FIX 2: If no session, try manual hash parsing (fallback)
          console.log('⚠️ No session from getSession, trying manual hash parse...')
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          console.log('🔍 Hash tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            tokenLength: accessToken?.length
          })

          if (accessToken && refreshToken) {
            console.log('🔄 Setting session manually from hash...')
            const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (setSessionError) {
              console.error('❌ setSession error:', setSessionError)
              throw new Error(`Failed to set session: ${setSessionError.message}`)
            }

            if (!setSessionData.session) {
              throw new Error('Session set but no user returned')
            }

            console.log('✅ Session set manually - User:', setSessionData.session.user.id)
            await handleProfileCheck(setSessionData.session.user, searchParams.get('role'))
            return
          }

          // ✅ FIX 3: Try refreshing session (for edge cases)
          console.log('🔄 Trying session refresh...')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError || !refreshData.session) {
            console.error('❌ No valid session found:', refreshError?.message)
            throw new Error('No valid session. Please click the confirmation link again or login manually.')
          }

          console.log('✅ Session refreshed - User:', refreshData.session.user.id)
          await handleProfileCheck(refreshData.session.user, searchParams.get('role'))
          return
        }

        // ✅ Session exists - proceed with profile check
        console.log('✅ Session exists - User:', session.user.id, session.user.email)
        await handleProfileCheck(session.user, searchParams.get('role'))

      } catch (error) {
        console.error('❌ Callback error:', error)
        setStatus('error')
        toast.error(error.message || 'Callback failed. Please login manually.')
        
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    }

    async function handleProfileCheck(user, expectedRole = null) {
      try {
        console.log('👤 Checking profile for user:', user.id, user.email)
        console.log('📋 Expected role:', expectedRole)
        console.log('📋 User metadata role:', user.user_metadata?.role)

        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Profile check error:', checkError)
          throw checkError
        }

        // ✅ Determine role with smart priority
        let finalRole = existingProfile?.role 
          || expectedRole 
          || user.user_metadata?.role 
          || 'employee'  // Safe default

        console.log('🎯 Final role determined:', finalRole)

        let finalProfile = existingProfile

        if (!existingProfile) {
          console.log('⚠️ No profile found - Creating...')
          
          const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            mobile: user.user_metadata?.mobile || null,
            role: finalRole,
            manager_id: user.user_metadata?.manager_id || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
            notification_preferences: {
              push: true,
              email: true,
              dailyDigest: true,
              deadlineReminders: true,
              emailNotifications: true
            }
          }

          console.log('📝 Inserting profile:', profileData)

          const { error: profileError, data: newProfile } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single()

          if (profileError) {
            // Handle race condition (trigger created profile first)
            if (profileError.code === '23505') {
              console.log('⚠️ Profile already exists (race condition) - Fetching...')
              const { data: fetchedProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
              
              if (fetchError) {
                console.error('❌ Failed to fetch existing profile:', fetchError)
                throw fetchError
              }
              
              finalProfile = fetchedProfile
              console.log('✅ Fetched existing profile - Role:', finalProfile.role)
            } else {
              console.error('❌ Profile insert error:', profileError)
              throw new Error(`Profile creation failed: ${profileError.message}`)
            }
          } else {
            finalProfile = newProfile
            console.log('✅ Profile created - Role:', finalProfile.role)
          }

          toast.success('✅ Account confirmed and profile created!')
        } else {
          console.log('✅ Profile exists - Role:', existingProfile.role)
          toast.success('✅ Profile loaded successfully!')
        }

        setStatus('success')
        
        // ✅ Role-based redirect
        const redirectRole = finalProfile?.role || 'employee'
        console.log('🚀 Redirecting to:', redirectRole === 'manager' ? '/manager' : '/employee-dashboard')
        
        setTimeout(() => {
          if (redirectRole === 'manager') {
            navigate('/manager', { replace: true })
          } else {
            navigate('/employee-dashboard', { replace: true })
          }
        }, 1500)

      } catch (error) {
        console.error('❌ Profile check error:', error)
        throw error
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
                Verifying your account...
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
