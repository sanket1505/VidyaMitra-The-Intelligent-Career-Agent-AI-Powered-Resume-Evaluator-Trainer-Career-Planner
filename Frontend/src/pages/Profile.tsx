import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserCircle2,
  Mail,
  CalendarDays,
  RefreshCw,
  BrainCircuit,
  BookOpen,
  Activity,
  FileText,
  Mic,
  ListChecks,
} from 'lucide-react';

import api from '../api/axios';

type ProfileResponse = {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    initials?: string;
    joined_at?: string;
  };
  summary: {
    best_resume: number;
    avg_quiz: number;
    total_activities: number;
    hours_trained: number;
    interview_rank: string;
    training_progress: {
      completed: number;
      total: number;
      milestone: string;
      role: string;
    };
  };
  counts: {
    plans: number;
    quizzes: number;
    interviews: number;
    resumes: number;
  };
  recent: {
    plans: Array<{
      id: string;
      role: string;
      current_milestone: string;
      completed_modules: number;
      total_modules: number;
      created_at?: string;
    }>;
    quizzes: Array<{
      id: string;
      topic: string;
      score: number;
      total_questions: number;
      created_at?: string;
    }>;
    interviews: Array<{
      id: string;
      role_applied_for: string;
      readiness_score: number;
      created_at?: string;
    }>;
    resumes: Array<{
      id: string;
      score: number;
      created_at?: string;
    }>;
  };
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileResponse | null>(null);

  const fetchProfile = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get<ProfileResponse>('/profile/me');
      setData(res.data);
      setError(null);
    } catch (e: any) {
      console.error('Profile fetch error:', e);
      setError(e?.response?.data?.detail || 'Could not load your profile right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile(false);
  }, [fetchProfile]);

  const fullName = useMemo(() => {
    const first = data?.user?.first_name?.trim() || '';
    const last = data?.user?.last_name?.trim() || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    return data?.user?.email || 'User';
  }, [data]);

  const trainingPct = useMemo(() => {
    const completed = data?.summary?.training_progress?.completed || 0;
    const total = Math.max(data?.summary?.training_progress?.total || 1, 1);
    return Math.round((completed / total) * 100);
  }, [data]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="surface-card p-8 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-sky-300" />
          <p className="mt-3 text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <UserCircle2 className="h-7 w-7 text-sky-300" /> Profile
          </h1>
          <p className="page-subtitle">Your account details, progress stats, and recent learning activity.</p>
        </div>

        <button onClick={() => void fetchProfile(true)} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <section className="surface-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 text-2xl font-black text-sky-200">
              {data?.user?.initials || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">{fullName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <Mail className="h-4 w-4 text-slate-500" /> {data?.user?.email || 'N/A'}
                </p>
                <p className="inline-flex items-center gap-2 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" /> Joined: {formatDate(data?.user?.joined_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="surface-card interactive-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Best Resume</p>
          <p className="mt-2 text-2xl font-black text-sky-300">
            {data?.summary?.best_resume ?? 0}
            <span className="text-base text-slate-500">/100</span>
          </p>
        </article>
        <article className="surface-card interactive-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Avg Quiz</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{data?.summary?.avg_quiz ?? 0}%</p>
        </article>
        <article className="surface-card interactive-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hours Trained</p>
          <p className="mt-2 text-2xl font-black text-amber-300">{data?.summary?.hours_trained ?? 0}h</p>
        </article>
        <article className="surface-card interactive-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Interview Rank</p>
          <p className="mt-2 text-2xl font-black text-violet-300">{data?.summary?.interview_rank || 'Top 60%'}</p>
        </article>
        <article className="surface-card interactive-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Activities</p>
          <p className="mt-2 text-2xl font-black text-cyan-300">{data?.summary?.total_activities ?? 0}</p>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="surface-card p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-sky-300" /> Training Focus
          </h3>
          <p className="text-sm text-slate-300">
            Role: <span className="font-semibold text-slate-100">{data?.summary?.training_progress?.role || 'Technology'}</span>
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Current milestone:{' '}
            <span className="font-semibold text-slate-100">{data?.summary?.training_progress?.milestone || 'Continue Learning'}</span>
          </p>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs text-slate-400">
              <span>
                {data?.summary?.training_progress?.completed || 0}/{data?.summary?.training_progress?.total || 1} modules
              </span>
              <span>{trainingPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${trainingPct}%` }} />
            </div>
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-sky-300" /> Total Records
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="surface-card-soft p-3">
              <p className="inline-flex items-center gap-1 text-slate-400">
                <ListChecks className="h-4 w-4" /> Plans
              </p>
              <p className="mt-1 text-xl font-bold text-slate-100">{data?.counts?.plans ?? 0}</p>
            </div>
            <div className="surface-card-soft p-3">
              <p className="inline-flex items-center gap-1 text-slate-400">
                <BrainCircuit className="h-4 w-4" /> Quizzes
              </p>
              <p className="mt-1 text-xl font-bold text-slate-100">{data?.counts?.quizzes ?? 0}</p>
            </div>
            <div className="surface-card-soft p-3">
              <p className="inline-flex items-center gap-1 text-slate-400">
                <Mic className="h-4 w-4" /> Interviews
              </p>
              <p className="mt-1 text-xl font-bold text-slate-100">{data?.counts?.interviews ?? 0}</p>
            </div>
            <div className="surface-card-soft p-3">
              <p className="inline-flex items-center gap-1 text-slate-400">
                <FileText className="h-4 w-4" /> Resumes
              </p>
              <p className="mt-1 text-xl font-bold text-slate-100">{data?.counts?.resumes ?? 0}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="surface-card p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Plans</h3>
          <div className="space-y-2">
            {(data?.recent?.plans || []).length === 0 && <p className="text-sm text-slate-500">No plan history yet.</p>}
            {(data?.recent?.plans || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-3 text-sm">
                <p className="font-semibold text-slate-100">{item.current_milestone}</p>
                <p className="mt-1 text-slate-400">
                  {item.role} • {item.completed_modules}/{item.total_modules} modules
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Quizzes</h3>
          <div className="space-y-2">
            {(data?.recent?.quizzes || []).length === 0 && <p className="text-sm text-slate-500">No quiz attempts yet.</p>}
            {(data?.recent?.quizzes || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-3 text-sm">
                <p className="font-semibold text-slate-100">{item.topic || 'General'}</p>
                <p className="mt-1 text-slate-400">Score {item.score}/{item.total_questions}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="surface-card p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Interviews</h3>
          <div className="space-y-2">
            {(data?.recent?.interviews || []).length === 0 && <p className="text-sm text-slate-500">No interview sessions yet.</p>}
            {(data?.recent?.interviews || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-3 text-sm">
                <p className="font-semibold text-slate-100">{item.role_applied_for || 'Role'}</p>
                <p className="mt-1 text-slate-400">Readiness score: {item.readiness_score}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Resume Scores</h3>
          <div className="space-y-2">
            {(data?.recent?.resumes || []).length === 0 && <p className="text-sm text-slate-500">No resume evaluations yet.</p>}
            {(data?.recent?.resumes || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-3 text-sm">
                <p className="font-semibold text-slate-100">ATS Score: {item.score}/100</p>
                <p className="mt-1 text-slate-400">{formatDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

