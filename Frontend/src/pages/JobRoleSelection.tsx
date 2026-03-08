import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { TrendingUp, IndianRupee, Briefcase, Search, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Role = {
  id: string | number;
  title: string;
  demand: string;
  salary: string;
  skills: string[];
};

export default function JobRoleSelection() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const res = await api.get('/jobs/trending');
        setRoles(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError('Could not load trending roles right now.');
      } finally {
        setLoading(false);
      }
    };

    void fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) => {
      const inTitle = role.title.toLowerCase().includes(term);
      const inSkills = role.skills?.some((skill) => skill.toLowerCase().includes(term));
      return inTitle || inSkills;
    });
  }, [roles, searchTerm]);

  const handleSelectRole = (role: string) => {
    navigate('/plan', { state: { selectedRole: role } });
  };

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-sky-300" />
            Discover Your Path
          </h1>
          <p className="page-subtitle">Explore trending roles and start your personalized learning roadmap.</p>
        </div>
      </header>

      <div className="surface-card p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role or skill..."
            className="field pl-12"
          />
        </div>
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-400" />
          <p className="mt-3 text-slate-400">Loading trending roles...</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredRoles.map((role) => (
            <article key={role.id} className="surface-card interactive-card p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-xl font-bold text-white">{role.title}</h3>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-sky-200">
                  {role.demand}
                </span>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4" />
                  {role.salary}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  {role.demand} demand
                </span>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {role.skills?.map((skill) => (
                  <span key={skill} className="rounded-lg border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-xs text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>

              <button onClick={() => handleSelectRole(role.title)} className="btn-primary w-full py-3">
                <Sparkles className="h-4 w-4" /> Start Training Path
              </button>
            </article>
          ))}

          {filteredRoles.length === 0 && (
            <div className="surface-card p-8 text-center text-slate-400 lg:col-span-2">No matching roles found. Try a different keyword.</div>
          )}
        </div>
      )}
    </div>
  );
}

