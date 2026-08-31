import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const Login = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@teamflow.com', password: 'Admin@123' });
    else setForm({ email: 'member@teamflow.com', password: 'Member@123' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold mx-auto mb-3">
            TF
          </div>
          <h1 className="text-xl font-bold text-gray-800">Welcome back to TeamFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your projects</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Sign In
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 text-center">Quick demo login (dev only)</p>
            <div className="flex gap-2">
              <button
                onClick={() => fillDemo('admin')}
                className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Admin demo
              </button>
              <button
                onClick={() => fillDemo('member')}
                className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Member demo
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
