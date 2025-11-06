import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';  // Updated client with detectSessionInUrl: true
import toast, { Toaster } from 'react-hot-toast';

export default function OAuthCallback() {  // Or AuthCallback if you prefer
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type');
  const errorDescription = searchParams.get('error_description');
  const expectedRole = searchParams.get('role') || 'manager';

  console.log('🔄 OAuthCallback loaded – Type:', type, 'Role:', expectedRole, 'Error:', errorDescription);
  console.log('🔄 Full URL:', window.location.href);  // Debug: Check #access_token in console

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let session;
        
        // Step 1: Try standard getSession (auto handles URL tokens)
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('⚠️ getSession error, trying manual exchange:', sessionError.message);
          
          // Step 2: Manual token exchange if URL has #access_token (magic link/OAuth)
          const hash = window.location.hash.substring(1);  // Extract #access_token=...&refresh_token=...
          if (hash && hash.includes('access_token')) {
            console.log('🔄 Manual exchange with hash:', hash);
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(hash);
            
            if (exchangeError) {
              console.error('❌ Exchange error:', exchangeError);
              throw new Error(`Token exchange failed: ${exchangeError.message}`);
            }
            
            session = exchangeData.session;
            console.log('✅ Manual session obtained');
            
            // Clear hash from URL (clean up)
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          } else {
            throw new Error('No access token or invalid callback – Check redirect URL in Supabase config');
          }
        } else {
          session = currentSession;
          console.log('✅ Session from getSession');
        }

        if (!session || !session.user) {
          console.error('❌ No valid session after exchange');
          throw new Error('Session not found. Please try the link again.');
        }

        const user = session.user;
        console.log('✅ User ready:', user.id, user.email, 'Metadata:', user.user_metadata);

        // Profile handle (same as before, RLS off safe)
        await handleProfileCheck(user, expectedRole);

        // Success redirect
        toast.success(`Welcome ${expectedRole}! Loading dashboard...`);
        const timeoutId = setTimeout(() => {
          const dashboard = expectedRole === 'manager' ? '/manager' : '/employee-dashboard';
          navigate(dashboard, { replace: true });  // Replace to avoid back to callback
        }, 1500);

        return () => clearTimeout(timeoutId);

      } catch (error) {
        console.error('❌ Callback error:', error);
        toast.error(`Auth failed: ${error.message}. Try login again.`);  // User-friendly
        navigate('/login?error=token', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  // Profile logic (unchanged, RLS off – insert works)
  const handleProfileCheck = async (user, expectedRole) => {
    try {
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('id, role, full_name, manager_id, mobile')
        .eq('id', user.id)
        .single();

      if (profError && profError.code === 'PGRST116') {
        console.log('⚠️ Creating profile...');
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0].replace(/\./g, ' ');
        const mobile = user.user_metadata?.mobile || null;
        const managerId = expectedRole === 'employee' ? user.user_metadata?.manager_id || null : null;

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: expectedRole,
            manager_id: managerId,
            mobile,
            updated_at: new Date().toISOString(),
            notification_preferences: {
              push: true, email: true, dailyDigest: true, deadlineReminders: true, emailNotifications: true
            }
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          toast('Profile warning: Check settings later', { icon: '⚠️', style: { background: '#FF9800', color: 'white' } });
        } else {
          console.log('✅ Profile created – Role:', expectedRole);
          toast.success('Profile set!');
        }
        return;
      } else if (profError) {
        console.error('Profile fetch error:', profError);
        return;  // Proceed without profile
      }

      console.log('✅ Profile exists – Role:', profile.role);

      if (profile.role === null || profile.role === undefined) {
        console.log('⚠️ Updating null role...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: expectedRole, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) {
          console.error('Update error:', updateError);
        } else {
          console.log('✅ Role updated:', expectedRole);
          toast.success(`Role: ${expectedRole}`);
        }
      }
    } catch (error) {
      console.error('Profile error:', error);
    }
  };

  if (errorDescription) {
    toast.error(`Error: ${errorDescription}`);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="max-w-md bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Auth Error</h2>
          <p className="text-gray-600 mb-4">{errorDescription}</p>
          <button onClick={() => navigate('/login')} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Toaster position="top-right" />
      <div className="max-w-md bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 rounded-full"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Login...</h2>
        <p className="text-gray-600">Extracting session for {expectedRole} access.</p>
      </div>
    </div>
  );
}
