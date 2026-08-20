import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';
import PracticasCurso from './PracticasCurso';
import PracticasTracker from './PracticasTracker';

interface PracticaPaso {
  id: string;
  titulo: string;
  tipo: 'guia' | 'tarea' | 'asiento';
  descripcion: string;
  taskType?: string;
  datos?: string[];
  asiento?: { cargo: string; abono: string; cuentas: string; concepto: string };
}

interface PracticaPregunta {
  q: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

interface PracticaPrueba {
  titulo: string;
  aprobarMin: number;
  preguntas: PracticaPregunta[];
}

interface PracticaCurso {
  id: string;
  titulo: string;
  npc: string;
  introduccion: string;
  secciones: { titulo: string; texto: string; puntos?: string[] }[];
  cierre: string;
}

interface PracticaModulo {
  id: string;
  titulo: string;
  icono: string;
  descripcion: string;
  objetivo: string;
  semanas: string;
  skill: string;
  pasos: PracticaPaso[];
  prueba: PracticaPrueba;
  curso: PracticaCurso;
}

type Tab = 'modulos' | 'tracker' | 'curso';

interface PracticasModulesProps {
  theme: Theme;
  onBack: () => void;
  onOpenTask: (type: string) => void;
  initialTab?: Tab;
}

const PROGRESS_KEY = 'practicas_module_progress';
const PRUEBA_KEY = 'practicas_prueba_results';

function loadProgress(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

function loadPruebaResults(): Record<string, { scorePct: number; aprobado: boolean }> {
  try { return JSON.parse(localStorage.getItem(PRUEBA_KEY) || '{}'); } catch { return {}; }
}

export default function PracticasModules({ theme, onBack, onOpenTask, initialTab = 'modulos' }: PracticasModulesProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [modules, setModules] = useState<PracticaModulo[]>([]);
  const [active, setActive] = useState<PracticaModulo | null>(null);
  const [course, setCourse] = useState<PracticaCurso | null>(null);
  const [pruebaAnswers, setPruebaAnswers] = useState<Record<string, number>>({});
  const [pruebaResult, setPruebaResult] = useState<Record<string, { scorePct: number; aprobado: boolean }>>(loadPruebaResults());
  const [pruebaError, setPruebaError] = useState('');
  const [progress, setProgress] = useState<Record<string, string[]>>(loadProgress());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/sim/practicas/modules')
      .then((data: any) => { setModules(data.modules || []); setLoading(false); })
      .catch((e: any) => { setError(e.message || 'Error al cargar módulos'); setLoading(false); });
  }, []);

  function markDone(moduleId: string, pasoId: string) {
    const next = { ...progress, [moduleId]: [...(progress[moduleId] || []), pasoId] };
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  }

  function isDone(moduleId: string, pasoId: string) { return (progress[moduleId] || []).includes(pasoId); }
  function moduleDone(m: PracticaModulo) { return m.pasos.every(p => isDone(m.id, p.id)); }

  function openCourse(moduleId: string) {
    const m = modules.find(x => x.id === moduleId);
    if (m?.curso) { setCourse(m.curso); setTab('curso'); }
  }

  async function submitPrueba(moduleId: string) {
    setPruebaError('');
    const m = modules.find(x => x.id === moduleId);
    if (!m) return;
    const answers = m.prueba.preguntas.map((_, i) => pruebaAnswers[`${moduleId}-${i}`] ?? -1);
    if (answers.some(a => a < 0)) { setPruebaError('Responde todas las preguntas antes de enviar.'); return; }
    try {
      const data: any = await apiFetch(`/api/sim/practicas/prueba/${moduleId}`, { method: 'POST', body: JSON.stringify({ answers }) });
      const next = { ...pruebaResult, [moduleId]: { scorePct: data.scorePct, aprobado: data.aprobado } };
      setPruebaResult(next);
      localStorage.setItem(PRUEBA_KEY, JSON.stringify(next));
    } catch (e: any) { setPruebaError(e.message || 'Error al evaluar la prueba'); }
  }

  function resetPrueba(moduleId: string) {
    const next = { ...pruebaResult };
    delete next[moduleId];
    setPruebaResult(next);
    localStorage.setItem(PRUEBA_KEY, JSON.stringify(next));
    setPruebaAnswers({});
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'modulos', label: 'Módulos', icon: '📚' },
    { id: 'tracker', label: 'Tracker', icon: '📅' },
    { id: 'curso', label: 'Curso', icon: '🎓' },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2 flex-wrap" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold" style={{ background: '#f59e0b30' }}>🎓</div>
          <span className="text-[13px] font-bold font-mono" style={{ color: colors.text }}>Prácticas Profesionales</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'curso') setCourse(null); }}
              className="px-2.5 py-1 rounded-lg border-2 text-[10px] font-bold font-mono cursor-pointer hover:opacity-85 transition"
              style={{ borderColor: tab === t.id ? colors.primary : colors.border, background: tab === t.id ? colors.primary : 'transparent', color: tab === t.id ? '#1B2632' : colors.textMuted }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl" style={{ background: colors.cardBg }} />)}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: '#ef4444', background: '#ef444410', color: '#ef4444' }}>⚠ {error}</div>
        )}

        {tab === 'modulos' && !active && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(m => {
              const done = moduleDone(m);
              const doneCount = (progress[m.id] || []).length;
              const pr = pruebaResult[m.id];
              return (
                <button key={m.id} onClick={() => setActive(m)} className="text-left rounded-2xl border-2 p-5 cursor-pointer hover:opacity-85 transition"
                  style={{ borderColor: done ? '#22c55e' : colors.border, background: colors.cardBg, boxShadow: `3px 3px 0px 0px ${colors.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{m.icono}</span>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: done ? '#22c55e30' : '#f59e0b20', color: done ? '#22c55e' : '#f59e0b' }}>
                      {done ? '✓ Completado' : `${doneCount}/${m.pasos.length}`}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold mb-1" style={{ color: colors.text }}>{m.titulo}</h3>
                  <p className="text-[11px] leading-snug mb-3" style={{ color: colors.textMuted }}>{m.descripcion}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[9px] font-mono" style={{ color: colors.primary }}>{m.semanas} · {m.pasos.length} pasos</p>
                    {pr && <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: pr.aprobado ? '#22c55e30' : '#ef444430', color: pr.aprobado ? '#22c55e' : '#ef4444' }}>Prueba {pr.scorePct}%</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'modulos' && active && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setActive(null)} className="text-[11px] font-mono mb-4 cursor-pointer hover:opacity-70" style={{ color: colors.textMuted }}>← Volver a módulos</button>
            <div className="rounded-2xl border-2 p-6" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{active.icono}</span>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: colors.text }}>{active.titulo}</h2>
                  <p className="text-[10px] font-mono" style={{ color: colors.primary }}>{active.semanas}</p>
                </div>
              </div>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: colors.textMuted }}>{active.descripcion}</p>
              <div className="p-3 rounded-xl mb-5" style={{ background: colors.primary + '10', border: `1px solid ${colors.primary}30` }}>
                <p className="text-[11px] font-bold mb-0.5" style={{ color: colors.primary }}>🎯 Objetivo</p>
                <p className="text-[11px] leading-snug" style={{ color: colors.text }}>{active.objetivo}</p>
              </div>

              <div className="flex gap-2 mb-5 flex-wrap">
                <button onClick={() => openCourse(active.id)}
                  className="px-3 py-1.5 rounded-lg border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                  style={{ borderColor: '#f59e0b', background: '#f59e0b15', color: '#f59e0b' }}>
                  🎓 Curso con tu capacitador
                </button>
              </div>

              <div className="space-y-3">
                {active.pasos.map((paso, i) => {
                  const done = isDone(active.id, paso.id);
                  const icon = paso.tipo === 'tarea' ? '📝' : paso.tipo === 'asiento' ? '📒' : '💡';
                  return (
                    <div key={paso.id} className={`rounded-xl border-2 p-4 ${done ? '' : ''}`} style={{ borderColor: done ? '#22c55e' : colors.border, background: done ? '#22c55e08' : (isDark ? 'rgba(0,0,0,0.2)' : '#fff') }}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: done ? '#22c55e' : colors.bg, color: done ? '#1B2632' : colors.textMuted, border: `1.5px solid ${done ? 'transparent' : colors.border}` }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>{icon} {paso.titulo}</span>
                        <span className="text-[8px] font-mono ml-auto px-1.5 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.textMuted }}>
                          {paso.tipo === 'tarea' ? 'tarea real' : paso.tipo === 'asiento' ? 'asiento' : 'guía'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug mb-2 pl-9" style={{ color: colors.textMuted }}>{paso.descripcion}</p>
                      {paso.datos && (
                        <div className="pl-9 flex flex-wrap gap-1.5 mb-2">
                          {paso.datos.map(d => (
                            <span key={d} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: colors.primary + '15', color: colors.primary }}>{d}</span>
                          ))}
                        </div>
                      )}
                      {paso.tipo === 'asiento' && paso.asiento && (
                        <div className="pl-9 p-3 rounded-lg mb-2" style={{ background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: `1px solid ${colors.border}` }}>
                          <p className="text-[9px] font-mono mb-1" style={{ color: colors.textMuted }}>Cargo → {paso.asiento.cargo}</p>
                          <p className="text-[9px] font-mono mb-1" style={{ color: colors.textMuted }}>Abono → {paso.asiento.abono}</p>
                          <p className="text-[9px] font-mono" style={{ color: colors.primary }}>{paso.asiento.concepto}</p>
                        </div>
                      )}
                      <div className="pl-9 flex gap-2 mt-1">
                        {paso.tipo === 'tarea' && paso.taskType && (
                          <button onClick={() => onOpenTask(paso.taskType!)}
                            className="px-4 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                            style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632' }}>
                            {done ? '↻ Repetir tarea' : '▶ Abrir tarea'}
                          </button>
                        )}
                        {!done && (
                          <button onClick={() => markDone(active.id, paso.id)}
                            className="px-4 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                            style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}>
                            {paso.tipo === 'tarea' ? 'La completé ✓' : '✓ Marcar visto'}
                          </button>
                        )}
                        {done && paso.tipo !== 'tarea' && (
                          <span className="text-[10px] font-bold font-mono" style={{ color: '#22c55e' }}>✓ Completado</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prueba de conocimiento al final del tema */}
              <div className="mt-6 p-5 rounded-2xl border-2" style={{ borderColor: '#f59e0b', background: '#f59e0b08' }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-[13px] font-bold mb-0.5" style={{ color: '#f59e0b' }}>📝 {active.prueba.titulo}</h3>
                    <p className="text-[10px]" style={{ color: colors.textMuted }}>Demuestra que comprendiste el tema. Aprueba con {active.prueba.aprobarMin}%.</p>
                  </div>
                  {pruebaResult[active.id] && (
                    <span className="text-[10px] font-bold font-mono px-3 py-1 rounded-full" style={{ background: pruebaResult[active.id].aprobado ? '#22c55e30' : '#ef444430', color: pruebaResult[active.id].aprobado ? '#22c55e' : '#ef4444' }}>
                      {pruebaResult[active.id].aprobado ? '✓ Aprobada' : '✗ No aprobada'} · {pruebaResult[active.id].scorePct}%
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {active.prueba.preguntas.map((p, qi) => {
                    const selected = pruebaAnswers[`${active.id}-${qi}`];
                    const showFeedback = !!pruebaResult[active.id];
                    const isCorrect = showFeedback && selected === p.correcta;
                    return (
                      <div key={qi} className="rounded-xl border-2 p-4" style={{ borderColor: showFeedback ? (isCorrect ? '#22c55e' : '#ef4444') : colors.border, background: showFeedback ? (isCorrect ? '#22c55e08' : '#ef444408') : (isDark ? 'rgba(0,0,0,0.2)' : '#fff') }}>
                        <p className="text-[11px] font-bold mb-2" style={{ color: colors.text }}>{qi + 1}. {p.q}</p>
                        <div className="space-y-1.5">
                          {p.opciones.map((op, oi) => {
                            const isSel = selected === oi;
                            return (
                              <button key={oi} onClick={() => setPruebaAnswers(prev => ({ ...prev, [`${active.id}-${qi}`]: oi }))} disabled={showFeedback}
                                className="w-full text-left px-3 py-2 rounded-lg border-2 text-[10px] cursor-pointer hover:opacity-85 transition disabled:cursor-default"
                                style={{
                                  borderColor: showFeedback && oi === p.correcta ? '#22c55e' : (isSel ? colors.primary : colors.border),
                                  background: showFeedback && oi === p.correcta ? '#22c55e15' : (isSel ? colors.primary + '15' : 'transparent'),
                                  color: showFeedback && oi === p.correcta ? '#22c55e' : (isSel ? colors.primary : colors.text),
                                  fontWeight: showFeedback && oi === p.correcta ? 700 : 400,
                                }}>
                                <span className="font-mono mr-1.5">{String.fromCharCode(97 + oi)})</span>{op}
                                {showFeedback && oi === p.correcta && <span className="float-right">✓</span>}
                                {showFeedback && isSel && oi !== p.correcta && <span className="float-right">✗</span>}
                              </button>
                            );
                          })}
                        </div>
                        {showFeedback && (
                          <div className="mt-2 pl-3 text-[10px] leading-snug" style={{ borderLeft: `3px solid ${isCorrect ? '#22c55e' : '#ef4444'}`, color: colors.textMuted }}>
                            <span style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{isCorrect ? 'Correcto' : 'Incorrecto'}: </span>{p.explicacion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {pruebaError && <p className="text-[11px] mt-3 font-mono" style={{ color: '#ef4444' }}>⚠ {pruebaError}</p>}

                <div className="flex gap-2 mt-4">
                  {!pruebaResult[active.id] && (
                    <button onClick={() => submitPrueba(active.id)}
                      className="px-5 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                      style={{ borderColor: '#f59e0b', background: '#f59e0b', color: '#1B2632' }}>
                      Enviar prueba
                    </button>
                  )}
                  {pruebaResult[active.id] && (
                    <button onClick={() => resetPrueba(active.id)}
                      className="px-4 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                      style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}>
                      ↻ Reintentar prueba
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'tracker' && (
          <PracticasTrackerFallback
            theme={theme}
            onBack={() => setTab('modulos')}
            onOpenTask={onOpenTask}
            onOpenModule={(moduleId) => { const m = modules.find(x => x.id === moduleId); if (m) setActive(m); else openCourse(moduleId); }}
          />
        )}

        {tab === 'curso' && (
          course ? (
            <PracticasCurso theme={theme} curso={course} onBack={() => { setCourse(null); setTab('modulos'); }} />
          ) : (
            <div className="max-w-3xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map(m => (
                <button key={m.id} onClick={() => openCourse(m.id)} className="text-left rounded-2xl border-2 p-5 cursor-pointer hover:opacity-85 transition"
                  style={{ borderColor: colors.border, background: colors.cardBg, boxShadow: `3px 3px 0px 0px ${colors.border}` }}>
                  <span className="text-2xl mb-2 block">{m.icono}</span>
                  <h3 className="text-[13px] font-bold mb-1" style={{ color: colors.text }}>{m.curso.titulo}</h3>
                  <p className="text-[10px] mb-2" style={{ color: colors.textMuted }}>{m.curso.secciones.length} secciones · con tu capacitador 🎓</p>
                  <span className="text-[9px] font-mono" style={{ color: colors.primary }}>Comenzar curso →</span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function PracticasTrackerFallback({ theme, onBack, onOpenTask, onOpenModule }: { theme: Theme; onBack: () => void; onOpenTask: (type: string) => void; onOpenModule: (moduleId: string) => void; }) {
  return <PracticasTracker theme={theme} onBack={onBack} onOpenTask={onOpenTask} onOpenModule={onOpenModule} />;
}