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
import { themeColors, Theme } from './MarketLanding';

interface StudentPanelProps {
  theme: Theme;
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
  theme,
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

  const colors = themeColors[theme];
  const isLight = theme === 'light';

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
  `;

  const getSidebarItemStyle = (path: string) => {
    const active = isActive(path);
    return {
      backgroundColor: active ? (isLight ? '#C9C1B1' : '#0f172a') : 'transparent',
      borderColor: active ? colors.border : 'transparent',
      borderWidth: active ? '2px' : '2px',
      color: active ? (isLight ? '#1B2632' : '#FFB162') : colors.textMuted,
    };
  };

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
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-60px)] relative text-left" style={{ color: colors.text }}>
      {/* SIDEBAR PARA ESCRITORIO (md:flex, oculto en móvil) */}
      <aside 
        className={`hidden md:flex flex-col transition-all duration-300 shrink-0 ${
          isSidebarExpanded ? 'w-64' : 'w-20'
        } p-4 flex flex-col justify-between shadow-md sticky top-[60px] h-[calc(100vh-60px)] self-start`}
        style={{
          background: colors.cardBg,
          borderRight: `2px solid ${colors.border}`,
        }}
      >
        <div className="space-y-6">
          {/* Header del Sidebar */}
          <div 
            className={`flex items-center ${!isSidebarExpanded ? 'justify-center' : 'justify-between'} border-b pb-3`}
            style={{ borderBottomColor: colors.border }}
          >
            {isSidebarExpanded && (
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono" style={{ color: colors.textMuted }}>
                Menú Alumno
              </span>
            )}
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1.5 rounded-lg transition cursor-pointer border"
              style={{
                borderColor: colors.border,
                background: colors.bg,
                color: colors.text,
              }}
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
                  style={getSidebarItemStyle(item.path)}
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
          <div className="border-t pt-3 flex items-center gap-3" style={{ borderTopColor: colors.border }}>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 uppercase"
              style={{
                background: colors.primary,
                border: `2px solid ${colors.border}`,
                color: '#1B2632',
              }}
            >
              {profile.fullName ? profile.fullName.slice(0, 2) : 'AL'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{profile.fullName || 'Alumno FinNova'}</p>
              <p className="text-[9px] font-mono uppercase truncate" style={{ color: colors.textMuted }}>{profile.pointsEarned} XP</p>
            </div>
          </div>
        )}
      </aside>

      {/* MOBILE HEADER (md:hidden, visible en móvil) */}
      <div 
        className="md:hidden flex items-center justify-between border p-3.5 rounded-2xl mx-4 mt-4 mb-2"
        style={{
          background: colors.cardBg,
          borderColor: colors.border,
          borderWidth: '2px',
          boxShadow: `3px 3px 0px 0px ${colors.border}`,
          color: colors.text
        }}
      >
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 border rounded-xl transition cursor-pointer"
          style={{
            borderColor: colors.border,
            background: colors.bg,
            color: colors.text,
          }}
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold font-mono tracking-wider uppercase" style={{ color: colors.text }}>
          FinNova Academy
        </span>
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold"
          style={{
            background: colors.primary,
            border: `2px solid ${colors.border}`,
            color: '#1B2632',
          }}
        >
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
          <aside 
            className="fixed inset-y-0 left-0 w-64 border-r p-5 flex flex-col justify-between z-50 animate-slide-in"
            style={{
              background: colors.cardBg,
              borderRight: `2px solid ${colors.border}`,
              color: colors.text,
            }}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: colors.border }}>
                <span className="text-xs font-extrabold uppercase tracking-widest font-mono" style={{ color: colors.textMuted }}>
                  Navegación
                </span>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 border rounded-lg transition cursor-pointer"
                  style={{
                    borderColor: colors.border,
                    background: colors.bg,
                    color: colors.text,
                  }}
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
                      style={getSidebarItemStyle(item.path)}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t pt-4 flex items-center gap-3" style={{ borderTopColor: colors.border }}>
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold"
                style={{
                  background: colors.primary,
                  border: `2px solid ${colors.border}`,
                  color: '#1B2632',
                }}
              >
                {profile.fullName ? profile.fullName.slice(0, 2) : 'AL'}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: colors.text }}>{profile.fullName || 'Alumno'}</p>
                <p className="text-[10px] font-mono uppercase" style={{ color: colors.textMuted }}>{profile.pointsEarned} XP Acumulados</p>
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
            <div 
              className="border p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col lg:flex-row gap-6 items-center justify-between"
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                borderWidth: '2px',
                boxShadow: `4px 4px 0px 0px ${colors.border}`
              }}
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full filter blur-3xl" />
              <div className="max-w-2xl z-10 space-y-3">
                <span 
                  className="inline-flex text-[10px] font-semibold tracking-widest uppercase border px-3 py-0.5 rounded-full font-mono"
                  style={{
                    backgroundColor: isLight ? 'rgba(163, 81, 57, 0.12)' : 'rgba(255, 177, 98, 0.1)',
                    borderColor: colors.border,
                    color: colors.secondary
                  }}
                >
                  Portal del Alumno
                </span>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-tight" style={{ color: colors.text }}>
                  Adquiere Habilidades Financieras Validadas con IA.
                </h1>
                <p className="text-xs md:text-sm leading-relaxed max-w-xl font-normal" style={{ color: colors.textMuted }}>
                  Cursos en formato corto combinados con laboratorios prácticos de modelación financiera. Completa clips conceptuales de 60 segundos y demuestra tus competencias.
                </p>
              </div>

              <div 
                className="border rounded-xl p-5 flex flex-col gap-3 min-w-[240px] z-10"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  borderWidth: '2px',
                }}
              >
                <div className="text-[9px] uppercase tracking-widest font-mono font-semibold" style={{ color: colors.textMuted }}>
                  Estatus de Certificación
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono" style={{ color: colors.text }}>
                    {profile.pointsEarned}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>XP Totales</span>
                </div>
                <div 
                  className="w-full rounded-full h-1.5 overflow-hidden border"
                  style={{
                    backgroundColor: isLight ? '#C9C1B1' : 'rgba(15, 23, 42, 0.4)',
                    borderColor: colors.border
                  }}
                >
                  <div className="h-full w-[65%]" style={{ backgroundColor: colors.secondary }} />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium mt-1" style={{ color: colors.text }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: colors.secondary }} /> Identidad Verificada (KYC)
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider font-mono" style={{ color: colors.text }}>
                Catálogo de Certificación Práctica
              </h2>
              <p className="text-xs font-normal" style={{ color: colors.textMuted }}>
                Selecciona una materia corporativa para iniciar el aprendizaje conceptual.
              </p>
            </div>

            {(() => {
              const categories = courses.reduce((acc: { [key: string]: any[] }, course) => {
                const cat = course.category || 'Otros Módulos';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(course);
                return acc;
              }, {});

              return (
                <div className="space-y-8 mt-4">
                  {Object.keys(categories).map(categoryName => (
                    <div key={categoryName} className="space-y-3">
                      <div className="flex items-center gap-2 border-b pb-1.5" style={{ borderBottomColor: colors.border }}>
                        <span 
                          className="text-[9px] border px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: isLight ? 'rgba(163, 81, 57, 0.12)' : 'rgba(255, 177, 98, 0.1)',
                            borderColor: colors.border,
                            color: colors.secondary
                          }}
                        >
                          {categoryName}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {categories[categoryName].map(course => (
                          <div 
                            key={course.id}
                            className="border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer group text-left"
                            style={{
                              background: colors.cardBg,
                              borderColor: colors.border,
                              borderWidth: '2px',
                              boxShadow: `4px 4px 0px 0px ${colors.border}`
                            }}
                            onClick={() => handleSelectCourse(course)}
                          >
                            <div className="flex gap-4 items-start">
                              <img 
                                src={course.imageUrl} 
                                alt={course.title} 
                                className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm border"
                                style={{ borderColor: colors.border }}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="text-[8px] font-semibold font-mono px-2 py-0.5 rounded-full border uppercase"
                                    style={{
                                      backgroundColor: course.difficulty === 'beginner' 
                                        ? (isLight ? 'rgba(163, 81, 57, 0.12)' : 'rgba(255, 177, 98, 0.1)') 
                                        : (isLight ? 'rgba(27, 38, 50, 0.1)' : 'rgba(91, 141, 239, 0.1)'),
                                      borderColor: colors.border,
                                      color: course.difficulty === 'beginner' ? colors.secondary : (isLight ? '#1B2632' : '#5B8DEF')
                                    }}
                                  >
                                    {course.difficulty}
                                  </span>
                                  {course.learningPath && (
                                    <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
                                      Ruta: {course.learningPath}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-sm font-semibold tracking-snug mt-2 group-hover:text-amber-500 transition-colors" style={{ color: colors.text }}>
                                  {course.title}
                                </h3>
                                <p className="text-xs mt-1 leading-relaxed line-clamp-2 font-normal" style={{ color: colors.textMuted }}>
                                  {course.description}
                                </p>
                              </div>
                            </div>

                            <div className="border-t mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTopColor: colors.border }}>
                              <span className="font-mono text-[10px]" style={{ color: colors.textMuted }}>
                                Impartido por: Profe de Finanzas Senior
                              </span>
                              <span className="transition flex items-center gap-0.5 font-medium group-hover:translate-x-0.5" style={{ color: colors.secondary }}>
                                Comenzar Módulo <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        } />

        {/* SUBTAB: CLIPS REELS & AI grading */}
        <Route path="/clips" element={
          <div className="animate-fade-in">
            {selectedCourse ? (
              <div className="flex flex-col gap-4">
                <div 
                  className="flex items-center justify-between p-3 rounded-2xl border"
                  style={{
                    background: colors.cardBg,
                    borderColor: colors.border,
                    borderWidth: '2px',
                    boxShadow: `3px 3px 0px 0px ${colors.border}`
                  }}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Link 
                      to="/student"
                      className="text-xs px-3.5 py-1.5 border rounded-xl transition cursor-pointer font-bold shadow-md"
                      style={{
                        borderColor: colors.border,
                        background: colors.bg,
                        color: colors.text,
                      }}
                    >
                      ← Volver a Cursos
                    </Link>
                    <div>
                      <p className="text-[9px] uppercase font-mono tracking-wider font-bold" style={{ color: colors.textMuted }}>Materia de Aprendizaje</p>
                      <h2 className="text-xs font-bold truncate max-w-xs sm:max-w-md" style={{ color: colors.text }}>{selectedCourse.title}</h2>
                    </div>
                  </div>
                  <button 
                    onClick={handleRefreshProgress}
                    className="p-1.5 border rounded-xl transition cursor-pointer"
                    style={{
                      borderColor: colors.border,
                      background: colors.bg,
                      color: colors.text,
                    }}
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
              <div 
                className="text-center p-16 border rounded-3xl max-w-md mx-auto h-[450px] flex flex-col items-center justify-center"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.border,
                  borderWidth: '2px',
                  boxShadow: `4px 4px 0px 0px ${colors.border}`,
                  color: colors.text
                }}
              >
                <Layers className="w-12 h-12 mb-3" style={{ color: colors.textMuted }} />
                <p className="font-semibold" style={{ color: colors.text }}>Selecciona un Curso Primero</p>
                <p className="text-xs mt-1 max-w-xs font-normal" style={{ color: colors.textMuted }}>Ingresa al catálogo para iniciar el reproductor de clips verticales e interactuar con la IA.</p>
                <Link
                  to="/student"
                  className="mt-5 text-xs border px-4 py-2 rounded-xl font-medium transition"
                  style={{
                    background: colors.primary,
                    borderColor: colors.border,
                    color: '#1B2632',
                    boxShadow: `3px 3px 0px 0px ${colors.border}`
                  }}
                >
                  Navegar Catálogo
                </Link>
              </div>
            )}
          </div>
        } />

        <Route path="/projects" element={
          <div className="space-y-6 text-left animate-fade-in">
            <div className="space-y-1.5">
              <h2 className="text-sm font-extrabold uppercase tracking-wider font-mono flex items-center" style={{ color: colors.text }}>
                Laboratorio de Casos Reales (Proyectos Corporativos)
              </h2>
              <p className="text-xs font-normal" style={{ color: colors.textMuted }}>
                Descarga datasets del mundo real, construye tus hojas de cálculo de valuación y súbelas para validación estructurada por la IA de Gemini.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-3">
              {mockProjects.map(proj => {
                const isSubmitted = submittedProjectId === proj.id;
                return (
                  <div 
                    key={proj.id} 
                    className="border rounded-2xl p-5 flex flex-col justify-between"
                    style={{
                      background: colors.cardBg,
                      borderColor: colors.border,
                      borderWidth: '2px',
                      boxShadow: `4px 4px 0px 0px ${colors.border}`
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className="w-3.5 h-3.5"
                              style={{
                                color: idx < proj.difficulty ? colors.secondary : colors.border,
                                fill: idx < proj.difficulty ? colors.secondary : 'transparent'
                              }}
                            />
                          ))}
                        </div>
                        <span 
                          className="text-[9px] font-mono px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.textMuted
                          }}
                        >
                          Máx: {proj.maxPoints} pts
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold" style={{ color: colors.text }}>{proj.title}</h3>
                      <p className="text-xs leading-relaxed font-normal" style={{ color: colors.textMuted }}>{proj.description}</p>
                    </div>

                    <div className="border-t mt-4 pt-3 space-y-3 text-xs" style={{ borderTopColor: colors.border }}>
                      <a 
                        href={proj.datasetUrl}
                        className="inline-flex items-center gap-1 font-medium transition-colors"
                        style={{ color: colors.secondary }}
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar Plantilla del Dataset (.xlsx)
                      </a>

                      {isSubmitted ? (
                        <div 
                          className="border p-3.5 rounded-xl flex items-start gap-2.5 font-normal"
                          style={{
                            backgroundColor: isLight ? 'rgba(42, 122, 75, 0.1)' : 'rgba(42, 122, 75, 0.2)',
                            borderColor: '#2A7A4B',
                            color: isLight ? '#2A7A4B' : '#4ade80'
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: isLight ? '#2A7A4B' : '#4ade80' }} />
                          <div>
                            <p className="font-semibold text-xs">¡Entrega del caso recibida!</p>
                            <p className="text-[10px] mt-0.5" style={{ color: isLight ? 'rgba(42, 122, 75, 0.8)' : 'rgba(74, 222, 128, 0.8)' }}>La IA auditará tus fórmulas financieras y emitirá tu firma de certificado.</p>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleProjectSubmit(proj.id, e)} className="flex gap-2">
                          <input
                            type="url"
                            required
                            placeholder="Enlace a tu entrega en Google Sheets o Drive..."
                            className="border focus:ring-0 rounded-xl px-3 py-2 text-xs outline-none flex-1 font-mono font-normal"
                            style={{
                              background: colors.bg,
                              borderColor: colors.border,
                              color: colors.text
                            }}
                            value={projectFileUrl}
                            onChange={(e) => setProjectFileUrl(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={!projectFileUrl}
                            className="px-3 py-2 rounded-xl font-medium text-xs transition flex items-center gap-1 cursor-pointer border"
                            style={{
                              background: projectFileUrl ? colors.primary : colors.bg,
                              borderColor: colors.border,
                              color: '#1B2632',
                              cursor: projectFileUrl ? 'pointer' : 'not-allowed',
                              opacity: projectFileUrl ? 1 : 0.5
                            }}
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
              <h2 className="text-sm font-extrabold uppercase tracking-wider font-mono" style={{ color: colors.text }}>
                Tablero de Rendimiento Académico
              </h2>
              <p className="text-xs font-normal" style={{ color: colors.textMuted }}>
                Monitorea tus horas efectivas, acumulación de XP y rankings de aprendizaje en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-3">
              <div 
                className="border rounded-2xl p-5 flex items-center justify-between"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.border,
                  borderWidth: '2px',
                  boxShadow: `3px 3px 0px 0px ${colors.border}`
                }}
              >
                <div>
                  <span className="text-[9px] font-mono uppercase" style={{ color: colors.textMuted }}>Tiempo de Estudio</span>
                  <h3 className="text-2xl font-semibold mt-1 font-mono" style={{ color: colors.text }}>03:45 Hrs</h3>
                </div>
                <div 
                  className="p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    borderWidth: '2px',
                    color: colors.secondary
                  }}
                >
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div 
                className="border rounded-2xl p-5 flex items-center justify-between"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.border,
                  borderWidth: '2px',
                  boxShadow: `3px 3px 0px 0px ${colors.border}`
                }}
              >
                <div>
                  <span className="text-[9px] font-mono uppercase" style={{ color: colors.textMuted }}>Experiencia total</span>
                  <h3 className="text-2xl font-semibold mt-1 font-mono" style={{ color: colors.text }}>{profile.pointsEarned} XP</h3>
                </div>
                <div 
                  className="p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    borderWidth: '2px',
                    color: colors.secondary
                  }}
                >
                  <Award className="w-5 h-5" />
                </div>
              </div>

              <div 
                className="border rounded-2xl p-5 flex items-center justify-between"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.border,
                  borderWidth: '2px',
                  boxShadow: `3px 3px 0px 0px ${colors.border}`
                }}
              >
                <div>
                  <span className="text-[9px] font-mono uppercase" style={{ color: colors.textMuted }}>Posición Relativa</span>
                  <h3 className="text-2xl font-semibold mt-1 font-mono" style={{ color: colors.text }}>Top 25%</h3>
                </div>
                <div 
                  className="p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    borderWidth: '2px',
                    color: colors.secondary
                  }}
                >
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div 
              className="border rounded-2xl p-5 space-y-4"
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                borderWidth: '2px',
                boxShadow: `4px 4px 0px 0px ${colors.border}`
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: colors.textMuted }}>
                Progreso por Módulos Temáticos
              </h3>
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.text }}>Mentalidad y Fundamentos de Inversión</span>
                    <span className="font-mono text-[11px] font-medium" style={{ color: colors.secondary }}>100% (Completado)</span>
                  </div>
                  <div 
                    className="w-full rounded-full h-1.5 overflow-hidden border"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border
                    }}
                  >
                    <div className="h-full rounded-full w-full" style={{ backgroundColor: colors.secondary }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.text }}>Análisis de Empresas y Ratios Financieros</span>
                    <span className="font-mono text-[11px] font-medium" style={{ color: colors.secondary }}>50% (En curso)</span>
                  </div>
                  <div 
                    className="w-full rounded-full h-1.5 overflow-hidden border"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border
                    }}
                  >
                    <div className="h-full rounded-full w-[50%]" style={{ backgroundColor: colors.secondary }} />
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="border rounded-2xl p-5"
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                borderWidth: '2px',
                boxShadow: `4px 4px 0px 0px ${colors.border}`
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono mb-4" style={{ color: colors.textMuted }}>
                Insignias y Credenciales Obtenidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="border p-4 rounded-xl flex items-start gap-4 transition duration-200"
                  style={{
                    background: colors.bg,
                    borderColor: colors.border,
                    borderWidth: '2px'
                  }}
                >
                  <div 
                    className="p-2.5 rounded-xl shrink-0 border"
                    style={{
                      background: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.secondary
                    }}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs" style={{ color: colors.text }}>Maestro del P/E Ratio</h4>
                    <p className="text-[9px] font-mono font-medium mt-0.5" style={{ color: colors.textMuted }}>Desbloqueado: 06 Jun 2026</p>
                    <p className="text-[11px] mt-1.5 leading-normal font-normal" style={{ color: colors.textMuted }}>
                      Aprobó el ejercicio interactivo del Precio/Beneficio con calificación perfecta de WACC.
                    </p>
                  </div>
                </div>

                <div 
                  className="border p-4 rounded-xl flex items-start gap-4 transition duration-200"
                  style={{
                    background: colors.bg,
                    borderColor: colors.border,
                    borderWidth: '2px'
                  }}
                >
                  <div 
                    className="p-2.5 rounded-xl shrink-0 border"
                    style={{
                      background: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.secondary
                    }}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs" style={{ color: colors.text }}>Interés Compuesto Exponencial</h4>
                    <p className="text-[9px] font-mono font-medium mt-0.5" style={{ color: colors.textMuted }}>Desbloqueado: 08 Jun 2026</p>
<p className="text-[11px] mt-1.5 leading-normal font-normal" style={{ color: colors.textMuted }}>
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
            <div 
              className="border rounded-2xl p-5 space-y-6"
              style={{
                background: colors.cardBg,
                borderColor: colors.border,
                borderWidth: '2px',
                boxShadow: `4px 4px 0px 0px ${colors.border}`
              }}
            >
              <div className="flex flex-col sm:flex-row gap-5 items-center justify-between border-b pb-5" style={{ borderBottomColor: colors.border }}>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <img 
                    src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'} 
                    alt={profile.fullName} 
                    className="w-16 h-16 rounded-full border object-cover shrink-0"
                    style={{ borderColor: colors.border }}
                  />
                  <div className="text-center sm:text-left space-y-1">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <h2 className="text-md font-semibold leading-snug" style={{ color: colors.text }}>{profile.fullName}</h2>
                      {profile.verifiedIdentity && (
                        <span title="KYC Identidad Verificada">
                          <ShieldCheck className="w-4.5 h-4.5" style={{ color: colors.secondary }} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono" style={{ color: colors.textMuted }}>{profile.institution}</p>
                    
                    <div 
                      className="mt-2 inline-flex items-center gap-1 border px-3 py-0.5 rounded-full text-[9px] font-medium font-mono"
                      style={{
                        backgroundColor: isLight ? 'rgba(163, 81, 57, 0.12)' : 'rgba(255, 177, 98, 0.1)',
                        borderColor: colors.border,
                        color: colors.secondary
                      }}
                    >
                      <Award className="w-3 h-3" /> {profile.certLevel}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                  <button
                    onClick={handleDownloadCV}
                    disabled={exportingCV}
                    className="border px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
                    style={{
                      background: colors.primary,
                      borderColor: colors.border,
                      color: '#1B2632',
                      boxShadow: `3px 3px 0px 0px ${colors.border}`
                    }}
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
                  <h3 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: colors.text }}>Competencias Financieras Validadas</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>Porcentaje de asimilación auditado mediante rúbricas evaluadas por modelos Gemini LLM.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    className="border p-4 rounded-xl space-y-2"
                    style={{
                      background: colors.bg,
                      borderColor: colors.border,
                      borderWidth: '2px'
                    }}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: colors.text }}>Valuación de Activos DCF</span>
                      <span className="font-mono font-medium" style={{ color: colors.secondary }}>85%</span>
                    </div>
                    <div 
                      className="w-full h-1.5 rounded-full overflow-hidden border"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border
                      }}
                    >
                      <div className="h-full w-[85%]" style={{ backgroundColor: colors.secondary }} />
                    </div>
                  </div>

                  <div 
                    className="border p-4 rounded-xl space-y-2"
                    style={{
                      background: colors.bg,
                      borderColor: colors.border,
                      borderWidth: '2px'
                    }}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: colors.text }}>Cálculo de WACC y Costo de Deuda</span>
                      <span className="font-mono font-medium" style={{ color: colors.secondary }}>75%</span>
                    </div>
                    <div 
                      className="w-full h-1.5 rounded-full overflow-hidden border"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border
                      }}
                    >
                      <div className="h-full w-[75%]" style={{ backgroundColor: colors.secondary }} />
                    </div>
                  </div>

                  <div 
                    className="border p-4 rounded-xl space-y-2"
                    style={{
                      background: colors.bg,
                      borderColor: colors.border,
                      borderWidth: '2px'
                    }}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: colors.text }}>Análisis Comparativo de Razones P/E</span>
                      <span className="font-mono font-medium" style={{ color: colors.secondary }}>95%</span>
                    </div>
                    <div 
                      className="w-full h-1.5 rounded-full overflow-hidden border"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border
                      }}
                    >
                      <div className="h-full w-[95%]" style={{ backgroundColor: colors.secondary }} />
                    </div>
                  </div>

                  <div 
                    className="border p-4 rounded-xl space-y-2"
                    style={{
                      background: colors.bg,
                      borderColor: colors.border,
                      borderWidth: '2px'
                    }}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: colors.text }}>Estructura y Cobertura de Apalancamientos</span>
                      <span className="font-mono font-medium" style={{ color: colors.secondary }}>60%</span>
                    </div>
                    <div 
                      className="w-full h-1.5 rounded-full overflow-hidden border"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border
                      }}
                    >
                      <div className="h-full w-[60%]" style={{ backgroundColor: colors.secondary }} />
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
        <Route path="/doubts" element={<StudentDoubtsView theme={theme} courses={courses} />} />
      </Routes>
      </div>
    </div>
  );
}

function StudentDoubtsView({ theme, courses }: { theme: Theme; courses: any[] }) {
  const colors = themeColors[theme];
  const isLight = theme === 'light';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 shrink-0" style={{ borderBottomColor: colors.border }}>
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider font-mono" style={{ color: colors.text }}>
            Historial de Dudas (Atención Directa)
          </h2>
          <p className="text-xs font-normal" style={{ color: colors.textMuted }}>
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
          className="px-4 py-2 border text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 self-start shadow-sm"
          style={{
            background: colors.primary,
            borderColor: colors.border,
            color: '#1B2632',
            boxShadow: `3px 3px 0px 0px ${colors.border}`
          }}
        >
          <HelpCircle className="w-4 h-4 shrink-0" /> Nueva duda
        </button>
      </div>

      <div 
        className="flex-1 flex border rounded-2xl overflow-hidden min-h-0 relative shadow-md"
        style={{
          background: colors.cardBg,
          borderColor: colors.border,
          borderWidth: '2px',
          boxShadow: `4px 4px 0px 0px ${colors.border}`
        }}
      >
        {/* WhatsApp Left Sidebar: Questions list */}
        <div 
          className={`w-full md:w-80 border-r flex flex-col shrink-0 ${
            mobileActiveView === 'chat' && !showNewDudaForm ? 'hidden md:flex' : 'flex'
          }`}
          style={{ borderRightColor: colors.border }}
        >
          <div 
            className="p-3.5 border-b flex items-center justify-between shrink-0"
            style={{
              background: colors.bg,
              borderBottomColor: colors.border
            }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono" style={{ color: colors.textMuted }}>
              Conversaciones ({questions.length})
            </span>
            <button
              onClick={fetchQuestions}
              className="p-1 rounded-lg transition cursor-pointer"
              style={{ color: colors.textMuted }}
              title="Actualizar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div 
            className="flex-1 overflow-y-auto divide-y scrollbar-thin"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bg
            }}
          >
            {loading && questions.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono" style={{ color: colors.textMuted }}>
                Cargando historial...
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-xs font-normal" style={{ color: colors.textMuted }}>
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
                    className="p-3.5 text-left cursor-pointer transition-all duration-150"
                    style={{
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderLeft: isSelected ? `3px solid ${colors.border}` : '3px solid transparent',
                      color: isSelected ? '#1B2632' : colors.text
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span 
                        className="text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase"
                        style={{
                          backgroundColor: isResolved 
                            ? (isLight ? 'rgba(42, 122, 75, 0.12)' : 'rgba(42, 122, 75, 0.2)') 
                            : (isLight ? 'rgba(200, 125, 42, 0.12)' : 'rgba(200, 125, 42, 0.2)'),
                          borderColor: colors.border,
                          color: isResolved 
                            ? (isLight ? '#2A7A4B' : '#4ade80') 
                            : (isLight ? '#C87D2A' : '#f59e0b')
                        }}
                      >
                        {isResolved ? 'Resuelto' : 'Pendiente'}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: isSelected ? '#1B2632' : colors.textMuted }}>
                        {new Date(q.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-bold truncate" style={{ color: isSelected ? '#1B2632' : colors.text }} title={q.courseTitle}>
                      {q.courseTitle}
                    </h4>
                    <p className="text-[9px] truncate mt-0.5" style={{ color: isSelected ? '#1B2632' : colors.textMuted }}>
                      {q.clipTitle}
                    </p>
                    <p className="text-[10px] line-clamp-1 mt-1 leading-normal font-sans" style={{ color: isSelected ? '#1B2632' : colors.textMuted }}>
                      {q.questionText}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* WhatsApp Right Chat Pane */}
        <div className={`flex flex-col flex-1 relative min-w-0 ${
          mobileActiveView === 'list' && !showNewDudaForm ? 'hidden md:flex' : 'flex'
        }`}>
          {showNewDudaForm ? (
            /* New Duda Form */
            <form onSubmit={handleCreateDuda} className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto" style={{ backgroundColor: colors.bg }}>
              <div className="max-w-xl mx-auto w-full space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 animate-fade-in">
                    <div 
                      className="p-2 rounded-xl border"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        color: colors.secondary
                      }}
                    >
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: colors.text }}>Resolver una Nueva Duda</h3>
                      <p className="text-[10px]" style={{ color: colors.textMuted }}>Selecciona el curso y la lección para enviar tu pregunta.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewDudaForm(false);
                      setMobileActiveView('list');
                    }}
                    className="p-1.5 border rounded-xl hover:text-slate-200 md:hidden"
                    style={{
                      borderColor: colors.border,
                      background: colors.cardBg,
                      color: colors.text
                    }}
                  >
                    ← Volver
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-medium font-mono uppercase tracking-wider" style={{ color: colors.textMuted }}>Materia / Curso</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="border rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                    style={{
                      background: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  >
                    <option value="" disabled>Selecciona un curso...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-medium font-mono uppercase tracking-wider" style={{ color: colors.textMuted }}>Lección / Clip</label>
                  {courseClips.length === 0 ? (
                    <div className="text-xs p-2 border rounded-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textMuted }}>
                      No hay lecciones en este curso.
                    </div>
                  ) : (
                    <select
                      value={selectedClipId}
                      onChange={(e) => setSelectedClipId(e.target.value)}
                      className="border rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                      style={{
                        background: colors.cardBg,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    >
                      {courseClips.map((cl: any) => (
                        <option key={cl.id} value={cl.id}>{cl.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-medium font-mono uppercase tracking-wider" style={{ color: colors.textMuted }}>Tu Pregunta o Inquietud</label>
                  <textarea
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Escribe tu duda de forma detallada..."
                    rows={5}
                    className="border rounded-xl px-3 py-2.5 text-xs focus:outline-none leading-relaxed"
                    style={{
                      background: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || courseClips.length === 0 || !questionText.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border"
                    style={{
                      background: submitting || courseClips.length === 0 || !questionText.trim() ? colors.bg : colors.primary,
                      borderColor: colors.border,
                      color: '#1B2632',
                      cursor: submitting || courseClips.length === 0 || !questionText.trim() ? 'not-allowed' : 'pointer',
                      opacity: submitting || courseClips.length === 0 || !questionText.trim() ? 0.5 : 1,
                      boxShadow: submitting || courseClips.length === 0 || !questionText.trim() ? 'none' : `3px 3px 0px 0px ${colors.border}`
                    }}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Duda al Instructor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewDudaForm(false);
                      setMobileActiveView('list');
                    }}
                    className="px-4 py-2.5 border text-xs font-semibold rounded-xl transition cursor-pointer"
                    style={{
                      borderColor: colors.border,
                      background: colors.cardBg,
                      color: colors.text
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : selectedQuestion ? (
            /* WhatsApp Chat Screen */
            <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: colors.bg }}>
              {/* Chat Header */}
              <div 
                className="p-4 border-b flex items-center justify-between shrink-0"
                style={{
                  background: colors.cardBg,
                  borderBottomColor: colors.border
                }}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <button
                    onClick={() => setMobileActiveView('list')}
                    className="p-1 border rounded-xl md:hidden mr-1"
                    title="Atrás"
                    style={{
                      borderColor: colors.border,
                      background: colors.bg,
                      color: colors.text
                    }}
                  >
                    ←
                  </button>
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider block truncate max-w-[150px] sm:max-w-[300px]" style={{ color: colors.secondary }}>
                      {selectedQuestion.courseTitle}
                    </span>
                    <h3 className="text-xs font-bold truncate mt-0.5 max-w-[150px] sm:max-w-[300px]" style={{ color: colors.text }}>
                      Lección: {selectedQuestion.clipTitle}
                    </h3>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span 
                    className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase"
                    style={{
                      backgroundColor: selectedQuestion.replyText 
                        ? (isLight ? 'rgba(42, 122, 75, 0.12)' : 'rgba(42, 122, 75, 0.2)') 
                        : (isLight ? 'rgba(200, 125, 42, 0.12)' : 'rgba(200, 125, 42, 0.2)'),
                      borderColor: colors.border,
                      color: selectedQuestion.replyText 
                        ? (isLight ? '#2A7A4B' : '#4ade80') 
                        : (isLight ? '#C87D2A' : '#f59e0b')
                    }}
                  >
                    {selectedQuestion.replyText ? 'Resuelto' : 'Esperando respuesta'}
                  </span>
                </div>
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* Question bubble (Student - Sender on the right) */}
                <div className="flex justify-end items-end gap-2 max-w-[85%] ml-auto animate-fade-in">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-mono mb-1" style={{ color: colors.textMuted }}>Tú (Estudiante)</span>
                    <div 
                      className="border p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-lg shadow-sm text-left whitespace-pre-wrap"
                      style={{
                        background: isLight ? 'rgba(255, 177, 98, 0.15)' : 'rgba(255, 177, 98, 0.08)',
                        borderColor: colors.border,
                        borderWidth: '2px',
                        color: colors.text
                      }}
                    >
                      {selectedQuestion.questionText}
                    </div>
                    <span className="text-[8px] font-mono mt-1" style={{ color: colors.textMuted }}>
                      {new Date(selectedQuestion.createdAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div 
                    className="w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold shrink-0"
                    style={{
                      background: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.secondary
                    }}
                  >
                    YO
                  </div>
                </div>

                {/* Reply bubble (Instructor - Receiver on the left) */}
                {selectedQuestion.replyText ? (
                  <div className="flex justify-start items-end gap-2 max-w-[85%] animate-fade-in">
                    <div 
                      className="w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold shrink-0"
                      style={{
                        background: colors.primary,
                        borderColor: colors.border,
                        color: '#1B2632'
                      }}
                    >
                      PR
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[8px] font-mono mb-1" style={{ color: colors.textMuted }}>Profe Senior (Instructor)</span>
                      <div 
                        className="border p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-lg shadow-sm text-left whitespace-pre-wrap"
                        style={{
                          background: colors.cardBg,
                          borderColor: colors.border,
                          borderWidth: '2px',
                          color: colors.text
                        }}
                      >
                        {selectedQuestion.replyText}
                      </div>
                      <span className="text-[8px] font-mono mt-1" style={{ color: colors.textMuted }}>
                        {selectedQuestion.repliedAt && new Date(selectedQuestion.repliedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border p-4 rounded-xl text-xs flex items-center gap-2 max-w-md mx-auto justify-center mt-6 text-left"
                    style={{
                      background: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  >
                    <Clock className="w-4 h-4 shrink-0" style={{ color: colors.secondary }} />
                    <span>Duda enviada al instructor. Recibirás una respuesta en este espacio pronto.</span>
                  </div>
                )}
              </div>

              {/* Chat Input Placeholder */}
              <div 
                className="p-3 border-t flex items-center justify-center shrink-0"
                style={{
                  background: colors.cardBg,
                  borderTopColor: colors.border
                }}
              >
                <span className="text-[9px] uppercase font-mono tracking-wider" style={{ color: colors.textMuted }}>
                  {selectedQuestion.replyText ? 'Hilo de discusión cerrado' : 'Esperando respuesta de tu instructor'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-xs" style={{ backgroundColor: colors.bg }}>
              <MessageSquare className="w-12 h-12 mb-2" style={{ color: colors.textMuted }} />
              <span style={{ color: colors.textMuted }}>Selecciona una duda o haz clic en "Nueva duda" para iniciar el chat.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

