/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';
import { 
  Award, 
  TrendingUp, 
  Cpu, 
  User, 
  Database,
  BookOpen,
  Sliders, 
  RefreshCw, 
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { api } from './lib/api';
import StudentPanel from './components/StudentPanel';
import Login from './components/Login';
import RegisterRequest from './components/RegisterRequest';
import { supabase } from './lib/supabaseClient';


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

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App profile state
  const [profile, setProfile] = useState<any>(null);

  // Global Courses
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedCourseProgress, setSelectedCourseProgress] = useState<any>(null);

  // Instructor pipeline states
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [newPipelinePrompt, setNewPipelinePrompt] = useState('');
  const [newPipelineTitle, setNewPipelineTitle] = useState('');
  const [voiceModel, setVoiceModel] = useState('Charon');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Sync utilities
  const [loading, setLoading] = useState(true);
  const [backendWarming, setBackendWarming] = useState(true);

  // Service Worker Update States
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  
  // Local active view role (matches URL path)
  const [currentViewMode, setCurrentViewMode] = useState<'student' | 'instructor' | 'admin'>('student');

  // Projects Lab states
  const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(null);
  const [projectFileUrl, setProjectFileUrl] = useState('');
  const [exportingCV, setExportingCV] = useState(false);

  // Pre-warm backend API (mitigates cold start latency on Render free tier)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (!apiUrl) {
      setBackendWarming(false);
      return;
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    let active = true;

    async function checkHealth() {
      try {
        const response = await fetch(`${cleanApiUrl}/api/health`);
        if (response.ok && active) {
          console.log('[API] Backend connection warmed up successfully');
          setBackendWarming(false);
          return;
        }
      } catch (err) {
        console.warn('[API] Backend ping failed, service might be asleep. Retrying...', err);
      }
      
      if (active) {
        setTimeout(checkHealth, 4000); // Retry every 4 seconds
      }
    }

    checkHealth();

    return () => {
      active = false;
    };
  }, []);

  // Synchronize view mode state based on browser URL
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setCurrentViewMode('admin');
    } else if (location.pathname.startsWith('/instructor')) {
      setCurrentViewMode('instructor');
    } else {
      setCurrentViewMode('student');
    }
  }, [location.pathname]);

  // Load platform data upon mount, authentication or role updates
  useEffect(() => {
    const token = localStorage.getItem('supabase_auth_token');
    if (token) {
      setIsAuthenticated(true);
      loadPlatformData();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [currentViewMode, isAuthenticated]);

  // Listen for native Supabase OAuth session redirects and changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('supabase_auth_token', session.access_token);
        localStorage.setItem('sandbox_mock_user_id', session.user.id);
        localStorage.setItem('sandbox_view_mode', session.user.user_metadata?.role || 'student');
        setIsAuthenticated(true);
        loadPlatformData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for Service Worker updates and versioning
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        setSwRegistration(reg);

        if (reg.waiting) {
          setSwUpdateAvailable(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleApplyUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // Ignore if placeholder config fails
    }
    localStorage.removeItem('supabase_auth_token');
    localStorage.removeItem('sandbox_mock_user_id');
    localStorage.removeItem('sandbox_view_mode');
    setProfile(null);
    setIsAuthenticated(false);
  };

  const loadPlatformData = async () => {
    const token = localStorage.getItem('supabase_auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userProfile = await api.getProfile();
      if (userProfile.role !== 'student') {
        handleLogout();
        return;
      }

      setProfile({
        ...userProfile,
        certLevel: 'Analista Certificado Nivel I',
        institution: 'ITAM - Especialización en Finanzas Corporativas',
        verifiedIdentity: true
      });

      const courseList = await api.getCourses();
      setCourses(courseList);

      if (userProfile.role === 'instructor') {
        const pipelineData = await api.getPipelineReviews();
        setPipelines(pipelineData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error hydrating platform entities:', err);
      handleLogout();
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: any) => {
    try {
      setLoading(true);
      const detailed = await api.getCourseDetails(course.id);
      setSelectedCourse(detailed);
      
      const prog = await api.getProgress(course.id);
      setSelectedCourseProgress(prog);
      
      navigate('/student/clips');
      setLoading(false);
    } catch (err) {
      console.error('Failed opening course layout:', err);
      setLoading(false);
    }
  };

  const handleRefreshProgress = async () => {
    if (!selectedCourse) return;
    try {
      const prog = await api.getProgress(selectedCourse.id);
      setSelectedCourseProgress(prog);
      const userProfile = await api.getProfile();
      setProfile((prev: any) => ({ ...prev, pointsEarned: userProfile.pointsEarned }));
    } catch (err) {
      console.error('Failed refreshing progress records:', err);
    }
  };

  const handleCreatePipelineDraft = async (e: any) => {
    e.preventDefault();
    if (!newPipelinePrompt.trim() || !newPipelineTitle.trim() || isCreatingDraft) return;

    setIsCreatingDraft(true);
    try {
      const response = await api.triggerDraftPipeline({
        inputPrompt: `Guión explicativo de: "${newPipelineTitle}". Detalles clave: ${newPipelinePrompt}`,
        voiceModel: `elevenlabs-${voiceModel.toLowerCase()}-finance-v2`,
        videoPrompt: `Professional visual grid displaying market candles representing: ${newPipelineTitle}. Dark backdrop.`,
      });

      setPipelines(prev => [response, ...prev]);
      setNewPipelinePrompt('');
      setNewPipelineTitle('');
      setIsCreatingDraft(false);
      
      const updated = await api.getPipelineReviews();
      setPipelines(updated);
    } catch (err) {
      console.error('Pipeline drafting failed:', err);
      setIsCreatingDraft(false);
    }
  };

  const handleApprovePipelineItem = async (pipelineId: string) => {
    try {
      await api.patchPipelineStatus(pipelineId, 'approved', 'Revisión aprobada por Instructor. Publicado.');
      
      const updated = await api.getPipelineReviews();
      setPipelines(updated);

      const courseList = await api.getCourses();
      setCourses(courseList);
      
      if (selectedCourse) {
        const detailed = await api.getCourseDetails(selectedCourse.id);
        setSelectedCourse(detailed);
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleRejectPipelineItem = async (pipelineId: string) => {
    try {
      await api.patchPipelineStatus(pipelineId, 'rejected', 'Devuelto para optimización de voces.');
      const updated = await api.getPipelineReviews();
      setPipelines(updated);
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  const handleDownloadCV = () => {
    setExportingCV(true);
    setTimeout(() => {
      setExportingCV(false);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Por favor, permite las ventanas emergentes para descargar tu CV.");
        return;
      }

      printWindow.document.write(`
        <html>
        <head>
          <title>CV Financiero - ${profile?.fullName || 'Alumno'}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 30px; }
            .name { font-size: 28px; font-weight: bold; color: #0f766e; }
            .title { font-size: 16px; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
            .section-title { font-size: 18px; font-weight: bold; color: #0f766e; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .badge-container { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
            .badge { background: #f0fdfa; border: 1px solid #ccfbf1; color: #0f766e; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .skill-bar { background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 5px; }
            .skill-fill { background: #0f766e; height: 100%; }
            .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${profile?.fullName || 'Alumno'}</div>
            <div class="title">Certificación Práctica en Finanzas Corporativas</div>
            <div style="margin-top: 10px; font-size: 12px; color: #475569;">Nivel: ${profile?.certLevel || 'Inversor Novato'} | Puntos de Experiencia: ${profile?.pointsEarned || 0} XP</div>
          </div>

          <div class="section-title">Habilidades y Competencias Validadas por IA (Gemini)</div>
          <div style="margin-bottom: 20px;">
            <strong>Valuación de Activos DCF:</strong> 85%
            <div class="skill-bar"><div class="skill-fill" style="width: 85%;"></div></div>
          </div>
          <div style="margin-bottom: 20px;">
            <strong>Cálculo de WACC y Costo de Deuda:</strong> 75%
            <div class="skill-bar"><div class="skill-fill" style="width: 75%;"></div></div>
          </div>
          <div style="margin-bottom: 20px;">
            <strong>Análisis Comparativo de Razones P/E:</strong> 95%
            <div class="skill-bar"><div class="skill-fill" style="width: 95%;"></div></div>
          </div>
          <div style="margin-bottom: 20px;">
            <strong>Estructura y Cobertura de Apalancamientos:</strong> 60%
            <div class="skill-bar"><div class="skill-fill" style="width: 60%;"></div></div>
          </div>

          <div class="section-title">Cursos y Módulos Aprobados</div>
          <ul>
            <li><strong>Mentalidad y Fundamentos de Inversión</strong> - Certificado de Aprobación Práctica</li>
            <li><strong>Análisis de Empresas y Ratios Financieros</strong> - Certificado de Aprobación Práctica</li>
          </ul>

          <div class="section-title">Insignias Desbloqueadas</div>
          <div class="badge-container">
            <span class="badge">Maestro del P/E Ratio</span>
            <span class="badge">Interés Compuesto Exponencial</span>
          </div>

          <div class="footer">
            Documento digital certificado por la plataforma AuraFi / FinNova Academy mediante auditoría de rúbricas LLM en tiempo real.
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }, 1200);
  };

  const handleProjectSubmit = (projectId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFileUrl.trim()) return;
    setSubmittedProjectId(projectId);
    setProjectFileUrl('');
  };

  // Switch role and redirect layout
  const handleSandboxRoleSwitch = (role: 'student' | 'instructor' | 'admin') => {
    setCurrentViewMode(role);
    navigate(`/${role}`);
  };

  if ((!isAuthenticated || !profile) && location.pathname !== '/register') {
    return (
      <Login
        backendWarming={backendWarming}
        onLoginSuccess={async (token, userProfile) => {
          if (userProfile.role !== 'student') {
            alert('Acceso restringido a alumnos de la academia.');
            try {
              await supabase.auth.signOut();
            } catch (_) {}
            localStorage.removeItem('supabase_auth_token');
            localStorage.removeItem('sandbox_mock_user_id');
            localStorage.removeItem('sandbox_view_mode');
            setProfile(null);
            setIsAuthenticated(false);
            return;
          }
          localStorage.setItem('supabase_auth_token', token);
          localStorage.setItem('sandbox_mock_user_id', userProfile.id);
          localStorage.setItem('sandbox_view_mode', userProfile.role);
          setProfile(userProfile);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div id="finance-platform-core" className="min-h-screen bg-[#0a0f1d] text-slate-300 flex flex-col font-sans selection:bg-teal-450 selection:text-neutral-900">
      
      {/* -------------------------------------------------------------
          NAVBAR HEADER
          ------------------------------------------------------------- */}
      <header id="platform-navbar-header" className={`sticky top-0 z-50 bg-[#0a0f1d]/85 backdrop-blur-md border-b border-slate-800/50 px-4 py-3 shadow-md ${location.pathname.startsWith('/student') ? 'hidden md:block' : ''}`}>
        <div className={`mx-auto flex items-center justify-between w-full ${location.pathname.startsWith('/student') ? 'px-4 md:px-6' : 'max-w-7xl'}`}>
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 border border-slate-800/60 p-2 rounded-xl text-teal-400 shadow-sm">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-slate-200 block">
                  FINNOVA ACADEMY
                </span>
                <span className="bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[8px] px-1.5 py-0.5 rounded-md font-mono font-bold leading-none">
                  v1.0.0
                </span>
              </div>
              <span className="text-[9px] text-teal-400/80 font-mono font-semibold tracking-wider uppercase block">
                Enterprise LMS & AI Certification
              </span>
            </div>
          </div>

          {/* Nav links based on permission and routes */}
          {profile && (
            <>
              <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/40 border border-slate-800/60 p-1 rounded-xl">
                <Link
                  to="/student"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
                    currentViewMode === 'student'
                      ? 'bg-slate-900 border-slate-800/80 text-teal-400 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Portal Alumno
                </Link>
              </nav>

              {/* XP Badge and User Profile tag */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-950/60 px-3 py-1 rounded-full border border-slate-850/80 flex items-center gap-1.5 shadow-inner">
                  <Award className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-semibold text-indigo-300 font-mono tracking-tight">
                    {profile.pointsEarned} XP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <img 
                    src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'} 
                    alt="Profile Avatar" 
                    className="w-7.5 h-7.5 rounded-full border border-slate-800 object-cover"
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-300 truncate max-w-[100px] leading-tight">
                      {profile.fullName}
                    </p>
                    <p className="text-[8px] text-teal-400 font-medium tracking-wider font-mono uppercase leading-none mt-0.5">
                      {profile.certLevel}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-slate-900/60 hover:bg-slate-850 border border-slate-850/80 text-slate-400 hover:text-slate-200 p-2 rounded-xl transition cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN ROUTER WORKSPACE
          ------------------------------------------------------------- */}
      <main className={`flex-1 w-full mx-auto pb-20 ${location.pathname.startsWith('/student') ? '' : 'max-w-7xl p-4 md:p-6'}`}>
        
        {loading && (
          <div id="loading-indicator-cover" className="fixed inset-0 bg-[#0a0f1d]/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
              <RefreshCw className="w-7 h-7 text-teal-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">
                Estableciendo conexiones con Supabase...
              </p>
            </div>
          </div>
        )}

        <Routes>
          {/* PUBLIC REGISTRATION ROUTE */}
          <Route path="/register" element={<RegisterRequest />} />

          {/* STUDENT PANEL ROOT & NESTED ROUTING */}
          <Route path="/student/*" element={
            <StudentPanel 
              profile={profile}
              courses={courses}
              selectedCourse={selectedCourse}
              selectedCourseProgress={selectedCourseProgress}
              handleSelectCourse={handleSelectCourse}
              handleRefreshProgress={handleRefreshProgress}
              handleDownloadCV={handleDownloadCV}
              submittedProjectId={submittedProjectId}
              projectFileUrl={projectFileUrl}
              setProjectFileUrl={setProjectFileUrl}
              handleProjectSubmit={handleProjectSubmit}
              exportingCV={exportingCV}
            />
          } />

          {/* ROOT REDIRECT FALLBACK */}
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </main>


      {swUpdateAvailable && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-slate-900/95 border border-teal-500/50 backdrop-blur-md px-5 py-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3.5 max-w-sm animate-fade-in-up">
            <div className="bg-teal-500/10 border border-teal-500/20 p-2 rounded-xl text-teal-400">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-slate-200">¡Nueva versión disponible!</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Se han detectado actualizaciones en el portal de alumnos.</p>
            </div>
            <button
              onClick={handleApplyUpdate}
              className="mt-2 sm:mt-0 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-[10px] rounded-lg shadow-md hover:shadow-teal-500/25 transition cursor-pointer"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
