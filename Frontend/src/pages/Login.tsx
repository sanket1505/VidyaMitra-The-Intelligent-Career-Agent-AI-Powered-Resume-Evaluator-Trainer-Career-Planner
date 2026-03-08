import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('vidyamitra_user_id', res.data.user_id);
      localStorage.setItem('vidyamitra_token', res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem('vidyamitra_refresh_token', res.data.refresh_token);
      }
      navigate('/dashboard');
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Vidya<span className="text-sky-400">Mitra</span>
            </h1>
            <p className="mt-3 max-w-md text-slate-300">Your AI career copilot for role discovery, personalized training, and interview readiness.</p>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <p className="surface-card-soft p-3">Realtime learning progress synced to dashboard.</p>
            <p className="surface-card-soft p-3">Adaptive training plans with project-ready milestones.</p>
            <p className="surface-card-soft p-3">AI quiz and voice interview practice with history.</p>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-8">
          <div className="mb-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
              <Sparkles className="h-3.5 w-3.5" /> Smart Login
            </p>
            <h2 className="mt-4 text-3xl font-bold">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to continue your journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Email Address</span>
              <span className="relative block">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="field pl-10 pr-11"
                  placeholder="Enter your password"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-sky-300 hover:text-sky-200">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}



