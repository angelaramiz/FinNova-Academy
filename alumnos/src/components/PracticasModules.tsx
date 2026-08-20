import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface PracticaPaso {
  id: string;
  titulo: string;
  tipo: 'guia' | 'tarea' | 'asiento';
  descripcion: string;
  taskType?: string;
  datos?: string[];
  asiento?: { cargo: string; abono: string; cuentas: string; concepto: string };
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
}

interface PracticasModulesProps {
  theme: Theme;
  onBack: () => void;
  onOpenTask: (type: string) => void;
}

const PROGRESS_KEY = 'practicas_module_progress';

function loadProgress(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export default function PracticasModules({ theme, onBack, onOpenTask }: PracticasModulesProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [modules, setModules] = useState<PracticaModulo[]>([]);
  const [active, setActive] = useState<PracticaModulo | null>(null);
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

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold" style={{ background: '#f59e0b30' }}>🎓</div>
          <span className="text-[13px] font-bold font-mono" style={{ color: colors.text }}>Prácticas Profesionales — Módulos</span>
        </div>
        <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>{modules.filter(moduleDone).length}/{modules.length} completados</span>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {loading && (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl" style={{ background: colors.cardBg }} />)}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: '#ef4444', background: '#ef444410', color: '#ef4444' }}>⚠ {error}</div>
        )}

        {!active ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(m => {
              const done = moduleDone(m);
              const doneCount = (progress[m.id] || []).length;
              return (
                <button key={m.id} onClick={() => setActive(m)} className="text-left rounded-2xl border-2 p-5 cursor-pointer hover:opacity-85 transition"
                  style={{ borderColor: done ? '#22c55e' : colors.border, background: colors.cardBg, boxShadow: `3px 3px 0px 0px ${colors.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{m.icono}</span>
                    {done ? <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: '#22c55e30', color: '#22c55e' }}>✓ Completado</span>
                      : <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: '#f59e0b20', color: '#f59e0b' }}>{doneCount}/{m.pasos.length}</span>}
                  </div>
                  <h3 className="text-[14px] font-bold mb-1" style={{ color: colors.text }}>{m.titulo}</h3>
                  <p className="text-[11px] leading-snug mb-3" style={{ color: colors.textMuted }}>{m.descripcion}</p>
                  <p className="text-[9px] font-mono" style={{ color: colors.primary }}>{m.semanas} · {m.pasos.length} pasos</p>
                </button>
              );
            })}
          </div>
        ) : (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}