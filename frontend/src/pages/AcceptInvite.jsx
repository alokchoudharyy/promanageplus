import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeftIcon, UserIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifyError, setVerifyError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verify on load (Supabase session after magic link, fallback backend token if custom)
  useEffect(() => {
    const token = searchParams.get('token');  // For custom backend token
    const type = searchParams.get('type');  // signup/invite
    console.log('🔄 Invite Callback type:', type, 'Token present:', !!token);

    const verifyInvite = async () => {
      try {
        // Primary: Supabase magic link session (after email click)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          console.log('✅ Session active after invite - User:', session.user.email);
          setEmail(session.user.email);
          setIsValid(true);
          toast.success('Invite verified! Complete your profile below.');

          // Prefill profile if exists (from metadata)
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, mobile, role')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            setFullName(profile.full_name || '');
            setMobile(profile.mobile || '');
            console.log('✅ Profile exists - Role:', profile.role);  // Should be 'employee'
            if (profile.role !== 'employee') {
              toast.warning('Role set to employee for invite.');
            }
          } else {
            console.log('⚠️ No profile - Will create on submit');
          }
          setLoading(false);
          return;
        }

        // Fallback: If no session, check backend token (if custom invite)
        if (token) {
          console.log('🔍 Verifying custom token...');
          const response = await fetch(`http://localhost:5000/api/employees/verify/${token}`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.error || `Server error: ${response.status}`);
          }

          const data = responseData;
          if (data.valid) {
            setIsValid(true);
            setEmail(data.data?.email || email);
            setFullName(data.data?.full_name || fullName);
            setMobile(data.data?.mobile || '');
            toast.success('Custom invite verified! Set password below.');
          } else {
            throw new Error(data.error || 'Invalid invitation data');
          }
        } else {
          throw new Error('No session or token. Use the invite link from email.');
        }
      } catch (error) {
        console.error('❌ Verify error:', error);
        const errorMsg = error.message.includes('500') 
          ? 'Server error during verification. Please contact your manager.' 
          : error.message;
        setVerifyError(errorMsg);
        toast.error(`Verification failed: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters!');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Full name is required!');
      return;
    }

    setSubmitLoading(true);
    try {
      // Get session (required for updateUser/profile)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session. Refresh the invite link.');
      }

      const userId = session.user.id;

      // Update password (for magic link user)
      const { error: authError } = await supabase.auth.updateUser({
        password
      });

      if (authError) throw authError;

      // Update/insert profile (role 'employee' for invite)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({  // Safe upsert
          id: userId,
          email: session.user.email,
          full_name: fullName.trim(),
          mobile: mobile.trim() || null,
          role: 'employee',  // Hardcode for invite
          updated_at: new Date().toISOString(),
          manager_id: session.user.user_metadata?.manager_id || null,  // If passed in metadata
        });

      if (profileError) {
        console.warn('Profile update failed:', profileError);
        // Don't throw if non-critical (auth done)
      }

      // Optional: Backend accept call (mark invite accepted)
      if (searchParams.get('token')) {
        try {
          await fetch(`http://localhost:5000/api/employees/complete-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullName.trim(), mobile: mobile.trim() || null })
          });
        } catch (acceptErr) {
          console.warn('Optional backend accept failed:', acceptErr);
        }
      }

      toast.success('Account setup complete! Redirecting to dashboard...');
      console.log('✅ Invite accepted - Role: employee');
      
      // Redirect to employee dashboard
      setTimeout(() => {
        navigate('/employee-dashboard');
      }, 1500);

    } catch (error) {
      console.error('❌ Setup error:', error);
      toast.error(`Setup failed: ${error.message}. Try logging in.`);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (verifyError || !isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Invitation Issue</h2>
          <p className="text-red-600 mb-4">{verifyError}</p>
          <button onClick={() => navigate('/login')} className="bg-blue-500 text-white px-4 py-2 rounded">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Accept Team Invitation</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Complete setup to join your manager's team</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email - Readonly from session */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              readOnly
              value={email}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name *</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile (Optional)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 12345 67890"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password *</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password *</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitLoading || password !== confirmPassword || !fullName.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 disabled:opacity-50"
            >
              {submitLoading ? 'Completing...' : 'Accept Invite & Join'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-blue-500 hover:underline"
          >
            <ArrowLeftIcon className="h-4 w-4 inline mr-1" /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
