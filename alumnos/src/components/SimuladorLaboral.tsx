import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';
import { VERSION, BUILD_HASH } from '../version';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import DesktopShell from './DesktopShell';
import { NotificationToast, NotificationInbox, useNotifications } from './Notifications';

function getToken(): string {
  return localStorage.getItem('supabase_auth_token') || '';
}

async function apiGet(path: string): Promise<any> {
  return apiFetch(path);
}

async function apiGetHtml(path: string): Promise<string> {
  const isRender = window.location.hostname.includes('onrender.com');
  const baseUrl = import.meta.env.VITE_API_URL || (isRender ? 'https://finnova-back.onrender.com' : '');
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.text();
}

interface SimJob { id: string; title: string; description: string; difficulty: number; category?: string; }
interface SimTask { id: string; jobId: string; title: string; description: string; taskType: string; difficulty: number; estimatedMinutes: number; sequenceOrder: number; }
type ViewMode = 'office' | 'workspace' | 'document';

// ─── DESK ──────────────────────────────────────────────────────
function DeskGroup() {
  const legs = [[-1.0, 0.2, -0.4], [1.0, 0.2, -0.4], [-1.0, 0.2, 0.4], [1.0, 0.2, 0.4]];
  return (
    <group position={[0, 0, -2]}>
      <mesh position={[0, 0.4, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.06, 1.0]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.7} />
      </mesh>
      {legs.map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} receiveShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#3d261a" />
        </mesh>
      ))}
    </group>
  );
}

// ─── MONITOR ───────────────────────────────────────────────────
function MonitorGroup({ onClick, hovered }: { onClick: () => void; hovered: boolean }) {
  return (
    <group position={[0, 0.43, -2]} onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.6, 0.04]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      <mesh position={[0, 0.32, 0.025]}>
        <planeGeometry args={[0.92, 0.52]} />
        <meshBasicMaterial color={hovered ? '#3b82f6' : '#0a1628'} />
      </mesh>
      <mesh position={[0, 0.32, 0.026]}>
        <planeGeometry args={[0.85, 0.45]} />
        <meshBasicMaterial color={hovered ? '#60a5fa' : '#1e3a5f'} />
      </mesh>
      <mesh position={[0.4, 0.04, 0.025]}>
        <circleGeometry args={[0.012, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

// ─── CHAIR ─────────────────────────────────────────────────────
function ChairGroup() {
  return (
    <group position={[0, 0, 0.3]}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.04, 16]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.28, 8]} />
        <meshStandardMaterial color="#555" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.33, 0]} receiveShadow>
        <boxGeometry args={[0.42, 0.05, 0.42]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0.2]} receiveShadow>
        <boxGeometry args={[0.38, 0.4, 0.05]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── ROOM ─────────────────────────────────────────────────────
function RoomGroup() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#5a6a7a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.5, -4.5]} receiveShadow>
        <boxGeometry args={[10, 5, 0.3]} />
        <meshStandardMaterial color="#8a9aab" roughness={0.95} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[9, 5, 0.3]} />
        <meshStandardMaterial color="#9aaabc" roughness={0.95} />
      </mesh>
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[9, 5, 0.3]} />
        <meshStandardMaterial color="#9aaabc" roughness={0.95} />
      </mesh>
      <mesh position={[0, 5, -2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 9]} />
        <meshStandardMaterial color="#3a4655" roughness={0.95} />
      </mesh>
      <mesh position={[1.8, 2, -4.44]} receiveShadow>
        <boxGeometry args={[2.2, 1.5, 0.02]} />
        <meshBasicMaterial color="#87CEEB" transparent opacity={0.4} />
      </mesh>
      <mesh position={[1.8, 2, -4.43]}>
        <boxGeometry args={[2.25, 0.04, 0.025]} />
        <meshStandardMaterial color="#eee" />
      </mesh>
    </group>
  );
}

// ─── SHELF ─────────────────────────────────────────────────────
function ShelfGroup() {
  const shelves = [[0.15, 0.4, 0], [0.15, 1.1, 0], [0.15, 1.8, 0]];
  return (
    <group position={[-4.3, 0, -3.5]}>
      <mesh position={[0, 1.1, 0]} receiveShadow>
        <boxGeometry args={[0.2, 2.2, 1.0]} />
        <meshStandardMaterial color="#5c3d2e" />
      </mesh>
      {shelves.map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} receiveShadow>
          <boxGeometry args={[0.02, 0.025, 0.95]} />
          <meshStandardMaterial color="#3d261a" />
        </mesh>
      ))}
      <mesh position={[0.12, 0.55, -0.3]} receiveShadow>
        <boxGeometry args={[0.05, 0.25, 0.15]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[0.12, 0.55, 0.0]} receiveShadow>
        <boxGeometry args={[0.05, 0.3, 0.2]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <mesh position={[0.12, 0.55, 0.3]} receiveShadow>
        <boxGeometry args={[0.05, 0.22, 0.18]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  );
}

// ─── LAMP ──────────────────────────────────────────────────────
function CeilingLamp() {
  return (
    <group position={[0, 4.6, -1]}>
      <mesh receiveShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.5} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// ─── CAMERA CONTROLLER (animates between office and workspace views) ──
function CameraController({ viewMode }: { viewMode: ViewMode }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  useEffect(() => {
    if (viewMode === 'workspace' || viewMode === 'document') {
      targetPos.current.set(0, 0.65, -1.0);
    }
  }, [viewMode]);

  useFrame(() => {
    if (viewMode === 'workspace' || viewMode === 'document') {
      camera.position.lerp(targetPos.current, 0.06);
      camera.lookAt(0, 0.55, -2);
    }
  });

  return null;
}

// ─── SCENE ─────────────────────────────────────────────────────
function OfficeScene({ onMonitorClick, hovered, setHovered }: { onMonitorClick: () => void; hovered: boolean; setHovered: (b: boolean) => void }) {
  return (
    <group>
      <RoomGroup />
      <DeskGroup />
      <MonitorGroup onClick={onMonitorClick} hovered={hovered} />
      <ChairGroup />
      <ShelfGroup />
      <CeilingLamp />
    </group>
  );
}

// ─── UI COMPONENTS ────────────────────────────────────────────
function TaskCard({ task, onClick, colors }: { task: SimTask; onClick: () => void; colors: any }) {
  return (
    <button onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 hover:translate-x-1 cursor-pointer group"
      style={{
        borderColor: colors.border,
        background: colors.cardBg,
        boxShadow: `3px 3px 0px 0px ${colors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold leading-tight" style={{ color: colors.text }}>{task.title}</span>
        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2" style={{
          background: colors.primary, color: '#1B2632',
        }}>{task.estimatedMinutes}m</span>
      </div>
      <p className="text-[10px] leading-relaxed mb-2" style={{ color: colors.textMuted }}>{task.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded" style={{
          background: colors.bg, color: colors.textMuted,
        }}>{task.taskType.replace(/_/g, ' ')}</span>
        <span className="text-[9px] font-mono" style={{ color: colors.secondary }}>
          {'★'.repeat(task.difficulty)}<span style={{ opacity: 0.3 }}>{'★'.repeat(5 - task.difficulty)}</span>
        </span>
      </div>
    </button>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
interface SimProps { theme: Theme; }

export default function SimuladorLaboral({ theme }: SimProps) {
  const colors = themeColors[theme];
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('office');
  const [jobs, setJobs] = useState<SimJob[]>([]);
  const [tasks, setTasks] = useState<SimTask[]>([]);
  const [selectedJob, setSelectedJob] = useState<SimJob | null>(null);
  const [selectedTask, setSelectedTask] = useState<SimTask | null>(null);
  const [docHtml, setDocHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [monitorHovered, setMonitorHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { notifications, toast, inboxOpen, setInboxOpen, unreadCount, addNotification, markAllRead, checkEvents } = useNotifications();

  // Poll for events every 90s when in workspace mode
  useEffect(() => {
    if (viewMode !== 'workspace' && viewMode !== 'document') return;
    const interval = setInterval(checkEvents, 90000);
    checkEvents();
    return () => clearInterval(interval);
  }, [viewMode]);

  useEffect(() => {
    checkOnboarding();
    fetchJobs();
    loadStats();
  }, []);

  async function checkOnboarding() {
    try {
      const profile = await apiFetch<any>('/api/sim/my-profile');
      if (!profile.onboardingCompleted) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
        if (profile.assignedJob) setSelectedJob(profile.assignedJob);
      }
    } catch (e) {
      console.error(e);
      setNeedsOnboarding(true);
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  async function fetchJobs() {
    try {
      setApiError(null);
      const data = await apiGet('/api/sim/jobs');
      setJobs(data);
    } catch (e: any) {
      setApiError('No se puede conectar con el backend. Verifica que VITE_API_URL esté configurado.');
      console.error(e);
    }
  }

  async function loadStats() {
    try { const data = await apiGet('/api/sim/my-stats'); setUserStats(data); }
    catch (e) { /* ignore */ }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      const data = await apiFetch<any>(`/api/sim/tasks/${taskId}/complete`, { method: 'POST' });
      setEvalResult(data);
      loadStats();

      // Progression milestone notification
      if (data.progression && data.progression.milestone) {
        addNotification({
          id: `prog-${Date.now()}`,
          from: 'Sistema',
          subject: data.progression.leveledUp ? '🎉 ¡Promoción!' : '📈 Progreso',
          body: data.progression.milestone,
          time: new Date().toISOString(),
          read: false,
          type: 'milestone',
        });
      }
    } catch (e) { console.error(e); }
  }

  async function selectJob(job: SimJob) {
    setSelectedJob(job); setLoading(true);
    try {
      const data = await apiGet(`/api/sim/tasks/${job.id}`);
      setTasks(data); setViewMode('workspace');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openDocument(task: SimTask) {
    setSelectedTask(task); setLoading(true);
    try {
      const docType =
        task.taskType === 'bank_reconciliation' ? 'bank_statement' :
        task.taskType === 'ap_reconciliation' ? 'trial_balance' :
        task.taskType === 'payment_registration' || task.taskType === 'payment_scheduling' ? 'payment_receipt' :
        task.taskType === 'tax_calculation' ? 'invoice' :
        task.taskType === 'payroll' ? 'payroll' :
        task.taskType === 'journal_entry' ? 'trial_balance' :
        'invoice';
      const html = await apiGetHtml(`/api/sim/documents/${docType}?format=html`);
      setDocHtml(html); setViewMode('document');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleMonitorClick() {
    if (apiError) {
      addNotification({ id: `err-${Date.now()}`, from: 'Sistema', subject: '⚠️ Error de conexión', body: apiError, time: new Date().toISOString(), read: false, type: 'alert' });
      return;
    }
    if (viewMode === 'office' && jobs.length > 0) {
      // Welcome notification on first entry
      const welcomeShown = localStorage.getItem('sim_welcome_shown');
      if (!welcomeShown) {
        addNotification({
          id: `welcome-${Date.now()}`,
          from: 'Sistema',
          subject: '🏢 ¡Bienvenido al Simulador Laboral!',
          body: `Has sido asignado como ${jobs[0]?.title || 'Auxiliar Contable'}. Revisa tu bandeja de entrada para comenzar.`,
          time: new Date().toISOString(),
          read: false,
          type: 'milestone',
        });
        localStorage.setItem('sim_welcome_shown', 'true');
      }
      selectJob(jobs[0]);
    }
  }

  function goBack() {
    if (viewMode === 'document') setViewMode('workspace');
    else if (viewMode === 'workspace') {
      setSelectedJob(null);
      setTasks([]);
      setSelectedTask(null);
      setViewMode('office');
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }

  const isDark = theme === 'dark';

  if (needsOnboarding === null) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center rounded-2xl border-2" style={{ borderColor: colors.border, background: colors.bg }}>
        <div className="w-10 h-10 rounded-full border-3 animate-spin" style={{ borderColor: colors.primary, borderTopColor: 'transparent', borderWidth: 3 }} />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding theme={theme} onComplete={() => {
      setNeedsOnboarding(false);
      fetchJobs();
    }} />;
  }

  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-120px)] relative overflow-hidden rounded-2xl border-2" style={{ borderColor: colors.border, background: isDark ? '#0a1628' : '#E2DCD0' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 pointer-events-none">
        <div className="flex items-center gap-2.5 backdrop-blur-xl px-3 py-1.5 rounded-xl border-2 pointer-events-auto" style={{
          borderColor: colors.border,
          background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)',
        }}>
          {viewMode !== 'office' && (
            <button onClick={goBack}
              className="w-6 h-6 rounded-md border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer hover:opacity-70"
              style={{ borderColor: colors.border, color: colors.text, background: colors.bg }}
            >←</button>
          )}
          <div>
            <p className="text-[10px] font-bold font-mono" style={{ color: colors.text }}>
              {viewMode === 'office' ? '🏢 OFICINA VIRTUAL' : viewMode === 'workspace' ? '💼 ESCRITORIO DE TRABAJO' : '📄 DOCUMENTO'}
            </p>
            {selectedJob && viewMode !== 'office' && (
              <p className="text-[7px] font-mono uppercase tracking-wider" style={{ color: colors.primary }}>
                {selectedJob.title}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={() => setInboxOpen(true)}
              className="relative px-3 py-1.5 rounded-xl border-2 cursor-pointer text-[10px] font-mono font-bold backdrop-blur-md transition hover:scale-105"
              style={{ borderColor: colors.border, color: colors.text, background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)' }}>
              📬 {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: colors.primary, color: '#1B2632' }}>{unreadCount}</span>
              )}
            </button>
            <button onClick={toggleFullscreen}
          className="px-3 py-1.5 rounded-xl border-2 cursor-pointer text-[10px] font-mono font-bold backdrop-blur-md transition hover:scale-105 pointer-events-auto"
          style={{
            borderColor: colors.border,
            color: colors.text,
            background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)',
          }}
        >{isFullscreen ? '⛶ Salir' : '⛶ Pantalla completa'}</button>
          </div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 1.15, 1.4], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(isDark ? '#0a1628' : '#E2DCD0'))}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[6, 10, 4]} intensity={0.6} />
          <pointLight position={[0, 4.4, -1]} intensity={0.5} distance={10} color="#FFE4B5" />
          <OfficeScene onMonitorClick={handleMonitorClick} hovered={monitorHovered} setHovered={setMonitorHovered} />
          <CameraController viewMode={viewMode} />
          {viewMode === 'office' && (
            <OrbitControls enablePan={false} enableZoom={true} maxPolarAngle={Math.PI / 2.0} minDistance={0.8} maxDistance={3.5} target={[0, 0.7, -1.8]} />
          )}
        </Suspense>
      </Canvas>

      {/* Welcome hint */}
      {viewMode === 'office' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="px-5 py-2.5 rounded-xl border-2 backdrop-blur-xl animate-pulse-slow flex items-center gap-2" style={{
            borderColor: colors.primary,
            background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)',
            boxShadow: `4px 4px 0px 0px ${colors.primary}`,
          }}>
            <span className="text-base">🖥️</span>
            <span className="text-xs font-bold" style={{ color: colors.primary }}>Haz clic en la pantalla para empezar a trabajar</span>
          </div>
        </div>
      )}

      {/* DESKTOP SHELL — escritorio de trabajo */}
      {(viewMode === 'workspace' || viewMode === 'document') && (
        <div className="absolute inset-0 z-30">
          <DesktopShell
            theme={theme}
            tasks={tasks.map(t => ({ id: t.id, title: t.title, type: (t as any).taskType || (t as any).task_type, difficulty: t.difficulty, time: t.estimatedMinutes }))}
            onClose={() => {
              setViewMode('office');
              setTasks([]);
              loadStats();
            }}
            onTaskComplete={loadStats}
          />
        </div>
      )}

      {/* Dashboard modal */}
      {showDashboard && <Dashboard theme={theme} onClose={() => { setShowDashboard(false); loadStats(); }} />}

      {/* Stats HUD */}
      {userStats && (
        <div className="absolute bottom-3 left-3 z-30 flex gap-2">
          <div className="px-3 py-2 rounded-xl border-2 backdrop-blur-xl text-[9px] font-mono" style={{
            borderColor: colors.border, background: isDark ? 'rgba(27,38,50,0.7)' : 'rgba(255,255,255,0.7)',
          }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span style={{ color: colors.textMuted }}>SESIÓN ACTIVA</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: colors.primary, color: '#1B2632' }}>
                🎯 {userStats.level}
              </span>
            </div>
            <div className="flex items-center gap-3" style={{ color: colors.text }}>
              <span>✅ <strong>{userStats.tasksCompleted}</strong> tareas</span>
              <span>⭐ <strong>{userStats.totalScore} pts</strong></span>
              <span>⏱️ <strong>{userStats.totalTime} min</strong></span>
            </div>
            <button onClick={() => setShowDashboard(true)}
              className="mt-1.5 w-full text-[8px] font-bold py-1 rounded-lg border cursor-pointer hover:opacity-80 transition"
              style={{ borderColor: colors.primary, color: colors.primary, background: 'transparent' }}
            >📊 Ver dashboard</button>
            <div className="mt-1 pt-1 border-t text-center" style={{ borderColor: colors.border + '40', color: colors.textMuted }}>
              <span className="text-[7px] font-mono">v{VERSION} ({BUILD_HASH})</span>
            </div>
          </div>
        </div>
      )}
      {toast && <NotificationToast notif={toast} theme={theme} />}
      {inboxOpen && <NotificationInbox theme={theme} onClose={() => setInboxOpen(false)} notifications={notifications} markAllRead={markAllRead} unreadCount={unreadCount} />}
    </div>
  );
}
