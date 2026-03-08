import { useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  BookOpen,
  BrainCircuit,
  Mic,
  TrendingUp,
  LogOut,
  FileText,
  UserCircle2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', path: '/profile', icon: UserCircle2 },
  { name: 'Resume AI', path: '/resume', icon: FileText },
  { name: 'Job Roles', path: '/roles', icon: Target },
  { name: 'Training Plan', path: '/plan', icon: BookOpen },
  { name: 'Quizzes', path: '/quiz', icon: BrainCircuit },
  { name: 'Mock Interview', path: '/interview', icon: Mic },
  { name: 'Progress', path: '/progress', icon: TrendingUp },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPage = useMemo(() => {
    const match = navItems.find((item) => location.pathname.startsWith(item.path));
    return match?.name || 'Workspace';
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('vidyamitra_user_id');
    localStorage.removeItem('vidyamitra_token');
    localStorage.removeItem('vidyamitra_refresh_token');
    navigate('/login');
  };

  const sidebarNav = (
    <>
      <div className="border-b border-slate-800/80 p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Vidya<span className="text-sky-400">Mitra</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">AI Career Accelerator</p>
        <div className="mt-5 rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 text-xs text-sky-100">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Learning Mode
          </p>
          <p className="mt-1 text-[11px] text-sky-200/80">Realtime insights and adaptive training.</p>
        </div>
      </div>

      <nav className="soft-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'border border-sky-500/35 bg-sky-500/15 text-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.14)]'
                  : 'text-slate-400 hover:border hover:border-slate-700/80 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-sky-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 bg-slate-950/40 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="relative flex min-h-screen bg-transparent text-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-800/75 bg-slate-950/85 backdrop-blur md:flex">
        {sidebarNav}
      </aside>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/70 bg-slate-950/85 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Vidyamitra</p>
            <h2 className="text-sm font-semibold text-slate-100">{currentPage}</h2>
          </div>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="btn-secondary h-10 w-10 px-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88vw] flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-md transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarNav}
      </aside>

      <main className="relative min-h-screen flex-1 pb-6 pt-16 md:ml-72 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}


