import { useState } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

type View = 'login' | 'forgot' | 'reset';

export default function LoginModal({ isOpen, onClose, onSuccess, onSwitchToSignup }: LoginModalProps) {
  const { signIn, resetPassword } = useAuth();

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot / Reset
  const [view, setView] = useState<View>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setView('login');
    setEmail('');
    setPassword('');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setResetError('');
    setResetSuccess(false);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message || 'Invalid email or password');
      } else {
        onSuccess();
        setEmail('');
        setPassword('');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    // Just verify the email exists by attempting a lookup via resetPassword with a dummy
    // We move to the reset step — the actual password change happens on the next screen
    // We check existence by calling the real function only on the final step
    setView('reset');
    setResetLoading(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await resetPassword(resetEmail, newPassword);
      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess(true);
      }
    } catch {
      setResetError('An unexpected error occurred');
    } finally {
      setResetLoading(false);
    }
  };

  // ── Forgot Password – email step ──────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
          <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
            <p className="text-gray-400 text-sm mt-1">Enter your account email to continue</p>
          </div>

          <form onSubmit={handleForgotSubmit} className="p-6 space-y-4">
            {resetError && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-sm">{resetError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {resetLoading ? 'Checking...' : 'Continue'}
            </button>

            <div className="text-center text-sm text-gray-400">
              <button type="button" onClick={() => setView('login')} className="text-green-500 hover:text-green-400 font-medium transition-colors">
                ← Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Reset Password – new password step ────────────────────────────────────
  if (view === 'reset') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
          <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Set New Password</h2>
            <p className="text-gray-400 text-sm mt-1">
              Setting new password for <span className="text-green-400">{resetEmail}</span>
            </p>
          </div>

          <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
            {resetError && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-sm">{resetError}</p>
              </div>
            )}

            {resetSuccess ? (
              <div className="flex flex-col items-center space-y-4 py-4">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
                <p className="text-white font-semibold text-lg">Password reset!</p>
                <p className="text-gray-400 text-sm text-center">Your password has been updated. You can now log in with your new password.</p>
                <button
                  type="button"
                  onClick={() => { setView('login'); setResetSuccess(false); }}
                  className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-all"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                      placeholder="At least 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : confirmPassword && confirmPassword === newPassword
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                            : 'border-gray-700 focus:border-green-500 focus:ring-green-500'
                        }`}
                      placeholder="Repeat your new password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {resetLoading ? 'Saving...' : 'Reset Password'}
                </button>

                <div className="text-center text-sm text-gray-400">
                  <button type="button" onClick={() => setView('forgot')} className="text-green-500 hover:text-green-400 font-medium transition-colors">
                    ← Back
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-400 text-sm mt-1">Login to your SoleBuy account</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-400 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded" />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => { setResetEmail(email); setView('forgot'); setError(''); }}
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-green-500 hover:text-green-400 font-medium transition-colors"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
