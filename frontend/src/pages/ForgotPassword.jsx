import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("✅ Check your email for a password reset link!");
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="p-8 bg-white/10 backdrop-blur border border-white/20 rounded-xl shadow-2xl w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-300 hover:text-cyan-400"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Login
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Forgot Password
        </h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          Enter your email to receive a password reset link
        </p>

        {error && (
          <div className="p-3 mb-4 text-red-200 bg-red-500/20 border border-red-400/30 rounded-md text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 mb-4 text-green-200 bg-green-500/20 border border-green-400/30 rounded-md text-sm">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            />
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-white py-2.5 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400">Remember your password? </span>
          <button
            onClick={() => navigate("/login")}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
