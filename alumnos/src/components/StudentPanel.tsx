import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import CmeCalculator from './CmeCalculator';
import { 
  BookOpen, 
  Play, 
  Layers, 
  Clock, 
  User, 
  Award, 
  ShieldCheck, 
  Download, 
  Upload, 
  CheckCircle2, 
  Star, 
  ChevronRight, 
  RefreshCw,
  Users,
  TrendingUp,
  Beaker,
  Info,
  Menu,
  ChevronLeft,
  X,
  MessageSquare,
  HelpCircle,
  MessageCircle,
  Send
} from 'lucide-react';
import VideoFeed from './VideoFeed';
import { api } from '../lib/api';

interface StudentPanelProps {
  profile: any;
  courses: any[];
  selectedCourse: any;
  selectedCourseProgress: any;
  handleSelectCourse: (course: any) => Promise<void>;
  handleRefreshProgress: () => Promise<void>;
  handleDownloadCV: () => void;
  submittedProjectId: string | null;
  projectFileUrl: string;
  setProjectFileUrl: (url: string) => void;
  handleProjectSubmit: (projectId: string, e: React.FormEvent) => void;
  exportingCV: boolean;
}

export default function StudentPanel({
  profile,
  courses,
  selectedCourse,
  selectedCourseProgress,
  handleSelectCourse,
  handleRefreshProgress,
  handleDownloadCV,
  submittedProjectId,
  projectFileUrl,
  setProjectFileUrl,
  handleProjectSubmit,
  exportingCV
}: StudentPanelProps) {
  const location = useLocation();
  const [labTab, setLabTab] = useState<'garch' | 'cme'>('garch');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const mockProjects = [
    {
      id: "p1",
      title: "Modelo de Valuación DCF de Nvidia Inc. 2026",
      description: "Construye una valuación de flujos de caja descontados proyectando la demanda de microprocesadores para IA, estimando el WACC y realizando análisis de sensibilidad de escenarios.",
      difficulty: 4,
      datasetUrl: "https://vjs.zencdn.net/v/oceans.mp4",
      maxPoints: 100
    },
    {
      id: "p2",
      title: "Análisis de Apalancamiento y Cobertura de Deuda",
      description: "Audita las razones financieras de apalancamiento, determina los múltiplos de cobertura de intereses e implementa un modelo de reestructuración corporativa bajo escenarios de estrés de tasas de interés.",
      difficulty: 3,
      datasetUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      maxPoints: 80
    }
  ];

  // Utility to determine active link styling
  const isActive = (path: string) => {
    if (path === '/student' && location.pathname === '/student') return true;
    return location.pathname === `/student${path}`;
  };

  const sidebarItemClass = (path: string) => `
    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-mono tracking-wide border transition cursor-pointer
    ${isActive(path) 
      ? 'bg-slate-900 border-slate-800 text-teal-400 shadow-inner' 
      : 'text-slate-400 hover:text-slate-250 border-transparent hover:bg-slate-900/30'}
  `;

  const navItems = [
    { label: 'Explorar Cursos', path: '', icon: BookOpen },
    { label: 'Clips e IA', path: '/clips', icon: Play },
    { label: 'Casos Reales', path: '/projects', icon: Layers },
    { label: 'Mi Dashboard', path: '/dashboard', icon: Clock },
    { label: 'Historial de Dudas', path: '/doubts', icon: MessageSquare },
    { label: 'Certificaciones', path: '/profile', icon: User },
    { label: 'FinNova Labs', path: '/labs', icon: Beaker },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-60px)] relative text-left">
      {/* SIDEBAR PARA ESCRITORIO (md:flex, oculto en móvil) */}
      <aside 
        className={`hidden md:flex flex-col bg-[#0b1224]/80 backdrop-blur-md border-r border-slate-850/65 transition-all duration-300 shrink-0 ${
          isSidebarExpanded ? 'w-64' : 'w-20'
        } p-4 flex flex-col justify-between shadow-md sticky top-[60px] h-[calc(100vh-60px)] self-start`}
      >
        <div className="space-y-6">
          {/* Header del Sidebar */}
          <div className={`flex items-center ${!isSidebarExpanded ? 'justify-center' : 'justify-between'} border-b border-slate-850/60 pb-3`}>
            {isSidebarExpanded && (
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                Menú Alumno
              </span>
            )}
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title={isSidebarExpanded ? "Colapsar menú" : "Expandir menú"}
            >
              {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Elementos de Navegación */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.label}
                  to={`/student${item.path}`} 
                  className={`${sidebarItemClass(item.path)} ${!isSidebarExpanded ? 'justify-center' : ''}`}
                  title={!isSidebarExpanded ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {isSidebarExpanded && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar */}
        {isSidebarExpanded && (
          <div className="border-t border-slate-850/60 pt-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-mono text-xs font-bold shrink-0 uppercase">
              {profile.fullName ? profile.fullName.slice(0, 2) : 'AL'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-300 truncate">{profile.fullName || 'Alumno FinNova'}</p>
              <p className="text-[9px] text-slate-500 font-mono uppercase truncate">{profile.pointsEarned} XP</p>
            </div>
          </div>
        )}
      </aside>

      {/* MOBILE HEADER (md:hidden, visible en móvil) */}
      <div className="md:hidden flex items-center justify-between bg-slate-900/40 border border-slate-850/60 p-3.5 rounded-2xl mx-4 mt-4 mb-2">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-455 hover:text-slate-200 transition cursor-pointer"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-slate-250 font-mono tracking-wider uppercase">
          FinNova Academy
        </span>
        <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-450 font-mono text-[10px] font-bold">
          {profile.pointsEarned} <span className="text-[7px] ml-0.5 font-normal font-sans">XP</span>
        </div>
      </div>

      {/* SIDEBAR PARA MÓVIL (Overlay drawer) */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Menu Drawer */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-850 p-5 flex flex-col justify-between z-50 animate-slide-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                  Navegación
                </span>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.label}
                      to={`/student${item.path}`} 
                      className={sidebarItemClass(item.path)}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-850 pt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-450 font-mono text-xs font-bold">
                {profile.fullName ? profile.fullName.slice(0, 2) : 'AL'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-255">{profile.fullName || 'Alumno'}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase">{profile.pointsEarned} XP Acumulados</p>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* CUERPO PRINCIPAL (Main Body) */}
      <div className="flex-1 min-w-0 transition-all duration-300 p-4 md:p-6 md:px-8 max-w-7xl mx-auto w-full">
        <Routes>
        {/* SUBTAB: COURSES CATALOG */}
        <Route path="/" element={
          <div className="flex flex-col gap-5 text-left animate-fade-in">
            {/* Banner */}
            <div className="bg-slate-900/40 border border-slate-850/60 p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col lg:flex-row gap-6 items-center justify-between shadow-md">
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full filter blur-3xl" />
              <div className="max-w-2xl z-10 space-y-3">
                <span className="inline-flex bg-teal-500/10 text-teal-400 text-[10px] font-semibold tracking-widest uppercase border border-teal-500/20 px-3 py-0.5 rounded-full font-mono">
                  Portal del Alumno
                </span>
                <h1 className="text-xl md:text-3xl font-bold text-slate-100 tracking-tight leading-tight">
                  Adquiere Habilidades Financieras Validadas con IA.
                </h1>
                <p className="text-xs md:text-sm text-slate-450 leading-relaxed max-w-xl font-normal">
                  Cursos en formato corto combinados con laboratorios prácticos de modelación financiera. Completa clips conceptuales de 60 segundos y demuestra tus competencias.
                </p>
              </div>

              <div className="bg-slate-950/40 border border-slate-850/80 backdrop-blur-sm rounded-xl p-5 flex flex-col gap-3 min-w-[240px] z-10 shadow-sm">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-semibold">
                  Estatus de Certificación
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-200 font-mono">
                    {profile.pointsEarned}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">XP Totales</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                  <div className="bg-teal-400 h-full w-[65%]" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-teal-450 font-medium mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Identidad Verificada (KYC)
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Catálogo de Certificación Práctica
              </h2>
              <p className="text-slate-500 text-xs font-normal">
                Selecciona una materia corporativa para iniciar el aprendizaje conceptual.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              {courses.map(course => (
                <div 
                  key={course.id}
                  className="bg-slate-900/20 hover:bg-slate-900/50 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-800 cursor-pointer group shadow-sm"
                  onClick={() => handleSelectCourse(course)}
                >
                  <div className="flex gap-4 items-start">
                    <img 
                      src={course.imageUrl} 
                      alt={course.title} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-850 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-semibold font-mono px-2 py-0.5 rounded-full border uppercase ${
                          course.difficulty === 'beginner' 
                            ? 'bg-teal-500/10 border-teal-500/25 text-teal-400' 
                            : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                        }`}>
                          {course.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          2 Conceptos Clave
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-200 tracking-snug mt-2 group-hover:text-teal-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2 font-normal">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-850 mt-4 pt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[10px]">
                      Impartido por: Profe de Finanzas Senior
                    </span>
                    <span className="text-teal-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5 font-medium">
                      Comenzar Módulo <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        } />

        {/* SUBTAB: CLIPS REELS & AI grading */}
        <Route path="/clips" element={
          <div className="animate-fade-in">
            {selectedCourse ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-slate-900/30 p-3 rounded-2xl border border-slate-850">
                  <div className="flex items-center gap-3 text-left">
                    <Link 
                      to="/student"
                      className="text-slate-400 hover:text-slate-200 text-xs px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl transition cursor-pointer font-bold shadow-md hover:border-slate-700"
                    >
                      ← Volver a Cursos
                    </Link>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Materia de Aprendizaje</p>
                      <h2 className="text-xs font-bold text-slate-200 truncate max-w-xs sm:max-w-md">{selectedCourse.title}</h2>
                    </div>
                  </div>
                  <button 
                    onClick={handleRefreshProgress}
                    className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer hover:border-slate-700"
                    title="Actualizar Progreso"
                  >
                    <RefreshCw className="w-4.5 h-4.5" />
                  </button>
                </div>

                <VideoFeed 
                  clips={selectedCourse.clips || []} 
                  courseId={selectedCourse.id}
                  courseTitle={selectedCourse.title || ''}
                  onProgressUpdated={handleRefreshProgress}
                  completedClipIds={
                    selectedCourseProgress?.progressMatrix?.filter((p: any) => p.isCompleted).map((p: any) => p.clipId) || []
                  }
                />
              </div>
            ) : (
              <div className="text-center p-16 bg-slate-900/50 border border-slate-850 rounded-3xl text-slate-400 max-w-md mx-auto h-[450px] flex flex-col items-center justify-center">
                <Layers className="w-12 h-12 text-slate-700 mb-3" />
                <p className="font-semibold text-slate-300">Selecciona un Curso Primero</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs font-normal">Ingresa al catálogo para iniciar el reproductor de clips verticales e interactuar con la IA.</p>
                <Link
                  to="/student"
                  className="mt-5 text-xs bg-teal-500/10 border border-teal-500/30 text-teal-405 hover:bg-teal-500/20 px-4 py-2 rounded-xl font-medium transition"
                >
                  Navegar Catálogo
                </Link>
              </div>
            )}
          </div>
        } />

        {/* SUBTAB: REAL CASE LAB */}
        <Route path="/projects" element={
          <div className="space-y-6 text-left animate-fade-in">
            <div className="space-y-1.5">
              <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider font-mono flex items-center">
                Laboratorio de Casos Reales (Proyectos Corporativos)
              </h2>
              <p className="text-slate-500 text-xs font-normal">
                Descarga datasets del mundo real, construye tus hojas de cálculo de valuación y súbelas para validación estructurada por la IA de Gemini.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-3">
              {mockProjects.map(proj => {
                const isSubmitted = submittedProjectId === proj.id;
                return (
                  <div key={proj.id} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-3.5 h-3.5 ${
                                idx < proj.difficulty ? 'text-teal-400 fill-teal-400' : 'text-slate-800'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono bg-slate-950/40 px-2 py-0.5 rounded border border-slate-850/80">
                          Máx: {proj.maxPoints} pts
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-200">{proj.title}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed font-normal">{proj.description}</p>
                    </div>

                    <div className="border-t border-slate-850 mt-4 pt-3 space-y-3 text-xs">
                      <a 
                        href={proj.datasetUrl}
                        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar Plantilla del Dataset (.xlsx)
                      </a>

                      {isSubmitted ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/15 text-emerald-400/90 p-3.5 rounded-xl flex items-start gap-2.5 font-normal">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-405" />
                          <div>
                            <p className="font-semibold text-xs">¡Entrega del caso recibida!</p>
                            <p className="text-[10px] text-emerald-400/75 mt-0.5">La IA auditará tus fórmulas financieras y emitirá tu firma de certificado.</p>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleProjectSubmit(proj.id, e)} className="flex gap-2">
                          <input
                            type="url"
                            required
                            placeholder="Enlace a tu entrega en Google Sheets o Drive..."
                            className="bg-slate-950/50 border border-slate-850 focus:border-teal-500/50 focus:ring-0 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none flex-1 font-mono font-normal"
                            value={projectFileUrl}
                            onChange={(e) => setProjectFileUrl(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={!projectFileUrl}
                            className={`px-3 py-2 rounded-xl font-medium text-xs transition flex items-center gap-1 cursor-pointer ${
                              projectFileUrl 
                                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 shadow-sm' 
                                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-850/50'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" /> Enviar
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        } />

        {/* SUBTAB: METRICS DASHBOARD */}
        <Route path="/dashboard" element={
          <div className="space-y-6 text-left animate-fade-in">
            <div className="space-y-1.5">
              <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider font-mono">
                Tablero de Rendimiento Académico
              </h2>
              <p className="text-slate-500 text-xs font-normal">
                Monitorea tus horas efectivas, acumulación de XP y rankings de aprendizaje en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-3">
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Tiempo de Estudio</span>
                  <h3 className="text-2xl font-semibold text-slate-200 mt-1 font-mono">03:45 Hrs</h3>
                </div>
                <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-400 border border-teal-500/10">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Experiencia total</span>
                  <h3 className="text-2xl font-semibold text-indigo-300 mt-1 font-mono">{profile.pointsEarned} XP</h3>
                </div>
                <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/10">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Posición Relativa</span>
                  <h3 className="text-2xl font-semibold text-teal-400 mt-1 font-mono">Top 25%</h3>
                </div>
                <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-400 border border-teal-500/10">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Progreso por Módulos Temáticos
              </h3>
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-slate-350">
                    <span>Mentalidad y Fundamentos de Inversión</span>
                    <span className="text-teal-400 font-mono text-[11px] font-medium">100% (Completado)</span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-850/55 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-indigo-400 h-full rounded-full w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-slate-350">
                    <span>Análisis de Empresas y Ratios Financieros</span>
                    <span className="text-indigo-300 font-mono text-[11px] font-medium">50% (En curso)</span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-850/55 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-indigo-400 h-full rounded-full w-[50%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-4">
                Insignias y Credenciales Obtenidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-850/60 p-4 rounded-xl flex items-start gap-4 hover:border-slate-800/80 transition duration-200">
                  <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-405 shrink-0 border border-teal-500/15">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs">Maestro del P/E Ratio</h4>
                    <p className="text-slate-500 text-[9px] font-mono font-medium mt-0.5">Desbloqueado: 06 Jun 2026</p>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-normal font-normal">
                      Aprobó el ejercicio interactivo del Precio/Beneficio con calificación perfecta de WACC.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-850/60 p-4 rounded-xl flex items-start gap-4 hover:border-slate-800/80 transition duration-200">
                  <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400 shrink-0 border border-indigo-500/15">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs">Interés Compuesto Exponencial</h4>
                    <p className="text-slate-500 text-[9px] font-mono font-medium mt-0.5">Desbloqueado: 08 Jun 2026</p>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-normal font-normal">
                      Visualizó el video del interés compuesto en su totalidad y calculó los pasos de capital final.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />

        {/* SUBTAB: CERTIFICATIONS PROFILE */}
        <Route path="/profile" element={
          <div className="space-y-6 text-left animate-fade-in">
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center justify-between border-b border-slate-850/60 pb-5">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <img 
                    src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'} 
                    alt={profile.fullName} 
                    className="w-16 h-16 rounded-full border border-slate-800 object-cover shrink-0"
                  />
                  <div className="text-center sm:text-left space-y-1">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <h2 className="text-md font-semibold text-slate-200 leading-snug">{profile.fullName}</h2>
                      {profile.verifiedIdentity && (
                        <span title="KYC Identidad Verificada">
                          <ShieldCheck className="w-4.5 h-4.5 text-teal-400" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{profile.institution}</p>
                    
                    <div className="mt-2 inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-0.5 rounded-full text-[9px] font-medium font-mono">
                      <Award className="w-3 h-3 text-indigo-400" /> {profile.certLevel}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                  <button
                    onClick={handleDownloadCV}
                    disabled={exportingCV}
                    className="bg-slate-950/40 hover:bg-slate-900 border border-slate-850/80 text-teal-455 px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {exportingCV ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generando...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Exportar CV con Habilidades
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Competencias Financieras Validadas</h3>
                  <p className="text-slate-500 text-[10px] mt-0.5">Porcentaje de asimilación auditado mediante rúbricas evaluadas por modelos Gemini LLM.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-355">Valuación de Activos DCF</span>
                      <span className="text-teal-405 font-mono font-medium">85%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-indigo-400 h-full w-[85%]" />
                    </div>
                  </div>

                  <div className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-355">Cálculo de WACC y Costo de Deuda</span>
                      <span className="text-teal-405 font-mono font-medium">75%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-indigo-400 h-full w-[75%]" />
                    </div>
                  </div>

                  <div className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-355">Análisis Comparativo de Razones P/E</span>
                      <span className="text-teal-405 font-mono font-medium">95%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-indigo-400 h-full w-[95%]" />
                    </div>
                  </div>

                  <div className="bg-slate-950/20 border border-slate-850/60 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-355">Estructura y Cobertura de Apalancamientos</span>
                      <span className="text-teal-405 font-mono font-medium">60%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-indigo-400 h-full w-[60%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />

        {/* SUBTAB: EXPERIMENTAL LABS */}
        <Route path="/labs" element={
          <div className="space-y-6 text-left animate-fade-in">
            <div className="space-y-1.5">
              <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider font-mono flex items-center">
                FinNova Labs (Sección Experimental)
              </h2>
              <p className="text-slate-500 text-xs font-normal">
                Explora herramientas avanzadas de modelación cuantitativa y simuladores financieros interactivos.
              </p>
            </div>

            {/* Inner Labs Navigation */}
            <div className="flex border-b border-slate-800 gap-4 pb-2">
              <button
                onClick={() => setLabTab('garch')}
                className={`pb-2 text-xs font-semibold font-mono tracking-wide border-b-2 transition uppercase cursor-pointer ${
                  labTab === 'garch'
                    ? 'border-teal-400 text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Simulador GJR-GARCH
              </button>
              <button
                onClick={() => setLabTab('cme')}
                className={`pb-2 text-xs font-semibold font-mono tracking-wide border-b-2 transition uppercase cursor-pointer ${
                  labTab === 'cme'
                    ? 'border-teal-400 text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Calculadora de Futuros CME
              </button>
            </div>

            {/* Tab Contents */}
            {labTab === 'garch' && (
              <div className="space-y-4">
                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Simulador Cuantitativo GJR-GARCH:</strong> Este modelo de volatilidad asimétrica calibra parámetros por MLE (Maximum Likelihood Estimation) sobre precios históricos reales del mercado obtenidos de forma segura en el backend mediante <strong>Gemini Search Grounding</strong>.
                  </p>
                </div>
                <div className="w-full rounded-2xl overflow-hidden border border-slate-850 bg-slate-950 shadow-md">
                  <iframe
                    src="/motor_predictivo_v3.html"
                    className="w-full h-[950px] border-none bg-slate-950"
                    title="Simulador GJR-GARCH"
                  />
                </div>
              </div>
            )}

            {labTab === 'cme' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Calculadora de Márgenes y P&L de CME:</strong> Digitalización interactiva del modelo financiero CME. Configura contratos de futuros estándar o micro, simula apalancamiento implícito, márgenes de garantía y determina el precio crítico de Margin Call.
                  </p>
                </div>
                <CmeCalculator />
              </div>
            )}
          </div>
        } />
        <Route path="/doubts" element={<StudentDoubtsView courses={courses} />} />
      </Routes>
      </div>
    </div>
  );
}

function StudentDoubtsView({ courses }: { courses: any[] }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewDudaForm, setShowNewDudaForm] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'chat'>('list');

  // New question form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedClipId, setSelectedClipId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await api.getQuestions();
      setQuestions(data);
      if (data.length > 0 && !selectedQuestionId) {
        setSelectedQuestionId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching student questions:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchQuestions();
  }, []);

  const selectedCourseObj = courses.find(c => c.id === selectedCourseId);
  const courseClips = selectedCourseObj?.clips || [];

  // When course changes, pre-select first clip
  React.useEffect(() => {
    if (courseClips.length > 0) {
      setSelectedClipId(courseClips[0].id);
    } else {
      setSelectedClipId('');
    }
  }, [selectedCourseId, courseClips]);

  const handleCreateDuda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedClipId || !questionText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const course = courses.find(c => c.id === selectedCourseId);
      const clip = course?.clips?.find((cl: any) => cl.id === selectedClipId);
      
      const newQ = await api.askQuestion({
        courseId: selectedCourseId,
        courseTitle: course?.title || 'Curso',
        clipId: selectedClipId,
        clipTitle: clip?.title || 'Lección',
        questionText: questionText.trim()
      });

      setQuestions(prev => [newQ, ...prev]);
      setSelectedQuestionId(newQ.id);
      setQuestionText('');
      setShowNewDudaForm(false);
      setMobileActiveView('chat');
    } catch (err) {
      console.error('Failed submitting question:', err);
      alert('Error al enviar la pregunta. Por favor, intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="flex flex-col gap-5 text-left animate-fade-in h-[calc(100vh-160px)] min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4 shrink-0">
        <div>
          <h2 className="text-sm font-extrabold text-slate-350 uppercase tracking-wider font-mono">
            Historial de Dudas (Atención Directa)
          </h2>
          <p className="text-slate-500 text-xs font-normal">
            Consulta las respuestas de tus instructores en formato chat o abre una nueva consulta sobre cualquier materia.
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewDudaForm(true);
            if (courses.length > 0) {
              setSelectedCourseId(courses[0].id);
            }
          }}
          className="px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 self-start shadow-sm"
        >
          <HelpCircle className="w-4 h-4 shrink-0" /> Nueva duda
        </button>
      </div>

      <div className="flex-1 flex bg-[#0c1325]/40 border border-slate-850/60 rounded-2xl overflow-hidden backdrop-blur-sm min-h-0 shadow-lg relative">
        {/* WhatsApp Left Sidebar: Questions list */}
        <div className={`w-full md:w-80 border-r border-slate-850/60 flex flex-col shrink-0 ${
          mobileActiveView === 'chat' && !showNewDudaForm ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="bg-slate-900/30 p-3.5 border-b border-slate-850/60 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
              Conversaciones ({questions.length})
            </span>
            <button
              onClick={fetchQuestions}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Actualizar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-850/40 scrollbar-thin">
            {loading && questions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                Cargando historial...
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-normal">
                No tienes dudas registradas. ¡Haz clic en "Nueva duda" para comenzar!
              </div>
            ) : (
              questions.map(q => {
                const isSelected = q.id === selectedQuestionId && !showNewDudaForm;
                const isResolved = !!q.replyText;
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionId(q.id);
                      setShowNewDudaForm(false);
                      setMobileActiveView('chat');
                    }}
                    className={`p-3.5 text-left cursor-pointer transition-all duration-150 ${
                      isSelected 
                        ? 'bg-slate-900/60 text-teal-405 border-l-2 border-teal-500' 
                        : 'hover:bg-slate-900/20 text-slate-350 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase ${
                        isResolved 
                          ? 'bg-teal-500/10 border-teal-500/25 text-teal-450' 
                          : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                      }`}>
                        {isResolved ? 'Resuelto' : 'Pendiente'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(q.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-200 truncate" title={q.courseTitle}>
                      {q.courseTitle}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                      {q.clipTitle}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 leading-normal font-sans">
                      {q.questionText}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* WhatsApp Right Chat Pane */}
        <div className={`flex flex-col flex-1 bg-slate-950/20 relative min-w-0 ${
          mobileActiveView === 'list' && !showNewDudaForm ? 'hidden md:flex' : 'flex'
        }`}>
          {showNewDudaForm ? (
            /* New Duda Form */
            <form onSubmit={handleCreateDuda} className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
              <div className="max-w-xl mx-auto w-full space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-teal-500/10 p-2 rounded-xl text-teal-400 border border-teal-500/10">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-250">Resolver una Nueva Duda</h3>
                      <p className="text-[10px] text-slate-500">Selecciona el curso y la lección para enviar tu pregunta.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewDudaForm(false);
                      setMobileActiveView('list');
                    }}
                    className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:text-slate-200 md:hidden"
                  >
                    ← Volver
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">Materia / Curso</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="" disabled>Selecciona un curso...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">Lección / Clip</label>
                  {courseClips.length === 0 ? (
                    <div className="text-xs text-slate-505 p-2 bg-slate-900/30 border border-slate-850 rounded-xl">
                      No hay lecciones en este curso.
                    </div>
                  ) : (
                    <select
                      value={selectedClipId}
                      onChange={(e) => setSelectedClipId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer"
                    >
                      {courseClips.map((cl: any) => (
                        <option key={cl.id} value={cl.id}>{cl.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">Tu Pregunta o Inquietud</label>
                  <textarea
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Escribe tu duda de forma detallada..."
                    rows={5}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-teal-500/50 leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || courseClips.length === 0 || !questionText.trim()}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      submitting || courseClips.length === 0 || !questionText.trim()
                        ? 'bg-slate-900 text-slate-650 cursor-not-allowed border border-slate-850/55'
                        : 'bg-teal-500/10 border border-teal-500/35 text-teal-400 hover:bg-teal-500/25 shadow-sm'
                    }`}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Duda al Instructor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewDudaForm(false);
                      setMobileActiveView('list');
                    }}
                    className="px-4 py-2.5 border border-slate-800 hover:bg-slate-900/55 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : selectedQuestion ? (
            /* WhatsApp Chat Screen */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="bg-[#0b1224]/50 backdrop-blur-md p-4 border-b border-slate-850/60 flex items-center justify-between shrink-0">
                <div className="min-w-0 flex items-center gap-2">
                  <button
                    onClick={() => setMobileActiveView('list')}
                    className="p-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:text-slate-200 md:hidden mr-1"
                    title="Atrás"
                  >
                    ←
                  </button>
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] text-teal-450 font-mono font-bold uppercase tracking-wider block truncate max-w-[150px] sm:max-w-[300px]">
                      {selectedQuestion.courseTitle}
                    </span>
                    <h3 className="text-xs font-bold text-slate-200 truncate mt-0.5 max-w-[150px] sm:max-w-[300px]">
                      Lección: {selectedQuestion.clipTitle}
                    </h3>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase ${
                    selectedQuestion.replyText 
                      ? 'bg-teal-500/10 border-teal-500/25 text-teal-400' 
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                  }`}>
                    {selectedQuestion.replyText ? 'Resuelto' : 'Esperando respuesta'}
                  </span>
                </div>
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* Question bubble (Student - Sender on the right) */}
                <div className="flex justify-end items-end gap-2 max-w-[85%] ml-auto">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-slate-500 font-mono mb-1">Tú (Estudiante)</span>
                    <div className="bg-teal-600/10 border border-teal-500/20 text-teal-100 p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-lg shadow-sm text-left whitespace-pre-wrap">
                      {selectedQuestion.questionText}
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono mt-1">
                      {new Date(selectedQuestion.createdAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-450 font-mono text-[10px] font-bold shrink-0">
                    YO
                  </div>
                </div>

                {/* Reply bubble (Instructor - Receiver on the left) */}
                {selectedQuestion.replyText ? (
                  <div className="flex justify-start items-end gap-2 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-[10px] font-bold shrink-0">
                      PR
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[8px] text-slate-500 font-mono mb-1">Profe Senior (Instructor)</span>
                      <div className="bg-slate-900 border border-slate-850/80 text-slate-200 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-lg shadow-sm text-left whitespace-pre-wrap">
                        {selectedQuestion.replyText}
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono mt-1">
                        {selectedQuestion.repliedAt && new Date(selectedQuestion.repliedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 flex items-center gap-2 max-w-md mx-auto justify-center mt-6">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Duda enviada al instructor. Recibirás una respuesta en este espacio pronto.</span>
                  </div>
                )}
              </div>

              {/* Chat Input Placeholder */}
              <div className="p-3 bg-slate-900/30 border-t border-slate-850/60 flex items-center justify-center shrink-0">
                <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">
                  {selectedQuestion.replyText ? 'Hilo de discusión cerrado' : 'Esperando respuesta de tu instructor'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
              <MessageSquare className="w-12 h-12 text-slate-700 mb-2" />
              <span>Selecciona una duda o haz clic en "Nueva duda" para iniciar el chat.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

