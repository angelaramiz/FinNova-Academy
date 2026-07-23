import { useState, useEffect, useCallback } from 'react';
import { themeColors, Theme } from '../lib/theme';
import EmailClient from './EmailClient';
import AccountingForm from './AccountingForm';
import SpreadsheetWidget from './SpreadsheetWidget';
import BankingPortal from './BankingPortal';
import { apiFetch } from '../lib/api';

interface TaskInfo { id: string; title: string; type: string; difficulty: number; time: number; }

function getToken() { return localStorage.getItem('supabase_auth_token') || ''; }

async function apiPost(path: string, body?: any) {
  return apiFetch(path, {
    method: body ? 'POST' : 'GET',
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

interface DesktopShellProps {
  theme: Theme;
  tasks: TaskInfo[];
  onClose: () => void;
  onTaskComplete?: () => void;
}

type Screen = 'desktop' | 'workflow' | 'banking';

export default function DesktopShell({ theme, tasks, onClose, onTaskComplete }: DesktopShellProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [screen, setScreen] = useState<Screen>('desktop');
  const [currentTask, setCurrentTask] = useState<TaskInfo | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [stepTransition, setStepTransition] = useState(false);

  async function startTask(task: TaskInfo) {
    setCurrentTask(task);
    setLoading(true);
    try {
      const wf = await apiPost(`/api/workflows/${task.type}`);
      setWorkflow(wf);
      setStepIdx(0);
      setValidationResult(null);
      setScreen('workflow');
    } catch (e) { console.error('Error loading workflow:', e); }
    setLoading(false);
  }

  async function handleFormSubmit(answers: Record<string, any>) {
    if (!currentTask || !workflow) return;
    setLoading(true);
    try {
      const result = await apiPost('/api/workflows/validate', { taskType: currentTask.type, answers });
      setValidationResult(result);
      // Go to result step (last step)
      setStepIdx(workflow.steps.length - 1);
      // Save stats
      await fetch(`/api/sim/tasks/${currentTask.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      if (onTaskComplete) onTaskComplete();
    } catch (e) { console.error('Validation error:', e); }
    setLoading(false);
  }

  async function handleSpreadsheetSubmit(answers: Record<string, any>) {
    await handleFormSubmit(answers);
  }

  function closeWorkflow() {
    setScreen('desktop');
    setCurrentTask(null);
    setWorkflow(null);
    setStepIdx(0);
    setValidationResult(null);
  }

  const appIcons = [
    { label: 'Tareas', icon: '📋', count: tasks.filter(t => t.type !== '').length },
    { label: 'Correo', icon: '📧', count: 1 },
    { label: 'Contable', icon: '📊' },
    { label: 'Banco', icon: '🏦' },
    { label: 'Archivo', icon: '📁' },
    { label: 'Calculadora', icon: '🧮' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Taskbar */}
      <div className="px-3 py-2 border-b-2 flex items-center justify-between shrink-0" style={{
        borderColor: colors.border,
        background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
      }}>
        <div className="flex items-center gap-2">
          <span className="text-xs">🪟</span>
          <span className="text-[9px] font-bold font-mono" style={{ color: colors.text }}>Escritorio</span>
        </div>
        <div className="flex items-center gap-2.5 text-[8px] font-mono" style={{ color: colors.textMuted }}>
          <span>{new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={onClose} className="w-5 h-5 rounded flex items-center justify-center text-[9px] cursor-pointer hover:opacity-70"
            style={{ background: '#ef4444', color: '#fff' }}>✕</button>
        </div>
      </div>

      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {screen === 'desktop' ? (
          <div className="h-full p-6 overflow-auto">
            {/* App icons */}
            <div className="flex gap-6 mb-8">
              {appIcons.map((app, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 w-16 cursor-pointer hover:opacity-80 transition" onClick={() => {
                  if (app.label === 'Tareas' || app.label === 'Correo') {
                    if (tasks.length > 0) startTask(tasks[0]);
                  } else if (app.label === 'Banco') {
                    setScreen('banking');
                  }
                }}>
                  <div className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-lg"
                    style={{ borderColor: colors.border, background: colors.cardBg, boxShadow: `3px 3px 0px 0px ${colors.border}` }}>
                    {app.icon}
                  </div>
                  <span className="text-[8px] font-bold font-mono text-center leading-tight" style={{ color: colors.text }}>
                    {app.label}
                    {app.count && <span className="ml-0.5" style={{ color: colors.primary }}>({app.count})</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* Task list */}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: colors.border }}>
              <div className="px-4 py-2.5 border-b-2 text-[10px] font-bold font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg, color: colors.text }}>
                📋 Pendientes del día
              </div>
              <div className="divide-y" style={{ borderColor: colors.border + '40' }}>
                {tasks.map((t, i) => (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between hover:opacity-80 transition cursor-pointer" onClick={() => startTask(t)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{
                        background: t.difficulty === 1 ? '#22c55e20' : '#f59e0b20',
                        color: t.difficulty === 1 ? '#22c55e' : '#f59e0b',
                      }}>{t.difficulty === 1 ? '🌱' : '📈'}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{t.title}</p>
                        <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{t.time} min · {t.type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <span className="text-[8px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: colors.primary, color: '#1B2632' }}>
                      {t.difficulty === 1 ? 'Fácil' : 'Medio'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : screen === 'banking' ? (
          <BankingPortal theme={theme} onClose={() => setScreen('desktop')} />
        ) : (
          /* Workflow step view */
          <div className="h-full overflow-auto animate-slide-in">
            {workflow && (
              <>
                {/* Step indicator */}
                <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0 sticky top-0 z-10 backdrop-blur-md" style={{
                  borderColor: colors.border, background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                }}>
                  <button onClick={closeWorkflow} className="text-[10px] px-2 py-1 rounded border cursor-pointer hover:opacity-70"
                    style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {workflow.steps.map((_: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 flex-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{
                          background: i < stepIdx ? '#22c55e' : i === stepIdx ? colors.primary : colors.bg,
                          color: i <= stepIdx ? '#1B2632' : colors.textMuted,
                          border: `1.5px solid ${i <= stepIdx ? 'transparent' : colors.border}`,
                        }}>{i < stepIdx ? '✓' : i + 1}</div>
                        {i < workflow.steps.length - 1 && (
                          <div className="flex-1 h-0.5 rounded" style={{
                            background: i < stepIdx ? '#22c55e' : colors.bg,
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{stepIdx + 1}/{workflow.steps.length}</span>
                </div>

                {/* Step content */}
                {workflow.steps[stepIdx].type === 'email' && (
                  <EmailClient email={workflow.steps[stepIdx].data} onContinue={() => setStepIdx(stepIdx + 1)} theme={theme} />
                )}
                {workflow.steps[stepIdx].type === 'form' && (
                  <AccountingForm formData={workflow.steps[stepIdx].data} onSubmit={handleFormSubmit} theme={theme} loading={loading} />
                )}
                {workflow.steps[stepIdx].type === 'spreadsheet' && (
                  <SpreadsheetWidget
                    rows={workflow.steps[stepIdx].data.rows}
                    onSubmit={handleSpreadsheetSubmit}
                    theme={theme}
                    title={workflow.steps[stepIdx].title}
                    loading={loading}
                  />
                )}
                {workflow.steps[stepIdx].type === 'result' && (
                  <ResultView
                    data={workflow.steps[stepIdx].data}
                    validation={validationResult}
                    taskTitle={currentTask?.title || ''}
                    onFinish={closeWorkflow}
                    theme={theme}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RESULT VIEW ──────────────────────────────────────────────
function ResultView({ data, validation, taskTitle, onFinish, theme }: {
  data: any; validation: any; taskTitle: string; onFinish: () => void; theme: Theme;
}) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';

  return (
    <div className="p-5 space-y-5">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3" style={{
          background: validation?.passed ? '#22c55e20' : '#f59e0b20',
          border: `3px solid ${validation?.passed ? '#22c55e' : '#f59e0b'}`,
        }}>
          {validation?.passed ? '✅' : '⚠️'}
        </div>
        <h2 className="text-sm font-bold" style={{ color: validation?.passed ? '#22c55e' : '#f59e0b' }}>
          {validation?.passed ? '¡Tarea completada!' : 'Completada con observaciones'}
        </h2>
        <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>{taskTitle}</p>
      </div>

      {/* Score */}
      {validation && (
        <div className="p-4 rounded-xl border-2 text-center" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <p className="text-2xl font-bold" style={{ color: colors.primary }}>{validation.totalScore}/{validation.maxPossible}</p>
          <p className="text-[8px] font-mono mt-1" style={{ color: colors.textMuted }}>{validation.scorePct}% · {validation.passed ? 'Aprobado' : 'Necesitas mejorar'}</p>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${validation.scorePct}%`,
              background: validation.passed ? '#22c55e' : '#f59e0b',
            }} />
          </div>
        </div>
      )}

      {/* Validation details */}
      {validation?.results?.length > 0 && (
        <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: colors.border }}>
          <div className="px-4 py-2 border-b-2 text-[10px] font-bold font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg, color: colors.text }}>
            📋 Detalle de la evaluación
          </div>
          <div className="divide-y" style={{ borderColor: colors.border + '40' }}>
            {validation.results.map((r: any, i: number) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">{r.passed ? '✅' : '❌'}</span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold" style={{ color: colors.text }}>{r.label}</p>
                    <p className="text-[8px]" style={{ color: colors.textMuted }}>
                      {r.passed ? r.feedback : r.feedback}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold shrink-0 ml-2" style={{ color: r.passed ? '#22c55e' : '#ef4444' }}>
                  {r.points}/{r.maxPoints}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated document summary */}
      {data && (
        <div className="p-4 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <p className="text-[10px] font-bold mb-2" style={{ color: colors.text }}>📄 Documento generado</p>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            {Object.entries(data).filter(([k]) => !['cfdiUse', 'paymentMethod'].includes(k)).map(([key, val]) => (
              <div key={key}>
                <span className="font-mono" style={{ color: colors.textMuted }}>{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                <span className="font-bold" style={{ color: colors.text }}>{typeof val === 'number' ? `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onFinish}
        className="w-full py-3 rounded-xl border-2 text-xs font-bold cursor-pointer hover:opacity-85 transition"
        style={{
          borderColor: colors.primary, background: colors.primary, color: '#1B2632',
          boxShadow: `3px 3px 0px 0px ${colors.border}`,
        }}
      >📋 Volver al escritorio</button>
    </div>
  );
}
