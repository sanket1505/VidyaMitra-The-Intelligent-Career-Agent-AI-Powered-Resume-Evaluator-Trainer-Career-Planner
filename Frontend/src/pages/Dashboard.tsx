import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import MarketInsights from '../components/MarketInsights';

type ProgressSummaryResponse = {
  best_resume: number;
  training_progress: {
    completed: number;
    total: number;
    milestone: string;
    role: string;
  };
  avg_quiz: number;
  total_activities: number;
};

const REFRESH_INTERVAL_MS = 20000;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSummary = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get<ProgressSummaryResponse>('/progress/summary');
      setSummary(res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Dashboard Error:', err);
      setError('Failed to load dashboard data. Your session may have expired, please log in again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary(false);
    const id = setInterval(() => {
      void fetchSummary(true);
    }, REFRESH_INTERVAL_MS);

    const handleProgressUpdated = () => {
      void fetchSummary(true);
    };

    window.addEventListener('progress-updated', handleProgressUpdated);

    return () => {
      clearInterval(id);
      window.removeEventListener('progress-updated', handleProgressUpdated);
    };
  }, [fetchSummary]);

  const metrics = useMemo(() => {
    const resume = summary?.best_resume ?? 0;
    const completed = summary?.training_progress?.completed ?? 0;
    const total = Math.max(summary?.training_progress?.total ?? 10, 1);
    const quiz = summary?.avg_quiz ?? 0;
    const attempts = summary?.total_activities ?? 0;
    const nextMilestone = summary?.training_progress?.milestone ?? 'Start your journey';
    const role = summary?.training_progress?.role ?? 'Technology';
    const progressPct = Math.round((completed / total) * 100);

    return {
      resume,
      completed,
      total,
      quiz,
      attempts,
      nextMilestone,
      role,
      progressPct,
    };
  }, [summary]);

  const renderLoading = () => (
    <div className="flex items-center justify-center py-6">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
    </div>
  );

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <h1 className="page-title">Career Analytics Dashboard</h1>
          <p className="page-subtitle">AI-driven insights for your learning and interview readiness.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <p className="hidden text-xs text-slate-400 sm:block">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not synced yet'}</p>
          <button onClick={() => void fetchSummary(true)} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="surface-card interactive-card p-5 sm:p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Resume Score</h2>
          {loading ? renderLoading() : <div className="text-4xl font-black text-sky-300">{metrics.resume}<span className="ml-1 text-xl text-slate-500">/100</span></div>}
          <p className="mt-3 text-xs text-slate-500">Synced from your latest Resume AI evaluation.</p>
        </article>

        <article className="surface-card interactive-card p-5 sm:p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Training Progress</h2>
          {loading ? (
            renderLoading()
          ) : (
            <>
              <div className="mb-2 flex justify-between text-xs text-slate-300">
                <span>{metrics.completed} / {metrics.total} modules</span>
                <span>{metrics.progressPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${metrics.progressPct}%` }} />
              </div>
              <p className="mt-4 text-xs text-slate-400">Next: <span className="text-slate-200">{metrics.nextMilestone}</span></p>
            </>
          )}
        </article>

        <article className="surface-card interactive-card p-5 sm:p-6 sm:col-span-2 xl:col-span-1">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Quiz Performance</h2>
          {loading ? (
            renderLoading()
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Avg. Score</span>
                <span className="font-bold text-emerald-300">{metrics.quiz}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Activities</span>
                <span className="font-bold text-slate-200">{metrics.attempts}</span>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        <Link to="/plan" className="btn-primary">Continue Training</Link>
        <Link to="/quiz" className="btn-secondary">Take Quiz</Link>
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <Sparkles className="h-4 w-4" />
          Focus domain: {metrics.role}
        </div>
      </section>

      <section className="mt-6">
        <MarketInsights domain={metrics.role} />
      </section>
    </div>
  );
}

