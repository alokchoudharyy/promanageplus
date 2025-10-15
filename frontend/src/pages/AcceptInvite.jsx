import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link');
      navigate('/login');
    }
  }, [token, navigate]);

  const acceptInvite = async (e) => {
    e.preventDefault(); // ✅ PREVENT DEFAULT FORM BEHAVIOR
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/accept-invite`;
      console.log('🔄 Calling:', url);

      const response = await fetch(url, {
        method: 'POST', // ✅ EXPLICIT POST
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token, 
          password, 
          full_name: fullName,
          mobile: mobile || ''
        })
      });

      console.log('📥 Response status:', response.status);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error accepting invite. Please try again.');
      }

      toast.success('✅ Account created successfully! You can now log in.');
      setTimeout(() => {
        navigate('/login?role=employee');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <Toaster position="top-right" />
      
      <div className="p-8 bg-white/10 backdrop-blur border border-white/20 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Accept Invitation</h2>
        
        {error && (
          <div className="p-3 mb-4 text-red-200 bg-red-500/20 border border-red-400/30 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* ✅ FORM WITH ONSUBMIT */}
        <form onSubmit={acceptInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Mobile Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="+1 234 567 8900"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          
          {/* ✅ SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || !password || !confirmPassword || !fullName}
            className="w-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-white py-2.5 rounded-md font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating Account...' : 'Create Account & Join Team'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}
