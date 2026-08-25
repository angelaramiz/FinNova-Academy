import { useState, useRef, useEffect } from 'react';
import TutorialOverlay, { useTutorial } from './Tutorial';
import { themeColors, Theme } from '../lib/theme';
import EmailInbox from './EmailInbox';
import EmailClient from './EmailClient';
import AccountingForm from './AccountingForm';
import SpreadsheetWidget from './SpreadsheetWidget';
import BankingPortal from './BankingPortal';
import CalendarWidget from './CalendarWidget';
import Calculator from './Calculator';
import SpreadsheetSim from './SpreadsheetSim';
import AccountingSystem from './AccountingSystem';
import PaymentMatcher from './PaymentMatcher';
import Dashboard from './Dashboard';
import ProgressDashboard from './ProgressDashboard';
import PipelineSim from './PipelineSim'; // Palantir Foundry Transforms
import SQLSim from './SQLSim';
import WarehouseSim from './WarehouseSim';
import MonitorSim from './MonitorSim';
import DBTSim from './DBTSim';
import CatalogSim from './CatalogSim';
import NotebookSim from './NotebookSim';
import AirflowSim from './AirflowSim';
import CloudSim from './CloudSim';
import GitSim from './GitSim';
import BiSim from './BiSim';
import CapstoneSim from './capstoneSim';
import ApiClientSim from './ApiClientSim';
import DataOpsSim from './DataOpsSim';
import LearningSim from './LearningSim';
import StatsSim from './StatsSim';
import MLSim from './MLSim';
import CvBuilderSim from './CvBuilderSim';
import InterviewSim from './InterviewSim';
import ChronicleSim from './ChronicleSim';
import VacancyTracker from './VacancyTracker';
import CareerCenter from './CareerCenter';
import GuideBubbles from './GuideBubbles';
import PracticasModules from './PracticasModules';
import Glossary from './Glossary';
import TaxDeclaration from './TaxDeclaration';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';
import { simHeaderNow } from '../lib/simTime';

interface TaskInfo { id: string; title: string; type: string; difficulty: number; time: number; isTrap?: boolean; trapId?: string; completed?: boolean; }
async function apiPost(path: string, body?: any): Promise<any> { return apiFetch(path, { method: body ? 'POST' : 'GET', ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) }); }

interface CareerPathState {
  currentNode: 'analyst' | 'data_engineering' | 'data_science';
  chosenBranch: 'data_engineering' | 'data_science' | null;
  practicePct: number;
  unlocked: { data_engineering: boolean; data_science: boolean };
  demoOverride: { enabled: boolean };
  history: { ts: string; event: string }[];
  breakdown?: { tasks: { done: number; total: number }; sims: { validated: number; total: number }; cases: { done: number; total: number } };
}

interface DesktopShellProps { theme: Theme; tasks: TaskInfo[]; onClose: () => void; onTaskComplete?: () => void; specialty?: string; onSpecialtyChange?: (specialty: string) => void; }
type Screen = 'desktop' | 'workflow' | 'banking' | 'emailInbox' | 'calendar' | 'calculadora' | 'archivo' | 'spreadsheet' | 'accounting' | 'dashboard' | 'progress' | 'pipeline' | 'sql' | 'warehouse' | 'monitor' | 'dbt' | 'catalog' | 'notebook' | 'airflow' | 'cloud' | 'git' | 'bi' | 'capstone' | 'api' | 'dataops' | 'learning' | 'stats' | 'ml' | 'routes' | 'cv' | 'interview' | 'chronicle' | 'vacancies' | 'careercenter' | 'practicas' | 'practicasTracker' | 'practicasCurso';

export default function DesktopShell({ theme, tasks, onClose, onTaskComplete, specialty: specialtyProp, onSpecialtyChange }: DesktopShellProps) {
  const specialty = (specialtyProp as 'accounting' | 'data_engineering' | 'practicas') || 'accounting';
  const { tutorialActive, tutorialStep, totalSteps, currentStep, nextStep, skipTutorial } = useTutorial(specialty as 'accounting' | 'data_engineering');
  const { addToast } = useToast();
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [screen, setScreen] = useState<Screen>('desktop');
  const [currentTask, setCurrentTask] = useState<TaskInfo | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showMatcher, setShowMatcher] = useState(false);
  const [world, setWorld] = useState<any>(null);
  const [matcherData, setMatcherData] = useState<{ clientName: string; amount: number } | null>(null);
  const [screenTransition, setScreenTransition] = useState(false);
  const [careerPath, setCareerPath] = useState<CareerPathState | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [demoPreview, setDemoPreview] = useState<'analyst' | 'engineering' | 'science'>('analyst');
  const [storyArc, setStoryArc] = useState<{ arcId: string; nombre: string; activeScene: string | null; sceneLabel?: string } | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const prevScreen = useRef<Screen>('desktop');

  const isData = specialty === 'data_engineering';
  const isPracticas = specialty === 'practicas';
  const demoActive = !!careerPath?.demoOverride?.enabled;
  // En demo, se puede previsualizar cada fase sin elegir irreversiblemente.
  // Si ya eligió rama, esa rama manda; si no, usa demoPreview.
  const appSet = isData
    ? (careerPath?.chosenBranch === 'data_science' ? 'science'
      : careerPath?.chosenBranch === 'data_engineering' ? 'engineering'
      : demoActive ? demoPreview
      : 'analyst')
    : isPracticas ? 'practicas'
    : 'accounting';
  const roleTitle = isData
    ? (careerPath?.chosenBranch === 'data_engineering' ? 'Ingeniero de Datos Jr'
      : careerPath?.chosenBranch === 'data_science' ? 'Científico de Datos Jr'
      : demoActive && demoPreview === 'engineering' ? 'Ingeniero de Datos Jr'
      : demoActive && demoPreview === 'science' ? 'Científico de Datos Jr'
      : 'Analista de Datos')
    : isPracticas ? 'Practicante de Contabilidad'
    : 'Contador General Jr';

  async function loadWorld() {
    try {
      const data = await apiPost('/api/sim/world');
      setWorld(data);
    } catch { /* noop */ }
  }

  async function loadCareerPath() {
    if (!isData) return;
    try {
      const data = await apiPost('/api/sim/career-path');
      setCareerPath(data.careerPath);
    } catch { /* noop */ }
  }

  async function loadStory() {
    try {
      const route = isData ? (appSet === 'engineering' ? 'engineering' : appSet === 'science' ? 'science' : 'analyst') : 'contable';
      const data = await apiPost(`/api/sim/story/state?route=${route}`);
      if (data?.arcId) {
        const arc = data.arcs?.find((a: any) => a.id === data.arcId);
        setStoryArc({ arcId: data.arcId, nombre: arc?.nombre || data.arcId, activeScene: data.activeScene });
      }
    } catch { /* noop */ }
  }

  useEffect(() => {
    if (isData) { loadWorld(); loadCareerPath(); }
    loadStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty, appSet]);

  async function toggleDemoOverride(enabled: boolean) {
    try {
      const data = await apiPost('/api/sim/career-path/demo-override', { enabled });
      setCareerPath(data.careerPath);
      localStorage.setItem('demo_routes_override', enabled ? '1' : '0');
      addToast(enabled ? 'Rutas DEMO activadas (vista, no afecta progreso)' : 'Rutas DEMO desactivadas — vuelve a regir el progreso real', enabled ? 'info' : 'info');
    } catch (e: any) { console.error(e); addToast(e.message || 'Error al cambiar rutas demo', 'error'); }
  }

  async function chooseBranch(branch: 'data_engineering' | 'data_science') {
    try {
      const data = await apiPost('/api/sim/career-path/choose', { branch });
      setCareerPath(data.careerPath);
      setShowRoutes(false);
      addToast(`Ruta elegida: ${branch === 'data_engineering' ? 'Ingeniería de Datos' : 'Ciencia de Datos'}`, 'success');
      if (onTaskComplete) onTaskComplete();
    } catch (e: any) { console.error(e); addToast(e.message || 'Error al elegir ruta', 'error'); }
  }

  async function startTask(task: TaskInfo, skipEmailStep = false) {
    setCurrentTask(task); setLoading(true);
    try {
      const trapQuery = task.isTrap && task.trapId ? `?trap=${encodeURIComponent(task.trapId)}` : '';
      const wf: any = await apiPost(`/api/workflows/${task.type}${trapQuery}`);
      setWorkflow(wf);
      const firstContentStep = wf.steps.findIndex((s: any) => s.type !== 'email');
      setStepIdx(skipEmailStep ? firstContentStep : 0);
      setValidationResult(null);
      setScreen('workflow');
    } catch (e: any) { console.error(e); addToast(e.message || 'Error al cargar datos', 'error'); }
    setLoading(false);
  }

  async function handleFormSubmit(answers: Record<string, any>) {
    if (!currentTask || !workflow) return; setLoading(true);
    try {
      const result = await apiPost('/api/workflows/validate', { taskType: currentTask.type, answers, trap: currentTask.isTrap ? currentTask.trapId : undefined, workflowId: workflow.taskId || workflow.id });
      setValidationResult(result);
      setStepIdx(workflow.steps.length - 1);
      // Record progress (non-blocking, best-effort)
      try {
        await apiPost('/api/sim/progress/record', {
          taskId: currentTask.id, taskType: currentTask.type,
          title: currentTask.title, category: (currentTask as any).category || '',
          specialty: specialty || 'accounting', difficulty: currentTask.difficulty,
          score: result.totalScore || 0, maxScore: result.maxPossible || 100,
          passed: !!result.passed, week: 0, day: 0,
          timeSpent: currentTask.time || 10,
          isTrap: currentTask.isTrap, trapDetected: false,
        });
      } catch { /* non-critical */ }
      // Mark task as completed locally for progressive unlocking
      setCompletedTaskIds(prev => new Set([...prev, currentTask.id]));
      // Auto-generar asientos contables según el tipo de tarea
      generateEntriesForTask(currentTask.type, answers);
      addToast('Asiento contable generado automáticamente', 'success');
      // Si es tarea de pago, mostrar matcher
      if (currentTask.type === 'payment_registration' && answers.clientName && answers.amountReceived) {
        setMatcherData({ clientName: answers.clientName, amount: Number(answers.amountReceived) });
        setShowMatcher(true);
        setLoading(false);
        return;
      }
      if (onTaskComplete) onTaskComplete();
      if (specialty === 'data_engineering') loadWorld();
    } catch (e: any) { console.error(e); addToast(e.message || 'Error al cargar datos', 'error'); }
    setLoading(false);
  }

  function generateEntriesForTask(type: string, answers: Record<string, any>) {
    try {
      const data: any = { subtotal: Number(answers.subtotal || answers.amount || 0), iva: Number(answers.iva || 0), total: Number(answers.total || answers.amount || 0) };
      if (answers.clientName) data.clientName = answers.clientName;
      if (answers.supplierName) data.supplierName = answers.supplierName;
      if (answers.invoiceNumber || answers.folio) data.invoiceNumber = answers.invoiceNumber || answers.folio;
      if (answers.folio) data.folio = answers.folio;
      if (answers.amountReceived) data.amount = answers.amountReceived;
      if (type === 'payroll') {
        data.totalGross = Number(answers.gross || 0);
        data.totalIsr = Number(answers.isr || 0);
        data.totalImss = Number(answers.imss || 0);
        data.totalNeto = Number(answers.net || 0);
        data.employees = 4;
      }
      let entryType = type;
      if (type === 'supplier_invoice') entryType = 'supplier';
      if (type === 'business_expense') {
        data.subtotal = Number(answers['row_Subtotal del ticket'] || data.subtotal || 0);
        data.iva = Number(answers['row_IVA del consumo (16%)'] || data.iva || 0);
        data.total = Number(answers['row_Total pagado'] || data.total || 0);
        data.propina = Number(answers['row_Propina (no deducible)'] || 0);
      }
      apiPost('/api/sim/generate-entries', { type: entryType, data });
    } catch (e: any) { console.error(e); addToast(e.message || 'Error al cargar datos', 'error'); }
  }

  async function handleSpreadsheetSubmit(answers: Record<string, any>) { await handleFormSubmit(answers); }

  function closeWorkflow() { setScreen('desktop'); setCurrentTask(null); setWorkflow(null); setStepIdx(0); setValidationResult(null); }
  function openTaskFromEmail(taskId: string) { const task = tasks.find(t => t.id === taskId); if (task) startTask(task, true); }

const accountingApps = [
  { label: 'Tareas', icon: '📋', count: tasks.length, action: () => setScreen('desktop'), dataApp: 'tareas' },
  { label: 'Correo', icon: '📧', count: tasks.length, action: () => setScreen('emailInbox'), dataApp: 'correo' },
  { label: 'Contable', icon: '📊', action: () => setScreen('accounting'), dataApp: 'contable' },
  { label: 'Excel', icon: '📈', action: () => setScreen('spreadsheet'), dataApp: 'excel' },
  { label: 'Calendario', icon: '📅', action: () => setScreen('calendar'), dataApp: 'calendario' },
  { label: 'Banco', icon: '🏦', action: () => setScreen('banking'), dataApp: 'banco' },
  { label: 'Calculadora', icon: '🧮', action: () => setScreen('calculadora'), dataApp: 'calculadora' },
  { label: 'Archivo', icon: '📁', action: () => setScreen('archivo'), dataApp: 'archivo' },
  { label: 'Dashboard', icon: '⚡', action: () => setScreen('dashboard'), dataApp: 'dashboard' },
  { label: 'Progreso', icon: '📉', action: () => setScreen('progress'), dataApp: 'progreso' },
  { label: 'Mi CV', icon: '📄', action: () => setScreen('cv'), dataApp: 'cv' },
  { label: 'Entrevista', icon: '🎤', action: () => setScreen('interview'), dataApp: 'interview' },
  { label: 'Crónica', icon: '📖', action: () => setScreen('chronicle'), dataApp: 'cronica' },
  { label: 'Vacantes', icon: '🎯', action: () => setScreen('vacancies'), dataApp: 'vacantes' },
  { label: 'Carrera', icon: '💼', action: () => setScreen('careercenter'), dataApp: 'carrera' },
];

const analystApps = [
  { label: 'Tareas', icon: '📋', count: tasks.length, action: () => setScreen('desktop'), dataApp: 'tareas' },
  { label: 'Correo', icon: '📧', count: tasks.length, action: () => setScreen('emailInbox'), dataApp: 'correo' },
  { label: 'SQL', icon: '🗃️', action: () => setScreen('sql'), dataApp: 'sql' },
  { label: 'Notebook', icon: '📓', action: () => setScreen('notebook'), dataApp: 'notebook' },
  { label: 'Catalog', icon: '📚', action: () => setScreen('catalog'), dataApp: 'catalog' },
  { label: 'BI', icon: '📊', action: () => setScreen('bi'), dataApp: 'bi' },
  { label: 'Excel', icon: '📈', action: () => setScreen('spreadsheet'), dataApp: 'excel' },
  { label: 'Aprendizaje', icon: '📚', action: () => setScreen('learning'), dataApp: 'learning' },
  { label: 'Dashboard', icon: '⚡', action: () => setScreen('dashboard'), dataApp: 'dashboard' },
  { label: 'Progreso', icon: '📉', action: () => setScreen('progress'), dataApp: 'progreso' },
  { label: 'Mi CV', icon: '📄', action: () => setScreen('cv'), dataApp: 'cv' },
  { label: 'Entrevista', icon: '🎤', action: () => setScreen('interview'), dataApp: 'interview' },
  { label: 'Crónica', icon: '📖', action: () => setScreen('chronicle'), dataApp: 'cronica' },
  { label: 'Vacantes', icon: '🎯', action: () => setScreen('vacancies'), dataApp: 'vacantes' },
  { label: 'Carrera', icon: '💼', action: () => setScreen('careercenter'), dataApp: 'carrera' },
];

const engineeringApps = [
  { label: 'Tareas', icon: '📋', count: tasks.length, action: () => setScreen('desktop'), dataApp: 'tareas' },
  { label: 'Correo', icon: '📧', count: tasks.length, action: () => setScreen('emailInbox'), dataApp: 'correo' },
  { label: 'Foundry', icon: '🔀', action: () => setScreen('pipeline'), dataApp: 'pipelines' },
  { label: 'dbt', icon: '🧱', action: () => setScreen('dbt'), dataApp: 'dbt' },
  { label: 'Catalog', icon: '📚', action: () => setScreen('catalog'), dataApp: 'catalog' },
  { label: 'Notebook', icon: '📓', action: () => setScreen('notebook'), dataApp: 'notebook' },
  { label: 'Airflow', icon: '🛫', action: () => setScreen('airflow'), dataApp: 'airflow' },
  { label: 'Cloud', icon: '☁️', action: () => setScreen('cloud'), dataApp: 'cloud' },
  { label: 'Git', icon: '🌿', action: () => setScreen('git'), dataApp: 'git' },
  { label: 'BI', icon: '📊', action: () => setScreen('bi'), dataApp: 'bi' },
  { label: 'Capstone', icon: '🎓', action: () => setScreen('capstone'), dataApp: 'capstone' },
  { label: 'API Client', icon: '📡', action: () => setScreen('api'), dataApp: 'api' },
  { label: 'DataOps', icon: '🧠', action: () => setScreen('dataops'), dataApp: 'dataops' },
  { label: 'Aprendizaje', icon: '📚', action: () => setScreen('learning'), dataApp: 'learning' },
  { label: 'SQL', icon: '🗃️', action: () => setScreen('sql'), dataApp: 'sql' },
  { label: 'Warehouse', icon: '🏗️', action: () => setScreen('warehouse'), dataApp: 'warehouse' },
  { label: 'Monitor', icon: '📊', action: () => setScreen('monitor'), dataApp: 'monitor' },
  { label: 'Excel', icon: '📈', action: () => setScreen('spreadsheet'), dataApp: 'excel' },
  { label: 'Mi CV', icon: '📄', action: () => setScreen('cv'), dataApp: 'cv' },
  { label: 'Entrevista', icon: '🎤', action: () => setScreen('interview'), dataApp: 'interview' },
  { label: 'Crónica', icon: '📖', action: () => setScreen('chronicle'), dataApp: 'cronica' },
  { label: 'Vacantes', icon: '🎯', action: () => setScreen('vacancies'), dataApp: 'vacantes' },
  { label: 'Carrera', icon: '💼', action: () => setScreen('careercenter'), dataApp: 'carrera' },
];

const scienceApps = [
  { label: 'Tareas', icon: '📋', count: tasks.length, action: () => setScreen('desktop'), dataApp: 'tareas' },
  { label: 'Correo', icon: '📧', count: tasks.length, action: () => setScreen('emailInbox'), dataApp: 'correo' },
  { label: 'SQL', icon: '🗃️', action: () => setScreen('sql'), dataApp: 'sql' },
  { label: 'Notebook', icon: '📓', action: () => setScreen('notebook'), dataApp: 'notebook' },
  { label: 'Catalog', icon: '📚', action: () => setScreen('catalog'), dataApp: 'catalog' },
  { label: 'Stats', icon: '📈', action: () => setScreen('stats'), dataApp: 'stats' },
  { label: 'ML', icon: '🤖', action: () => setScreen('ml'), dataApp: 'ml' },
  { label: 'Experimentos', icon: '🧪', action: () => setScreen('ml'), dataApp: 'experimentos' },
  { label: 'BI', icon: '📊', action: () => setScreen('bi'), dataApp: 'bi' },
  { label: 'Excel', icon: '📈', action: () => setScreen('spreadsheet'), dataApp: 'excel' },
  { label: 'Aprendizaje', icon: '📚', action: () => setScreen('learning'), dataApp: 'learning' },
  { label: 'Dashboard', icon: '⚡', action: () => setScreen('dashboard'), dataApp: 'dashboard' },
  { label: 'Progreso', icon: '📉', action: () => setScreen('progress'), dataApp: 'progreso' },
  { label: 'Mi CV', icon: '📄', action: () => setScreen('cv'), dataApp: 'cv' },
  { label: 'Entrevista', icon: '🎤', action: () => setScreen('interview'), dataApp: 'interview' },
  { label: 'Crónica', icon: '📖', action: () => setScreen('chronicle'), dataApp: 'cronica' },
  { label: 'Vacantes', icon: '🎯', action: () => setScreen('vacancies'), dataApp: 'vacantes' },
  { label: 'Carrera', icon: '💼', action: () => setScreen('careercenter'), dataApp: 'carrera' },
];

  const practicasApps = [
    { label: 'Módulos', icon: '📚', action: () => setScreen('practicas'), dataApp: 'practicas' },
    { label: 'Tracker', icon: '📅', action: () => setScreen('practicasTracker'), dataApp: 'practicas' },
    { label: 'Curso', icon: '🎓', action: () => setScreen('practicasCurso'), dataApp: 'practicas' },
    { label: 'Tareas', icon: '📋', count: tasks.length, action: () => setScreen('desktop'), dataApp: 'tareas' },
    { label: 'Correo', icon: '📧', count: tasks.length, action: () => setScreen('emailInbox'), dataApp: 'correo' },
    { label: 'Contable', icon: '📊', action: () => setScreen('accounting'), dataApp: 'contable' },
  ];

const appIcons = isPracticas ? practicasApps : !isData ? accountingApps : appSet === 'engineering' ? engineeringApps : appSet === 'science' ? scienceApps : analystApps;

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {tutorialActive && currentStep && (
        <TutorialOverlay
          theme={theme}
          step={tutorialStep}
          totalSteps={totalSteps}
          title={currentStep.title}
          description={currentStep.description}
          highlight={currentStep.highlight}
          position={currentStep.position}
          onDismiss={nextStep}
          onSkip={skipTutorial}
        />
      )}
      {/* Header */}
      <div className="px-3 border-b-2 flex items-center justify-between shrink-0" style={{ borderColor: colors.border, background: isDark ? '#1a1a2e' : '#e5e7eb', height: collapsed ? '26px' : '34px' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(!collapsed)} className="text-[11px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>{collapsed ? '▶' : '◀'}</button>
          {!collapsed && <span className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>Escritorio de Trabajo</span>}
        </div>
        <div className="flex items-center gap-2.5 text-[13px] font-mono" style={{ color: colors.textMuted }}>
          {!collapsed && <span>{simHeaderNow()}</span>}

          <button onClick={onClose} className="w-4 h-4 rounded flex items-center justify-center text-[11px] cursor-pointer hover:opacity-70" style={{ background: '#ef4444', color: '#fff' }}>✕</button>
        </div>
      </div>

      {specialty === 'data_engineering' ? (
        <div className="px-3 py-1 text-[8px] font-mono flex items-center gap-2 flex-wrap" style={{ background: '#3b82f610', color: '#3b82f6', borderBottom: `1px solid ${colors.border}` }}>
          <span>{careerPath?.chosenBranch === 'data_engineering' ? '🔀' : careerPath?.chosenBranch === 'data_science' ? '🧪' : '🧭'} {roleTitle}</span>
          <button onClick={() => setShowRoutes(true)} className="px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80" style={{ borderColor: '#3b82f650', color: '#3b82f6', background: 'transparent' }} title="Abrir panel de rutas">🧭 Rutas</button>
          {demoActive && !careerPath?.chosenBranch && (
            <span className="flex items-center gap-1 ml-1" style={{ background: '#f59e0b15', border: `1px solid #f59e0b40`, borderRadius: 6, padding: '1px 3px' }}>
              {([
                { id: 'analyst' as const, label: 'Analista', icon: '🧭' },
                { id: 'engineering' as const, label: 'Ingeniería', icon: '🔀' },
                { id: 'science' as const, label: 'Ciencia', icon: '🧪' },
              ]).map(t => (
                <button key={t.id} onClick={() => setDemoPreview(t.id)} title={`Vista previa DEMO: ${t.label} de Datos`}
                  className="px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80"
                  style={{ background: demoPreview === t.id ? '#f59e0b' : 'transparent', color: demoPreview === t.id ? '#1B2632' : '#f59e0b', fontWeight: demoPreview === t.id ? 700 : 400 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </span>
          )}
          <span className="text-[7px] px-1 py-0.5 rounded-full" style={{ background: careerPath?.practicePct && careerPath.practicePct >= 40 ? '#22c55e30' : '#64748b30', color: careerPath?.practicePct && careerPath.practicePct >= 40 ? '#22c55e' : '#94a3b8' }}>
            práctica {careerPath?.practicePct ?? 0}%
          </span>
          <button onClick={() => toggleDemoOverride(!careerPath?.demoOverride?.enabled)}
            className={`px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80 ${careerPath?.demoOverride?.enabled ? 'border-amber-500 bg-amber-500/20' : 'border-slate-600'}`}
            style={{ color: careerPath?.demoOverride?.enabled ? '#f59e0b' : '#94a3b8' }}
            title="Atajo DEMO: no afecta el progreso real">
            {careerPath?.demoOverride?.enabled ? 'Rutas DEMO: ⬤' : 'Rutas DEMO: ○'}
          </button>
          {careerPath?.demoOverride?.enabled && <span className="text-[7px] px-1 py-0.5 rounded-full bg-amber-500/20 text-amber-400">DEMO</span>}
        </div>
      ) : isPracticas ? (
        <div className="px-3 py-1 text-[8px] font-mono flex items-center gap-2" style={{ background: '#f59e0b10', color: '#f59e0b', borderBottom: `1px solid ${colors.border}` }}>
          <span>🎓 Prácticas Profesionales — Contabilidad</span>
          <button onClick={() => setScreen('practicas')} className="px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80" style={{ borderColor: '#f59e0b50', color: '#f59e0b', background: 'transparent' }} title="Abrir currículum de módulos">📚 Módulos</button>
        </div>
      ) : (
        <div className="px-3 py-1 text-[8px] font-mono" style={{ background: '#22c55e10', color: '#22c55e', borderBottom: `1px solid ${colors.border}` }}>
          📊 Modo: Contador General Jr — Logística del Norte S.A.
        </div>
      )}
      {specialty === 'data_engineering' && world && (
        <div className="px-3 py-1 text-[8px] font-mono flex items-center gap-2" style={{ background: world.pipeline?.status === 'failed' ? '#ef444410' : '#22c55e10', color: world.pipeline?.status === 'failed' ? '#ef4444' : '#22c55e', borderBottom: `1px solid ${colors.border}` }}>
          <span>🛫 lno_sales_pipeline · 05-jul:</span>
          <span>{world.pipeline?.status === 'failed' ? '🔴 en falla (dbt_test)' : '🟢 recuperado'}</span>
          <span>·</span>
          <span>SLA mart: {world.slas?.mrtSla === 'breached' ? '🔴 incumplido' : '🟢 cumplido'}</span>
        </div>
      )}

      {storyArc && (
        <div className="px-3 py-1 text-[8px] font-mono flex items-center gap-2" style={{ background: '#a855f710', color: '#a855f7', borderBottom: `1px solid ${colors.border}` }}>
          <span>📖 Arco: {storyArc.nombre}</span>
          {storyArc.activeScene && <span>· escena: {storyArc.activeScene}</span>}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden relative" style={{ background: colors.bg }}>
        {screen === 'desktop' && (
          <div className="h-full p-4 overflow-auto animate-slide-in">
            <div className="flex gap-5 mb-6 flex-wrap">
              {appIcons.map((app, i) => (
                <div key={i} data-app={app.dataApp} className="flex flex-col items-center gap-1.5 w-14 cursor-pointer hover:opacity-80 transition" onClick={app.action}>
                  <div className="w-12 h-12 rounded-xl border-2 flex items-center justify-center text-base" style={{ borderColor: colors.border, background: colors.cardBg, boxShadow: `2px 2px 0px 0px ${colors.border}` }}>{app.icon}</div>
                  <span className="text-[11px] font-bold font-mono text-center leading-tight" style={{ color: colors.text }}>{app.label}{app.count && app.count > 0 && app.label !== 'Tareas' ? <span className="ml-0.5" style={{ color: colors.primary }}>({app.count})</span> : null}</span>
                </div>
              ))}
            </div>
            {isData && <AgendaDelDia tasks={tasks} onOpen={startTask} onOpenLearning={() => setScreen('learning')} theme={theme} phase={appSet === 'engineering' ? 'engineering' : appSet === 'science' ? 'science' : 'analyst'} />}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: colors.border }}>
              <div className="px-4 py-2 border-b-2 text-[13px] font-bold font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg, color: colors.text }}>📋 Pendientes del día</div>
              <div className="divide-y" style={{ borderColor: colors.border + '40' }}>
                {isPracticas ? tasks.map((t, idx) => {
                  const isCompleted = completedTaskIds.has(t.id) || (t as any).completed || (t as any).passed;
                  const isLocked = idx > 0 && !completedTaskIds.has(tasks[idx - 1].id) && !(tasks[idx - 1] as any).completed && !(tasks[idx - 1] as any).passed;
                  return (
                    <div key={t.id} data-task={t.id}
                      className={`px-4 py-3 flex items-center justify-between transition ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                      onClick={() => !isLocked && startTask(t, true)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                          style={{ background: isCompleted ? '#22c55e20' : isLocked ? '#64748b20' : t.difficulty === 1 ? '#22c55e20' : '#f59e0b20', color: isCompleted ? '#22c55e' : isLocked ? '#64748b' : t.difficulty === 1 ? '#22c55e' : '#f59e0b' }}>
                          {isCompleted ? '✓' : isLocked ? '🔒' : t.difficulty === 1 ? '🌱' : '📈'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold truncate" style={{ color: isCompleted ? '#22c55e' : isLocked ? colors.textMuted : colors.text }}>{t.title}</p>
                          <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>{t.time} min · {(t.type || '').replace(/_/g, ' ')}{isLocked ? ' · Completar anterior primero' : ''}</p>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: isCompleted ? '#22c55e' : isLocked ? '#64748b' : colors.primary, color: isCompleted || isLocked ? '#fff' : '#1B2632' }}>{isCompleted ? 'Hecho' : isLocked ? 'Bloqueado' : t.difficulty === 1 ? 'Fácil' : 'Medio'}</span>
                    </div>
                  );
                }) : tasks.map(t => (
                  <div key={t.id} data-task={t.id} className="px-4 py-3 flex items-center justify-between hover:opacity-80 transition cursor-pointer" onClick={() => startTask(t, true)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0" style={{ background: t.difficulty === 1 ? '#22c55e20' : '#f59e0b20', color: t.difficulty === 1 ? '#22c55e' : '#f59e0b' }}>{t.difficulty === 1 ? '🌱' : '📈'}</div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: colors.text }}>{t.title}</p>
                        <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>{t.time} min · {(t.type || '').replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: colors.primary, color: '#1B2632' }}>{t.difficulty === 1 ? 'Fácil' : 'Medio'}</span>
                  </div>
                ))}
              </div>
            </div>
            {loading && (
              <div className="px-4 py-3">
                <div className="animate-pulse space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: colors.cardBg }}>
                      <div className="w-7 h-7 rounded-full" style={{ background: colors.border }} />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-3/4 rounded" style={{ background: colors.border }} />
                        <div className="h-1.5 w-1/2 rounded" style={{ background: colors.border }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {screen === 'banking' && <div className="animate-slide-in h-full"><BankingPortal theme={theme} onClose={() => setScreen('desktop')} /></div>}
        {screen === 'emailInbox' && <div className="animate-slide-in h-full"><EmailInbox theme={theme} tasks={tasks} onSelectTask={openTaskFromEmail} onBack={() => setScreen('desktop')} specialty={specialty} /></div>}
        {screen === 'calendar' && <div className="animate-slide-in h-full"><CalendarWidget theme={theme} tasks={tasks} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'calculadora' && <div className="animate-slide-in h-full"><Calculator theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'spreadsheet' && <div className="animate-slide-in h-full"><SpreadsheetSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'accounting' && <div className="animate-slide-in h-full"><AccountingSystem theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'dashboard' && <div className="animate-slide-in h-full"><Dashboard theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'progress' && <div className="animate-slide-in h-full"><ProgressDashboard theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'pipeline' && <div className="animate-slide-in h-full"><PipelineSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'dbt' && <div className="animate-slide-in h-full"><DBTSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'catalog' && <div className="animate-slide-in h-full"><CatalogSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'notebook' && <div className="animate-slide-in h-full"><NotebookSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'airflow' && <div className="animate-slide-in h-full"><AirflowSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'cloud' && <div className="animate-slide-in h-full"><CloudSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'git' && <div className="animate-slide-in h-full"><GitSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'bi' && <div className="animate-slide-in h-full"><BiSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'capstone' && <div className="animate-slide-in h-full"><CapstoneSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'api' && <div className="animate-slide-in h-full"><ApiClientSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'dataops' && <div className="animate-slide-in h-full"><DataOpsSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'learning' && <div className="animate-slide-in h-full"><LearningSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'stats' && <div className="animate-slide-in h-full"><StatsSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'ml' && <div className="animate-slide-in h-full"><MLSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'routes' && careerPath && (
          <div className="animate-slide-in h-full"><RoutesPanel careerPath={careerPath} onClose={() => setShowRoutes(false)} onChoose={chooseBranch} onToggleDemo={toggleDemoOverride} theme={theme} /></div>
        )}
        {screen === 'cv' && <div className="animate-slide-in h-full"><CvBuilderSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'interview' && <div className="animate-slide-in h-full"><InterviewSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'chronicle' && <div className="animate-slide-in h-full"><ChronicleSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'vacancies' && <div className="animate-slide-in h-full"><VacancyTracker theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'careercenter' && <div className="animate-slide-in h-full"><CareerCenter theme={theme} onBack={() => setScreen('desktop')} onOpenTool={(tool) => { prevScreen.current = 'careercenter'; setScreen(tool as Screen); }} /></div>}
        {screen === 'practicas' && <div className="animate-slide-in h-full"><PracticasModules theme={theme} onBack={() => setScreen('desktop')} onOpenTask={(type) => { const t = tasks.find(t => t.type === type); if (t) startTask(t, true); }} /></div>}
        {screen === 'practicasTracker' && <div className="animate-slide-in h-full"><PracticasModules theme={theme} onBack={() => setScreen('desktop')} onOpenTask={(type) => { const t = tasks.find(t => t.type === type); if (t) startTask(t, true); }} initialTab="tracker" /></div>}
        {screen === 'practicasCurso' && <div className="animate-slide-in h-full"><PracticasModules theme={theme} onBack={() => setScreen('desktop')} onOpenTask={(type) => { const t = tasks.find(t => t.type === type); if (t) startTask(t, true); }} initialTab="curso" /></div>}
        {screen === 'sql' && <div className="animate-slide-in h-full"><SQLSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'warehouse' && <div className="animate-slide-in h-full"><WarehouseSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'monitor' && <div className="animate-slide-in h-full"><MonitorSim theme={theme} onBack={() => setScreen('desktop')} /></div>}
        {screen === 'archivo' && (
          <div className="animate-slide-in h-full flex flex-col">
            <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
              <button onClick={() => setScreen('desktop')} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
              <span className="text-base">📁</span>
              <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Archivo</span>
              <span className="text-[11px] font-mono ml-auto" style={{ color: colors.textMuted }}>{tasks.length} documentos</span>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {tasks.length === 0 ? <p className="text-[13px] text-center py-8" style={{ color: colors.textMuted }}>No hay documentos</p> : tasks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <span className="text-lg">{i % 3 === 0 ? '📄' : i % 3 === 1 ? '📊' : '📑'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate" style={{ color: colors.text }}>{t.title}</p>
                    <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>{(t.type || '').replace(/_/g, ' ')} · {t.time}min · Pendiente</p>
                  </div>
                  <button onClick={() => startTask(t, true)} className="text-[11px] px-2 py-1 rounded-lg border-2 font-bold cursor-pointer shrink-0" style={{ borderColor: colors.primary, color: colors.primary }}>Abrir</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {screen === 'workflow' && (
          <div className="h-full overflow-y-auto animate-slide-in">
            {workflow && (<>
              {workflow.isTrap && (
                <div className="px-4 py-2 border-b-2 text-[12px] font-bold font-mono animate-slide-in" style={{ borderColor: '#f59e0b', background: '#f59e0b20', color: '#f59e0b' }}>
                  ⚠ Tarea con posible error: {workflow.trapDescription || 'revisa el documento con atención'}
                </div>
              )}
              <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0 sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: colors.border, background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)' }}>
                <button onClick={closeWorkflow} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {workflow.steps.map((_: any, i: number) => (
                    _.type !== 'email' || !workflow._skipEmail ? (
                      <div key={i} className="flex items-center gap-1.5 flex-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: i < stepIdx ? '#22c55e' : i === stepIdx ? colors.primary : colors.bg, color: i <= stepIdx ? '#1B2632' : colors.textMuted, border: `1.5px solid ${i <= stepIdx ? 'transparent' : colors.border}` }}>{i < stepIdx ? '✓' : i + 1}</div>
                        {i < workflow.steps.length - 1 && <div className="flex-1 h-0.5 rounded" style={{ background: i < stepIdx ? '#22c55e' : colors.bg }} />}
                      </div>
                    ) : null
                  ))}
                </div>
                <span className="text-[11px] font-mono" style={{ color: colors.textMuted }}>{stepIdx + 1}/{workflow.steps.length}</span>
              </div>
              {workflow.steps[stepIdx].type === 'email' && <EmailClient email={workflow.steps[stepIdx].data} onContinue={() => setStepIdx(stepIdx + 1)} theme={theme} />}
              {workflow.steps[stepIdx].type === 'tool' && (
                <div className="h-full flex flex-col animate-slide-in">
                  <div className="px-4 py-2 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                    <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>🔧 {workflow.steps[stepIdx].title}</span>
                    <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>herramienta real · contexto de la tarea</span>
                  </div>
                  <div className="flex-1 overflow-hidden" style={{ background: colors.bg }}>
                    {renderTool(workflow.steps[stepIdx].data?.app, theme)}
                  </div>
                  <div className="px-4 py-3 border-t-2 shrink-0 flex items-center justify-between gap-3" style={{ borderColor: colors.border, background: colors.cardBg }}>
                    <span className="text-[9px] leading-tight" style={{ color: colors.textMuted }}>💡 {workflow.steps[stepIdx].description || 'Usa esta herramienta para resolver la tarea.'}</span>
                    <button onClick={() => setStepIdx(stepIdx + 1)} className="px-5 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition shrink-0" style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632', boxShadow: `2px 2px 0px 0px ${colors.border}` }}>✅ He terminado — ir a la respuesta</button>
                  </div>
                </div>
              )}
              {workflow.steps[stepIdx].type === 'form' && <AccountingForm formData={workflow.steps[stepIdx].data} onSubmit={handleFormSubmit} theme={theme} loading={loading} />}
              {workflow.steps[stepIdx].type === 'spreadsheet' && <SpreadsheetWidget rows={workflow.steps[stepIdx].data.rows} onSubmit={handleSpreadsheetSubmit} theme={theme} title={workflow.steps[stepIdx].title} loading={loading} />}
              {workflow.steps[stepIdx].type === 'result' && <ResultView data={workflow.steps[stepIdx].data} validation={validationResult} taskTitle={currentTask?.title || ''} onFinish={closeWorkflow} theme={theme} />}
              {workflow.steps[stepIdx].guides && workflow.steps[stepIdx].guides.length > 0 && (
                <GuideBubbles guides={workflow.steps[stepIdx].guides} theme={theme} />
              )}
              {showMatcher && matcherData && (
                <PaymentMatcher
                  theme={theme}
                  clientName={matcherData.clientName}
                  amount={matcherData.amount}
                  onMatchConfirmed={() => { setShowMatcher(false); setMatcherData(null); if (onTaskComplete) onTaskComplete(); }}
                  onSkip={() => { setShowMatcher(false); setMatcherData(null); if (onTaskComplete) onTaskComplete(); }}
                />
              )}
            </>)}
          </div>
        )}
      </div>
      {isPracticas && <Glossary theme={theme} />}
    </div>
  );
}

function renderTool(app: string, theme: Theme) {
  const noop = () => {};
  switch (app) {
    case 'sql': return <SQLSim theme={theme} onBack={noop} />;
    case 'notebook': return <NotebookSim theme={theme} onBack={noop} />;
    case 'git': return <GitSim theme={theme} onBack={noop} />;
    case 'airflow': return <AirflowSim theme={theme} onBack={noop} />;
    case 'catalog': return <CatalogSim theme={theme} onBack={noop} />;
    case 'bi': return <BiSim theme={theme} onBack={noop} />;
    case 'warehouse': return <WarehouseSim theme={theme} onBack={noop} />;
    case 'pipeline': return <PipelineSim theme={theme} onBack={noop} />;
    default: return <div className="p-6 text-xs font-mono" style={{ color: '#64748b' }}>Herramienta no disponible: {app}</div>;
  }
}

// ─── Jornada guiada (especialidad Data) ────────────────────────
// Franjas del rol según la fase del árbol de rutas (analista / ing / ciencia).

const DE_SLOTS: Record<string, string> = {
  incident_recovery: '09:30',   // monitoreo matutino: detectar el incidente
  sql_query: '10:00',           // desarrollo de transforms
  etl_pipeline: '10:30',
  data_quality: '11:00',
  ontology_modeling: '13:00',   // modelado / documentación
  code_review: '13:30',         // code reviews
  airflow_dag: '14:00',         // orquestación
  soporte_datos: '14:30',       // soporte a analistas
};

const ANALYST_SLOTS: Record<string, string> = {
  sql_query: '10:00',           // SQL exploratorio
  data_quality: '11:00',        // alerta de calidad
  soporte_datos: '14:30',
};

const DS_SLOTS: Record<string, string> = {
  eda_churn: '10:00',           // EDA
  modelo_baseline: '10:30',     // entrenamiento
  eval_metricas: '11:00',       // evaluación
  data_quality: '11:30',
};

interface AgendaBlock {
  h: string;
  label: string;
  task?: TaskInfo;
  action?: 'learning';
}

function buildAgendaDE(tasks: TaskInfo[], phase: 'analyst' | 'engineering' | 'science'): AgendaBlock[] {
  const slots = phase === 'science' ? DS_SLOTS : phase === 'engineering' ? DE_SLOTS : ANALYST_SLOTS;
  const taskBlocks: AgendaBlock[] = tasks.map(t => ({ h: slots[t.type] || '10:00', label: t.title, task: t }))
    .sort((a, b) => a.h.localeCompare(b.h));
  const between = (from: string, to: string) => taskBlocks.filter(b => b.h >= from && b.h < to);
  if (phase === 'analyst') {
    return [
      { h: '09:00', label: '☕ Standup diario con el equipo' },
      { h: '09:30', label: '🔎 Revisar calidad y alertas' },
      ...between('09:30', '12:00'),
      { h: '12:00', label: '🍽️ Almuerzo' },
      ...between('12:00', '16:00'),
      { h: '16:00', label: '📚 Aprendizaje (Foundry Academy / cloud)', action: 'learning' },
      { h: '17:30', label: '✅ Revisión final y cierre de tareas' },
    ];
  }
  if (phase === 'science') {
    return [
      { h: '09:00', label: '☕ Standup diario con el equipo' },
      { h: '09:30', label: '🔎 Revisar datos del caso churn' },
      ...between('09:30', '12:00'),
      { h: '12:00', label: '🍽️ Almuerzo' },
      ...between('12:00', '16:00'),
      { h: '16:00', label: '📚 Aprendizaje (ML / experimentos)', action: 'learning' },
      { h: '17:30', label: '✅ Revisión final y cierre de tareas' },
    ];
  }
  return [
    { h: '09:00', label: '☕ Standup diario con el equipo' },
    { h: '09:30', label: '🔎 Revisar ejecuciones de pipelines y alertas' },
    ...between('09:30', '12:00'),
    { h: '12:00', label: '🍽️ Almuerzo' },
    ...between('12:00', '16:00'),
    { h: '16:00', label: '📚 Aprendizaje (Foundry Academy / cloud)', action: 'learning' },
    { h: '17:30', label: '✅ Revisión final y cierre de tareas' },
  ];
}

function AgendaDelDia({ tasks, onOpen, onOpenLearning, theme, phase = 'engineering' }: { tasks: TaskInfo[]; onOpen: (t: TaskInfo, skip?: boolean) => void; onOpenLearning: () => void; theme: Theme; phase?: 'analyst' | 'engineering' | 'science' }) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const blocks = buildAgendaDE(tasks, phase);
  const now = new Date();
  const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const activeIdx = blocks.findIndex((b, i) => b.h <= nowHM && (i + 1 >= blocks.length || blocks[i + 1].h > nowHM));
  const inRange = nowHM >= '09:00' && nowHM <= '18:00';
  const phaseLabel = phase === 'engineering' ? 'ingeniero de datos jr' : phase === 'science' ? 'científico de datos jr' : 'analista de datos';

  return (
    <div className="rounded-xl border-2 overflow-hidden mb-4" style={{ borderColor: colors.border }}>
      <div className="px-4 py-2 border-b-2 text-[13px] font-bold font-mono flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg, color: colors.text }}>
        📅 Agenda del día
        <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>{phaseLabel}</span>
      </div>
      <div className="px-4 py-2 space-y-0.5 max-h-64 overflow-auto">
        {blocks.map((b, i) => {
          const isActive = inRange && i === activeIdx;
          const isDone = inRange && i < activeIdx;
          const clickable = b.task || b.action;
          return (
            <div key={i} className={`flex items-center gap-3 px-2 py-1 rounded-lg ${clickable ? 'cursor-pointer hover:opacity-80' : ''}`}
              style={{ background: isActive ? colors.primary + '15' : 'transparent', borderLeft: `3px solid ${isActive ? colors.primary : 'transparent'}` }}
              onClick={clickable ? () => (b.task ? onOpen(b.task!, true) : onOpenLearning()) : undefined}>
              <span className="text-[10px] font-mono font-bold w-9 shrink-0" style={{ color: isActive ? colors.primary : colors.textMuted }}>{b.h}</span>
              <span className={`text-[11px] font-mono truncate ${isDone ? 'line-through opacity-50' : ''}`} style={{ color: b.task ? colors.text : colors.textMuted }}>{b.label}</span>
              {b.task && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0" style={{ background: colors.primary + '20', color: colors.primary }}>{b.task.time}min</span>}
              {b.action && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>abrir</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultView({ data, validation, taskTitle, onFinish, theme }: { data: any; validation: any; taskTitle: string; onFinish: () => void; theme: Theme; }) {
  const colors = themeColors[theme];
  return (
    <div className="p-5 space-y-5">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: validation?.passed ? '#22c55e20' : '#f59e0b20', border: `3px solid ${validation?.passed ? '#22c55e' : '#f59e0b'}` }}>{validation?.passed ? '✅' : '⚠️'}</div>
        <h2 className="text-sm font-bold" style={{ color: validation?.passed ? '#22c55e' : '#f59e0b' }}>{validation?.passed ? '¡Tarea completada!' : 'Completada con observaciones'}</h2>
        <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>{taskTitle}</p>
      </div>
      {validation && (
        <div className="p-4 rounded-xl border-2 text-center" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <p className="text-2xl font-bold" style={{ color: colors.primary }}>{validation.totalScore}/{validation.maxPossible}</p>
          <p className="text-[11px] font-mono mt-1" style={{ color: colors.textMuted }}>{validation.scorePct}% · {validation.passed ? 'Aprobado' : 'Necesitas mejorar'}</p>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${validation.scorePct}%`, background: validation.passed ? '#22c55e' : '#f59e0b' }} /></div>
        </div>
      )}
      <button onClick={onFinish} className="w-full py-3 rounded-xl border-2 text-xs font-bold cursor-pointer hover:opacity-85 transition" style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632', boxShadow: `3px 3px 0px 0px ${colors.border}` }}>📋 Volver al escritorio</button>
    </div>
  );
}

// ─── Panel de Rutas (Árbol Analista → Ingeniería/Ciencia) ─────

function RoutesPanel({ careerPath, onClose, onChoose, onToggleDemo, theme }: {
  careerPath: CareerPathState;
  onClose: () => void;
  onChoose: (branch: 'data_engineering' | 'data_science') => void;
  onToggleDemo: (enabled: boolean) => void;
  theme: Theme;
}) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const { practicePct, unlocked, chosenBranch, demoOverride, breakdown } = careerPath;
  const demo = demoOverride?.enabled;

  const nodes: { id: string; label: string; icon: string; desc: string; state: 'current' | 'unlocked' | 'locked' | 'chosen' }[] = [
    { id: 'analyst', label: 'Analista de Datos', icon: '🧭', desc: 'SQL, profiling, reportes y calidad', state: 'current' },
    { id: 'data_engineering', label: 'Ingeniería de Datos', icon: '🔀', desc: 'Pipelines, dbt, Airflow, Foundry', state: chosenBranch === 'data_engineering' ? 'chosen' : unlocked.data_engineering ? 'unlocked' : 'locked' },
    { id: 'data_science', label: 'Ciencia de Datos', icon: '🧪', desc: 'EDA, modelos, experimentos, churn', state: chosenBranch === 'data_science' ? 'chosen' : unlocked.data_science ? 'unlocked' : 'locked' },
  ];

  const pendingTasks = breakdown ? Math.max(0, breakdown.tasks.total - breakdown.tasks.done) : 0;
  const pendingSims = breakdown ? Math.max(0, breakdown.sims.total - breakdown.sims.validated) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden animate-slide-in" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
        <button onClick={onClose} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🧭</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Árbol de Rutas · Especialidad Data</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: '#f59e0b20', color: '#f59e0b' }}>DEMO: no afecta progreso</span>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {/* Progreso */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase" style={{ color: colors.textMuted }}>Práctica acumulada</span>
            <span className="text-sm font-bold font-mono" style={{ color: practicePct >= 40 ? '#22c55e' : colors.primary }}>{practicePct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(practicePct, 100)}%`, background: practicePct >= 40 ? '#22c55e' : colors.primary }} />
          </div>
          <div className="flex gap-4 mt-2 text-[9px] font-mono" style={{ color: colors.textMuted }}>
            <span>tareas {breakdown ? `${breakdown.tasks.done}/${breakdown.tasks.total}` : '0/12'}</span>
            <span>sims {breakdown ? `${breakdown.sims.validated}/${breakdown.sims.total}` : '0/8'}</span>
            <span>casos {breakdown ? `${breakdown.cases.done}/${breakdown.cases.total}` : '0/3'}</span>
            <span>desbloqueo ≥ 40%</span>
          </div>
          {practicePct < 40 && !demo && (
            <p className="text-[10px] mt-2 px-3 py-2 rounded-lg" style={{ background: '#f59e0b10', color: '#f59e0b' }}>
              Te faltan {pendingTasks} tarea{pendingTasks !== 1 ? 's' : ''} y {pendingSims} simulación{pendingSims !== 1 ? 'es' : ''} para desbloquear las rutas.
            </p>
          )}
          {demo && <p className="text-[10px] mt-2 px-3 py-2 rounded-lg" style={{ background: '#f59e0b20', color: '#f59e0b' }}>⚠ Atajo DEMO activo: rutas desbloqueadas en vista. No modifica tu progreso real.</p>}
        </div>

        {/* Nodos */}
        <div className="space-y-3">
          {nodes.map((n, i) => (
            <div key={n.id} className="flex items-center gap-3">
              <div className="flex-1 p-3 rounded-xl border-2" style={{
                borderColor: n.state === 'current' ? colors.primary : n.state === 'chosen' ? '#8b5cf6' : n.state === 'unlocked' ? '#22c55e' : colors.border,
                background: n.state === 'unlocked' || n.state === 'chosen' ? (n.state === 'chosen' ? '#8b5cf615' : '#22c55e10') : colors.cardBg,
              }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{n.icon}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>{n.label}</span>
                  {n.state === 'current' && <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: colors.primary + '25', color: colors.primary }}>actual</span>}
                  {n.state === 'chosen' && <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: '#8b5cf625', color: '#8b5cf6' }}>elegida</span>}
                  {n.state === 'unlocked' && <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: '#22c55e20', color: '#22c55e' }}>desbloqueada</span>}
                  {n.state === 'locked' && <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.textMuted }}>bloqueada</span>}
                  {n.id !== 'analyst' && (n.state === 'unlocked' || demo) && chosenBranch === null && (
                    <button onClick={() => onChoose(n.id as 'data_engineering' | 'data_science')} className="ml-auto text-[9px] font-bold px-2.5 py-1 rounded-lg border-2 cursor-pointer" style={{ borderColor: '#8b5cf6', background: '#8b5cf6', color: '#fff' }}>Elegir ruta</button>
                  )}
                </div>
                <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>{n.desc}</p>
              </div>
              {i < nodes.length - 1 && <span className="text-slate-500 text-[10px]">▼</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
