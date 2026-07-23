import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { RefreshCw, LogOut } from 'lucide-react';
import StudentPanel from './components/StudentPanel';
import Login from './components/Login';
import RegisterRequest from './components/RegisterRequest';
import { themeColors } from './lib/theme';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme] = useState<'light' | 'dark'>('dark');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendWarming, setBackendWarming] = useState(true);
  const colors = themeColors[theme];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      // theme state handled by user preference
    }
    const token = localStorage.getItem('supabase_auth_token');
    if (token) {
      fetchProfile(token);
    } else {
      prewarmBackend();
      setLoading(false);
    }
  }, []);

  async function prewarmBackend() {
    try {
      await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
    } catch { /* ignore */ }
    setBackendWarming(false);
  }

  async function fetchProfile(token: string) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) { handleLogout(); return; }
      const userProfile = await res.json();
      if (userProfile.role !== 'student') { handleLogout(); return; }
      setProfile({ ...userProfile, institution: 'Simulador Laboral' });
      setLoading(false);
    } catch (e) {
      console.error('fetchProfile error:', e);
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('supabase_auth_token');
    localStorage.removeItem('sandbox_mock_user_id');
    setProfile(null);
    navigate('/');
  }

  const isLight = theme === 'light';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg, color: colors.text }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 backdrop-blur-md" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: colors.primary, color: '#1B2632' }}>
              SL
            </div>
            <span className="text-sm font-bold font-mono tracking-tight" style={{ color: colors.text }}>
              SIMULADOR LABORAL
            </span>
          </div>

          {profile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover"
                  style={{ border: `1.5px solid ${colors.border}` }}
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold truncate max-w-[100px]" style={{ color: colors.text }}>
                    {profile.fullName}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="p-2 rounded-xl transition cursor-pointer"
                style={{ backgroundColor: isLight ? '#C9C1B1' : 'rgba(15,23,42,0.6)', border: `2px solid ${isLight ? '#1B2632' : 'rgba(30,41,59,0.8)'}`, color: isLight ? '#1B2632' : '#94a3b8' }}
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full mx-auto">
        {loading && (
          <div className="fixed inset-0 bg-[#0a0f1d]/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
              <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Iniciando simulador...</p>
              <p className="text-[9px] text-slate-600 max-w-xs text-center">(El primer load puede tardar 30s por cold start de Render)</p>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/register" element={<RegisterRequest />} />
          <Route path="/student/*" element={
            profile ? <StudentPanel theme={theme} profile={profile} /> : <Login onLoginSuccess={(token, p) => { localStorage.setItem('supabase_auth_token', token); setProfile(p); }} backendWarming={backendWarming} />
          } />
          <Route path="/*" element={
            profile ? <Navigate to="/student" replace /> : <Login onLoginSuccess={(token, p) => { localStorage.setItem('supabase_auth_token', token); setProfile(p); }} backendWarming={backendWarming} />
          } />
        </Routes>
      </main>
    </div>
  );
}
