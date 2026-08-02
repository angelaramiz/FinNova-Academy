import { useState } from 'react';
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
import { apiFetch } from '../lib/api';

interface TaskInfo { id: string; title: string; type: string; difficulty: number; time: number; }
async function apiPost(path: string, body?: any) { return apiFetch(path, { method: body ? 'POST' : 'GET', ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) }); }

interface DesktopShellProps { theme: Theme; tasks: TaskInfo[]; onClose: () => void; onTaskComplete?: () => void; }
type Screen = 'desktop' | 'workflow' | 'banking' | 'emailInbox' | 'calendar' | 'calculadora' | 'archivo' | 'spreadsheet' | 'accounting' | 'dashboard';

export default function DesktopShell({ theme, tasks, onClose, onTaskComplete }: DesktopShellProps) {
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
  const [matcherData, setMatcherData] = useState<{ clientName: string; amount: number } | null>(null);

  async function startTask(task: TaskInfo, skipEmailStep = false) {
    setCurrentTask(task); setLoading(true);
    try {
      const wf: any = await apiPost(`/api/workflows/${task.type}`);
      setWorkflow(wf);
      const firstContentStep = wf.steps.findIndex((s: any) => s.type !== 'email');
      setStepIdx(skipEmailStep ? firstContentStep : 0);
      setValidationResult(null);
      setScreen('workflow');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleFormSubmit(answers: Record<string, any>) {
    if (!currentTask || !workflow) return; setLoading(true);
    try {
      const result = await apiPost('/api/workflows/validate', { taskType: currentTask.type, answers });
      setValidationResult(result);
      setStepIdx(workflow.steps.length - 1);
      await apiPost(`/api/sim/tasks/${currentTask.id}/complete`, {});
      // Auto-generar asientos contables según el tipo de tarea
      generateEntriesForTask(currentTask.type, answers);
      // Si es tarea de pago, mostrar matcher
      if (currentTask.type === 'payment_registration' && answers.clientName && answers.amountReceived) {
        setMatcherData({ clientName: answers.clientName, amount: Number(answers.amountReceived) });
        setShowMatcher(true);
        setLoading(false);
        return;
      }
      if (onTaskComplete) onTaskComplete();
    } catch (e) { console.error(e); }
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
      apiPost('/api/sim/generate-entries', { type: entryType, data });
    } catch (e) { console.error(e); }
  }

  async function handleSpreadsheetSubmit(answers: Record<string, any>) { await handleFormSubmit(answers); }

  function closeWorkflow() { setScreen('desktop'); setCurrentTask(null); setWorkflow(null); setStepIdx(0); setValidationResult(null); }
  function openTaskFromEmail(taskId: string) { const task = tasks.find(t => t.id === taskId); if (task) startTask(task, true); }

  const appIcons = [
    { label: 'Tareas', icon: '📋', count: tasks.length, action: () => {} },
    { label: 'Correo', icon: '📧', count: tasks.length, action: () => setScreen('emailInbox') },
    { label: 'Contable', icon: '📊', action: () => setScreen('accounting') },
    { label: 'Excel', icon: '📈', action: () => setScreen('spreadsheet') },
    { label: 'Calendario', icon: '📅', action: () => setScreen('calendar') },
    { label: 'Banco', icon: '🏦', action: () => setScreen('banking') },
    { label: 'Calculadora', icon: '🧮', action: () => setScreen('calculadora') },
    { label: 'Archivo', icon: '📁', action: () => setScreen('archivo') },
    { label: 'Dashboard', icon: '📊', action: () => setScreen('dashboard') },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-3 border-b-2 flex items-center justify-between shrink-0" style={{ borderColor: colors.border, background: isDark ? '#1a1a2e' : '#e5e7eb', height: collapsed ? '26px' : '34px' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(!collapsed)} className="text-[8px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>{collapsed ? '▶' : '◀'}</button>
          {!collapsed && <span className="text-[9px] font-bold font-mono" style={{ color: colors.text }}>Escritorio de Trabajo</span>}
        </div>
        <div className="flex items-center gap-2.5 text-[7px] font-mono" style={{ color: colors.textMuted }}>
          {!collapsed && <span>{new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          <button onClick={onClose} className="w-4 h-4 rounded flex items-center justify-center text-[8px] cursor-pointer hover:opacity-70" style={{ background: '#ef4444', color: '#fff' }}>✕</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ background: colors.bg }}>
        {screen === 'desktop' && (
          <div className="h-full p-4 overflow-auto">
            <div className="flex gap-5 mb-6 flex-wrap">
              {appIcons.map((app, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 w-14 cursor-pointer hover:opacity-80 transition" onClick={app.action}>
                  <div className="w-12 h-12 rounded-xl border-2 flex items-center justify-center text-base" style={{ borderColor: colors.border, background: colors.cardBg, boxShadow: `2px 2px 0px 0px ${colors.border}` }}>{app.icon}</div>
                  <span className="text-[8px] font-bold font-mono text-center leading-tight" style={{ color: colors.text }}>{app.label}{app.count && app.count > 0 && app.label !== 'Tareas' ? <span className="ml-0.5" style={{ color: colors.primary }}>({app.count})</span> : null}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: colors.border }}>
              <div className="px-4 py-2 border-b-2 text-[10px] font-bold font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg, color: colors.text }}>📋 Pendientes del día</div>
              <div className="divide-y" style={{ borderColor: colors.border + '40' }}>
                {tasks.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between hover:opacity-80 transition cursor-pointer" onClick={() => startTask(t, true)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: t.difficulty === 1 ? '#22c55e20' : '#f59e0b20', color: t.difficulty === 1 ? '#22c55e' : '#f59e0b' }}>{t.difficulty === 1 ? '🌱' : '📈'}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{t.title}</p>
                        <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{t.time} min · {(t.type || '').replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <span className="text-[8px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: colors.primary, color: '#1B2632' }}>{t.difficulty === 1 ? 'Fácil' : 'Medio'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {screen === 'banking' && <BankingPortal theme={theme} onClose={() => setScreen('desktop')} />}
        {screen === 'emailInbox' && <EmailInbox theme={theme} tasks={tasks} onSelectTask={openTaskFromEmail} onBack={() => setScreen('desktop')} />}
        {screen === 'calendar' && <CalendarWidget theme={theme} tasks={tasks} onBack={() => setScreen('desktop')} />}
        {screen === 'calculadora' && <Calculator theme={theme} onBack={() => setScreen('desktop')} />}
        {screen === 'spreadsheet' && <SpreadsheetSim theme={theme} onBack={() => setScreen('desktop')} />}
        {screen === 'accounting' && <AccountingSystem theme={theme} onBack={() => setScreen('desktop')} />}
        {screen === 'dashboard' && <Dashboard theme={theme} onBack={() => setScreen('desktop')} />}
        {screen === 'archivo' && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
              <button onClick={() => setScreen('desktop')} className="text-[10px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
              <span className="text-base">📁</span>
              <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Archivo</span>
              <span className="text-[8px] font-mono ml-auto" style={{ color: colors.textMuted }}>{tasks.length} documentos</span>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {tasks.length === 0 ? <p className="text-[10px] text-center py-8" style={{ color: colors.textMuted }}>No hay documentos</p> : tasks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <span className="text-lg">{i % 3 === 0 ? '📄' : i % 3 === 1 ? '📊' : '📑'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{t.title}</p>
                    <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{(t.type || '').replace(/_/g, ' ')} · {t.time}min · Pendiente</p>
                  </div>
                  <button onClick={() => startTask(t, true)} className="text-[8px] px-2 py-1 rounded-lg border-2 font-bold cursor-pointer shrink-0" style={{ borderColor: colors.primary, color: colors.primary }}>Abrir</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {screen === 'workflow' && (
          <div className="h-full overflow-auto animate-slide-in">
            {workflow && (<>
              <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0 sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: colors.border, background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)' }}>
                <button onClick={closeWorkflow} className="text-[10px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {workflow.steps.map((_: any, i: number) => (
                    _.type !== 'email' || !workflow._skipEmail ? (
                      <div key={i} className="flex items-center gap-1.5 flex-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ background: i < stepIdx ? '#22c55e' : i === stepIdx ? colors.primary : colors.bg, color: i <= stepIdx ? '#1B2632' : colors.textMuted, border: `1.5px solid ${i <= stepIdx ? 'transparent' : colors.border}` }}>{i < stepIdx ? '✓' : i + 1}</div>
                        {i < workflow.steps.length - 1 && <div className="flex-1 h-0.5 rounded" style={{ background: i < stepIdx ? '#22c55e' : colors.bg }} />}
                      </div>
                    ) : null
                  ))}
                </div>
                <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{stepIdx + 1}/{workflow.steps.length}</span>
              </div>
              {workflow.steps[stepIdx].type === 'email' && <EmailClient email={workflow.steps[stepIdx].data} onContinue={() => setStepIdx(stepIdx + 1)} theme={theme} />}
              {workflow.steps[stepIdx].type === 'form' && <AccountingForm formData={workflow.steps[stepIdx].data} onSubmit={handleFormSubmit} theme={theme} loading={loading} />}
              {workflow.steps[stepIdx].type === 'spreadsheet' && <SpreadsheetWidget rows={workflow.steps[stepIdx].data.rows} onSubmit={handleSpreadsheetSubmit} theme={theme} title={workflow.steps[stepIdx].title} loading={loading} />}
              {workflow.steps[stepIdx].type === 'result' && <ResultView data={workflow.steps[stepIdx].data} validation={validationResult} taskTitle={currentTask?.title || ''} onFinish={closeWorkflow} theme={theme} />}
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
        <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>{taskTitle}</p>
      </div>
      {validation && (
        <div className="p-4 rounded-xl border-2 text-center" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <p className="text-2xl font-bold" style={{ color: colors.primary }}>{validation.totalScore}/{validation.maxPossible}</p>
          <p className="text-[8px] font-mono mt-1" style={{ color: colors.textMuted }}>{validation.scorePct}% · {validation.passed ? 'Aprobado' : 'Necesitas mejorar'}</p>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${validation.scorePct}%`, background: validation.passed ? '#22c55e' : '#f59e0b' }} /></div>
        </div>
      )}
      <button onClick={onFinish} className="w-full py-3 rounded-xl border-2 text-xs font-bold cursor-pointer hover:opacity-85 transition" style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632', boxShadow: `3px 3px 0px 0px ${colors.border}` }}>📋 Volver al escritorio</button>
    </div>
  );
}
