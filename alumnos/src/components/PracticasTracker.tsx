import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface Repeticion {
  taskType: string;
  titulo: string;
  veces: number;
  explicacion: string;
}

interface PruebaInfo {
  titulo: string;
  aprobarMin: number;
  preguntas: { q: string; opciones: string[]; correcta: number; explicacion: string }[];
}

interface TrackerSemana {
  week: number;
  tema: string;
  moduloId: string;
  objetivo: string;
  repeticiones: Repeticion[];
  prueba: PruebaInfo;
}

interface PracticasTrackerProps {
  theme: Theme;
  onBack: () => void;
  onOpenTask: (type: string) => void;
  onOpenModule: (moduleId: string) => void;
}

const PROGRESS_KEY = 'practicas_tracker_progress';

function loadProgress(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export default function PracticasTracker({ theme, onBack, onOpenTask, onOpenModule }: PracticasTrackerProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [semanas, setSemanas] = useState<TrackerSemana[]>([]);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [done, setDone] = useState<Record<string, string[]>>(loadProgress());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/sim/practicas/tracker')
      .then((data: any) => { setSemanas(data.semanas || []); setLoading(false); })
      .catch((e: any) => { setError(e.message || 'Error al cargar el tracker'); setLoading(false); });
  }, []);

  function toggleRep(week: number, taskType: string) {
    const key = `w${week}`;
    const list = done[key] || [];
    const next = list.includes(taskType) ? list.filter(x => x !== taskType) : [...list, taskType];
    const updated = { ...done, [key]: next };
    setDone(updated);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  }

  function weekDone(s: TrackerSemana) {
    const list = done[`w${s.week}`] || [];
    return s.repeticiones.length > 0 && s.repeticiones.every(r => list.includes(r.taskType));
  }

  const totalDone = semanas.filter(weekDone).length;

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold" style={{ background: '#f59e0b30' }}>📅</div>
          <span className="text-[13px] font-bold font-mono" style={{ color: colors.text }}>Tracker semanal — Mecanización</span>
        </div>
        <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>{totalDone}/{semanas.length} semanas</span>
      </div>

      <div className="px-3 py-1.5 text-[9px] font-mono flex items-center gap-2 flex-wrap" style={{ background: '#f59e0b10', color: '#f59e0b', borderBottom: `1px solid ${colors.border}` }}>
        <span>🎯 Repite cada tarea hasta dominar el procedimiento. Marca cada repetición al completarla.</span>
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

        {!activeWeek ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {semanas.map(s => {
              const doneW = weekDone(s);
              const repsDone = (done[`w${s.week}`] || []).length;
              return (
                <button key={s.week} onClick={() => setActiveWeek(s.week)} className="text-left rounded-2xl border-2 p-5 cursor-pointer hover:opacity-85 transition"
                  style={{ borderColor: doneW ? '#22c55e' : colors.border, background: colors.cardBg, boxShadow: `3px 3px 0px 0px ${colors.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: colors.primary + '20', color: colors.primary }}>Semana {s.week}</span>
                    {doneW ? <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: '#22c55e30', color: '#22c55e' }}>✓ Dominada</span>
                      : <span className="text-[9px] font-bold font-mono" style={{ color: colors.textMuted }}>{repsDone}/{s.repeticiones.length}</span>}
                  </div>
                  <h3 className="text-[14px] font-bold mb-1" style={{ color: colors.text }}>{s.tema}</h3>
                  <p className="text-[10px] leading-snug mb-2" style={{ color: colors.textMuted }}>{s.objetivo}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.repeticiones.map(r => (
                      <span key={r.taskType} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: colors.bg, color: colors.text }}>×{r.veces} {r.titulo}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onOpenModule(s.moduloId); }}
                      className="px-3 py-1.5 rounded-lg border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                      style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632' }}>🎓 Ver curso</button>
                    <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>📝 {s.prueba.preguntas.length} preguntas</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setActiveWeek(null)} className="text-[11px] font-mono mb-4 cursor-pointer hover:opacity-70" style={{ color: colors.textMuted }}>← Volver al tracker</button>
            {(() => {
              const s = semanas.find(x => x.week === activeWeek)!;
              return (
                <div className="rounded-2xl border-2 p-6" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📅</span>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: colors.text }}>Semana {s.week} — {s.tema}</h2>
                      <p className="text-[10px] font-mono" style={{ color: colors.primary }}>Repetición por tema para mecanizar el procedimiento</p>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-4" style={{ color: colors.textMuted }}>{s.objetivo}</p>

                  <div className="space-y-3">
                    {s.repeticiones.map((r) => {
                      const marked = (done[`w${s.week}`] || []).includes(r.taskType);
                      return (
                        <div key={r.taskType} className="rounded-xl border-2 p-4" style={{ borderColor: marked ? '#22c55e' : colors.border, background: marked ? '#22c55e08' : (isDark ? 'rgba(0,0,0,0.2)' : '#fff') }}>
                          <div className="flex items-center gap-3 mb-1.5">
                            <button onClick={() => toggleRep(s.week, r.taskType)}
                              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer"
                              style={{ background: marked ? '#22c55e' : colors.bg, color: marked ? '#1B2632' : colors.textMuted, border: `1.5px solid ${marked ? 'transparent' : colors.border}` }}>
                              {marked ? '✓' : ''}
                            </button>
                            <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>×{r.veces} {r.titulo}</span>
                            <span className="text-[8px] font-mono ml-auto px-1.5 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.textMuted }}>{r.taskType.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="text-[11px] leading-snug pl-8" style={{ color: colors.textMuted }}>{r.explicacion}</p>
                          <div className="pl-8 mt-2">
                            <button onClick={() => onOpenTask(r.taskType)}
                              className="px-4 py-1.5 rounded-lg border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                              style={{ borderColor: colors.primary, background: 'transparent', color: colors.primary }}>
                              ▶ Hacer tarea
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 p-4 rounded-xl border-2" style={{ borderColor: '#f59e0b', background: '#f59e0b08' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold font-mono" style={{ color: colors.primary }}>📝 {s.prueba.titulo}</p>
                      <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>aprueba con {s.prueba.aprobarMin}%</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: colors.textMuted }}>Al final del tema, comprueba lo que aprendiste.</p>
                    <button onClick={() => onOpenModule(s.moduloId)}
                      className="px-4 py-2 rounded-xl border-2 text-[10px] font-bold cursor-pointer hover:opacity-85 transition"
                      style={{ borderColor: '#f59e0b', background: '#f59e0b', color: '#1B2632' }}>
                      Tomar prueba de conocimiento
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}