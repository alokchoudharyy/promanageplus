import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from reset link
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMessage("Enter your new password below");
      }
    });
  }, []);

  const handleUpdate = async () => {
    setMessage("");
    setError("");

    if (!password.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ 
      password: password 
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("✅ Password updated successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="p-8 bg-white/10 backdrop-blur border border-white/20 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Set New Password
        </h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          Choose a strong password for your account
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
              New Password
            </label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            />
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-2.5 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => navigate("/login")}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
