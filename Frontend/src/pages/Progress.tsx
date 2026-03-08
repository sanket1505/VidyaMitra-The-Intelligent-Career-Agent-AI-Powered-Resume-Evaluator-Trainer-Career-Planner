import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, Award, Clock, Star, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

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

type SkillBar = {
  name: string;
  pct: number;
};

const REFRESH_INTERVAL_MS = 20000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const inferInterviewRank = (compositeScore: number) => {
  if (compositeScore >= 90) return 'Top 5%';
  if (compositeScore >= 80) return 'Top 15%';
  if (compositeScore >= 70) return 'Top 30%';
  if (compositeScore >= 60) return 'Top 45%';
  return 'Top 60%';
};

const buildSkills = (role: string, composite: number): SkillBar[] => {
  const roleName = role.toLowerCase();

  if (roleName.includes('frontend')) {
    return [
      { name: 'React', pct: clamp(composite + 8, 35, 98) },
      { name: 'JavaScript', pct: clamp(composite + 5, 35, 96) },
      { name: 'System Design', pct: clamp(composite - 8, 25, 90) },
      { name: 'Accessibility', pct: clamp(composite - 3, 30, 92) },
    ];
  }

  if (roleName.includes('data')) {
    return [
      { name: 'SQL', pct: clamp(composite + 6, 35, 98) },
      { name: 'Python', pct: clamp(composite + 3, 35, 96) },
      { name: 'Statistics', pct: clamp(composite - 5, 25, 90) },
      { name: 'Data Viz', pct: clamp(composite - 2, 30, 92) },
    ];
  }

  return [
    { name: 'Problem Solving', pct: clamp(composite + 5, 35, 98) },
    { name: 'Communication', pct: clamp(composite - 2, 30, 92) },
    { name: 'System Thinking', pct: clamp(composite - 6, 25, 90) },
    { name: 'Execution', pct: clamp(composite + 1, 30, 95) },
  ];
};

export default function Progress() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get<ProgressSummaryResponse>('/progress/summary');
      setSummary(res.data);
      setError(null);
    } catch (err) {
      console.error('Progress summary error:', err);
      setError('Could not refresh growth data right now. Please try again.');
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

  const computed = useMemo(() => {
    const avgQuiz = summary?.avg_quiz ?? 0;
    const resume = summary?.best_resume ?? 0;
    const completed = summary?.training_progress?.completed ?? 0;
    const total = Math.max(summary?.training_progress?.total ?? 10, 1);
    const role = summary?.training_progress?.role ?? 'Technology';
    const milestone = summary?.training_progress?.milestone ?? 'Start your journey';

    const composite = Math.round((avgQuiz + resume) / 2);
    const hours = (completed * 1.5).toFixed(1);
    const completionPct = Math.round((completed / total) * 100);
    const rank = inferInterviewRank(composite);
    const skills = buildSkills(role, composite);

    return {
      avgQuiz,
      resume,
      completed,
      total,
      role,
      milestone,
      composite,
      hours,
      completionPct,
      rank,
      skills,
    };
  }, [summary]);

  const stats = [
    { label: 'Avg. Quiz Score', value: `${computed.avgQuiz}%`, icon: Award, color: 'text-emerald-300' },
    { label: 'Resume Match', value: `${computed.resume}/100`, icon: Zap, color: 'text-sky-300' },
    { label: 'Hours Trained', value: `${computed.hours}h`, icon: Clock, color: 'text-amber-300' },
    { label: 'Interview Rank', value: computed.rank, icon: Star, color: 'text-yellow-300' },
  ];

  const isReadyForInterview = computed.composite >= 70;

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-sky-300" /> Your Growth Journey
          </h1>
          <p className="page-subtitle">Live progress from your latest training, quiz, and resume updates.</p>
        </div>

        <button onClick={() => void fetchSummary(true)} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="surface-card interactive-card p-5 sm:p-6">
            <stat.icon className={`mb-4 h-6 w-6 ${stat.color}`} />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">{loading ? '...' : stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="surface-card p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Skill Breakdown</h3>
            <span className="rounded-lg border border-slate-700/80 bg-slate-900/40 px-3 py-1 text-xs text-slate-300">{computed.role}</span>
          </div>

          <div className="space-y-5">
            {computed.skills.map((skill) => (
              <div key={skill.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-300">{skill.name}</span>
                  <span className="font-bold text-sky-300">{loading ? '--' : `${skill.pct}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${loading ? 0 : skill.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-slate-400">
            Plan completion: <span className="font-semibold text-slate-200">{computed.completed}/{computed.total} modules</span> ({computed.completionPct}%)
          </p>
        </article>

        <article className="surface-card flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-sky-500/10 p-4">
            <Zap className="h-10 w-10 text-sky-300" />
          </div>
          <h3 className="text-2xl font-black">{isReadyForInterview ? 'You are interview ready' : 'Keep building momentum'}</h3>
          <p className="mt-2 text-slate-300">
            Next focus: <span className="font-semibold text-slate-100">{computed.milestone}</span>
          </p>
          <p className="mb-6 mt-2 text-slate-300">
            Composite score: <span className="font-bold text-emerald-300">{computed.composite}/100</span>
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <button onClick={() => navigate('/interview')} className="btn-primary w-full py-3">Start Mock Interview</button>
            <button onClick={() => navigate('/quiz')} className="btn-secondary w-full py-3">Improve Quiz Score</button>
          </div>
        </article>
      </section>
    </div>
  );
}

