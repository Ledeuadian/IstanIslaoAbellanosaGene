// ===========================================
// LOGIN MODAL COMPONENT
// Admin authentication modal
// ===========================================

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN, REGISTER, GET_ME } from '../graphql/client';
import { useAuthStore } from '../store/authStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  const { login, logout } = useAuthStore();

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      if (data.login) {
        login(data.login.token, data.login.user);
        setError('');
        setUsername('');
        setPassword('');
        setEmail('');
        onClose();
      }
    },
    onError: (err) => {
      setError(err.message || 'Login failed');
    },
  });

  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      if (data.register) {
        login(data.register.token, data.register.user);
        setError('');
        setUsername('');
        setPassword('');
        setEmail('');
        onClose();
      }
    },
    onError: (err) => {
      setError(err.message || 'Registration failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      loginMutation({
        variables: { username, password },
        refetchQueries: [{ query: GET_ME }],
      });
    } else {
      registerMutation({
        variables: { username, password, email: email || undefined },
        refetchQueries: [{ query: GET_ME }],
      });
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const { isAuthenticated, user, isAdmin } = useAuthStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {isAuthenticated ? 'Account' : (mode === 'login' ? 'Admin Login' : 'Create Admin Account')}
        </h2>

        {isAuthenticated ? (
          // Logged in view
          <div className="space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-sm">Logged in as</p>
              <p className="text-white font-medium">{user?.username}</p>
              <p className="text-zinc-500 text-sm capitalize">Role: {user?.role}</p>
            </div>
            
            {isAdmin && (
              <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-3">
                <p className="text-emerald-400 text-sm">
                  ✓ You have admin privileges - full editing enabled
                </p>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          // Login/Register form
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-zinc-400 text-sm mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading || registerLoading}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              {loginLoading || registerLoading 
                ? 'Please wait...' 
                : (mode === 'login' ? 'Login' : 'Create Account')}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
              >
                {mode === 'login' 
                  ? "Don't have an account? Register" 
                  : 'Already have an account? Login'}
              </button>
            </div>
          </form>
        )}

        <p className="text-zinc-500 text-xs mt-6 text-center">
          {isAuthenticated 
            ? 'Logout to switch accounts'
            : 'Only administrators can edit the family tree'}
        </p>
      </div>
    </div>
  );
}