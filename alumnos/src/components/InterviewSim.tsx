import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface InterviewSimProps { theme: Theme; onBack: () => void; }

interface Question {
  id: string;
  logroIndex: number;
  pregunta: string;
  contexto: string;
  rubrica: string[];
  puntajeMaximo: number;
}

interface Answer { questionId: string; respuesta: string; puntaje: number; feedback: string; }

interface Session {
  userId: string;
  specialty: string;
  preguntas: Question[];
  respuestas: Answer[];
  totalPuntaje: number;
  totalMaximo: number;
  completada: boolean;
  createdAt: string;
}

async function apiPost(path: string, body?: any): Promise<any> {
  return apiFetch(path, { method: body ? 'POST' : 'GET', ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) });
}

export default function InterviewSim({ theme, onBack }: InterviewSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [done, setDone] = useState(false);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const specialty = localStorage.getItem('sim_specialty') === 'data_engineering' ? 'data_engineering' : 'accounting';
      const s = await apiPost('/api/sim/interview/start', { specialty });
      setSession(s);
      setAnswers({});
      setActiveIdx(0);
      setDone(false);
    } catch (e: any) { setError(e.message || 'Error al iniciar la entrevista'); }
    finally { setLoading(false); }
  };

  useEffect(() => { start(); }, []);

  const submitAll = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const respuestas: Answer[] = session.preguntas.map(q => ({
        questionId: q.id,
        respuesta: answers[q.id] || '',
        puntaje: 0,
        feedback: '',
      }));
      const result = await apiPost('/api/sim/interview/submit', { session, respuestas });
      setSession(result);
      setDone(true);
    } catch (e: any) { setError(e.message || 'Error al enviar respuestas'); }
    finally { setLoading(false); }
  };

  const q = session?.preguntas[activeIdx];

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🎤</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Entrevista Entrenada</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>basada en tus logros reales</span>
        {session && <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>{activeIdx + 1}/{session.preguntas.length}</span>}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading && !session && <div className="p-10 text-center text-xs text-slate-500">Preparando entrevista...</div>}

        {error && !session && (
          <div className="p-10 text-center">
            <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>
            <button onClick={start} className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer" style={{ borderColor: '#8b5cf6', background: '#8b5cf6', color: '#fff' }}>Reintentar</button>
          </div>
        )}

        {session && !done && q && (
          <div className="max-w-2xl mx-auto">
            {/* Progreso */}
            <div className="flex gap-1.5 mb-4">
              {session.preguntas.map((_, i) => (
                <button key={i} onClick={() => setActiveIdx(i)}
                  className="h-1.5 flex-1 rounded-full cursor-pointer"
                  style={{ background: i < activeIdx ? '#8b5cf6' : i === activeIdx ? '#c084fc' : colors.border }} />
              ))}
            </div>

            {/* Contexto del logro */}
            <div className="rounded-xl border-2 p-3 mb-3" style={{ borderColor: colors.border, background: '#8b5cf610' }}>
              <span className="text-[9px] font-mono uppercase font-bold" style={{ color: '#8b5cf6' }}>📋 Tu logro</span>
              <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>{q.contexto}</p>
            </div>

            {/* Pregunta */}
            <h3 className="text-sm font-bold mb-3" style={{ color: colors.text }}>{q.pregunta}</h3>

            {/* Respuesta */}
            <textarea
              value={answers[q.id] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Explica tu trabajo como si estuvieras en una entrevista real: qué hiciste, por qué, y qué resultado obtuviste..."
              rows={7}
              className="w-full p-3 rounded-xl border-2 font-mono text-[11px] outline-none resize-none"
              style={{ borderColor: colors.border, background: isDark ? '#0a0f1a' : '#fff', color: colors.text }}
            />

            {/* Hint de rubrica (para que sepa qué se evalúa) */}
            <p className="text-[9px] mt-2" style={{ color: colors.textMuted }}>
              💡 Se evalúa que menciones: {q.rubrica.join(', ')}
            </p>

            <div className="flex gap-2 mt-4">
              {activeIdx > 0 && (
                <button onClick={() => setActiveIdx(i => i - 1)} className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer" style={{ borderColor: colors.border, color: colors.textMuted }}>← Anterior</button>
              )}
              {activeIdx < session.preguntas.length - 1 ? (
                <button onClick={() => setActiveIdx(i => i + 1)} className="px-6 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer" style={{ borderColor: '#8b5cf6', background: '#8b5cf6', color: '#fff' }}>Siguiente →</button>
              ) : (
                <button onClick={submitAll} disabled={loading} className="px-6 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer disabled:opacity-50" style={{ borderColor: '#22c55e', background: '#22c55e', color: '#1B2632' }}>
                  {loading ? 'Evaluando...' : '✅ Finalizar y evaluar'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Resultados */}
        {session && done && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: (session.totalPuntaje / Math.max(session.totalMaximo, 1)) >= 0.7 ? '#22c55e20' : '#f59e0b20', border: `3px solid ${(session.totalPuntaje / Math.max(session.totalMaximo, 1)) >= 0.7 ? '#22c55e' : '#f59e0b'}` }}>
                {(session.totalPuntaje / Math.max(session.totalMaximo, 1)) >= 0.7 ? '🎉' : '📝'}
              </div>
              <h2 className="text-base font-bold" style={{ color: colors.text }}>Entrevista completada</h2>
              <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>Puntaje: {session.totalPuntaje}/{session.totalMaximo}</p>
            </div>

            <div className="space-y-3">
              {session.respuestas.map((r, i) => {
                const qq = session.preguntas[i];
                return (
                  <div key={i} className="rounded-xl border-2 p-3" style={{ borderColor: colors.border, background: colors.cardBg }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold" style={{ color: colors.text }}>{qq.pregunta}</span>
                      <span className="text-[11px] font-mono font-bold shrink-0 ml-2" style={{ color: r.puntaje >= qq.puntajeMaximo * 0.7 ? '#22c55e' : '#f59e0b' }}>{r.puntaje}/{qq.puntajeMaximo}</span>
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: colors.textMuted }}>{r.respuesta || '(sin respuesta)'}</p>
                    <p className="text-[10px] px-2 py-1 rounded-lg" style={{ background: r.puntaje >= qq.puntajeMaximo * 0.7 ? '#22c55e10' : '#f59e0b10', color: r.puntaje >= qq.puntajeMaximo * 0.7 ? '#22c55e' : '#f59e0b' }}>{r.feedback}</p>
                  </div>
                );
              })}
            </div>

            <button onClick={start} className="w-full mt-4 py-3 rounded-xl border-2 text-xs font-bold cursor-pointer" style={{ borderColor: '#8b5cf6', background: '#8b5cf6', color: '#fff' }}>🔄 Repetir entrevista</button>
          </div>
        )}
      </div>
    </div>
  );
}
