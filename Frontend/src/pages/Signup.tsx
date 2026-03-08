import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, UserRoundPlus } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/auth/signup', formData);
      setSuccess('Account created successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="surface-card w-full max-w-2xl p-6 sm:p-8">
        <div className="mb-7 text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            <UserRoundPlus className="h-3.5 w-3.5" /> New Account
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
            Vidya<span className="text-sky-400">Mitra</span>
          </h1>
          <p className="mt-2 text-slate-400">Create your profile and unlock your AI-powered career track.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">First Name</span>
              <input
                type="text"
                required
                className="field"
                placeholder="First Name"
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Last Name</span>
              <input
                type="text"
                required
                className="field"
                placeholder="Last Name"
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Email Address</span>
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                className="field pl-10"
                placeholder="name@company.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </span>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Password</span>
            <span className="relative block">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                className="field pl-10"
                placeholder="Minimum 8 characters"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-300 hover:text-sky-200">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

