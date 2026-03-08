import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import JobRoleSelection from './pages/JobRoleSelection';
import Login from './pages/Login';
import Plan from './pages/Plan';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import Quiz from './pages/Quiz';
import Resume from './pages/Resume';
import Signup from './pages/Signup';

const clearSession = () => {
  localStorage.removeItem('vidyamitra_user_id');
  localStorage.removeItem('vidyamitra_token');
  localStorage.removeItem('vidyamitra_refresh_token');
};

const parseJwtExpiry = (token: string): number | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded));
    if (typeof decoded?.exp !== 'number') return null;
    return decoded.exp;
  } catch {
    return null;
  }
};

const isExpired = (token: string) => {
  const exp = parseJwtExpiry(token);
  if (!exp) return false;
  return Date.now() >= exp * 1000;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('vidyamitra_token');
  const refreshToken = localStorage.getItem('vidyamitra_refresh_token');

  if (!token) return <Navigate to="/login" replace />;

  if (isExpired(token) && !refreshToken) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/roles" element={<JobRoleSelection />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/progress" element={<Progress />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
