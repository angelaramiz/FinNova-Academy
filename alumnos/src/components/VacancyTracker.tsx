import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface VacancyTrackerProps { theme: Theme; onBack: () => void; }

interface Vacancy {
  id: string;
  vacancy_id: string;
  modo: 'A' | 'B';
  status: string;
  vacante_titulo?: string;
  vacante_stack?: string;
  match_pct?: number;
}

function apiFetch(path: string, opts?: any): Promise<any> {
  const token = localStorage.getItem('supabase_auth_token') || '';
  const isRender = window.location.hostname.includes('onrender.com');
  const baseUrl = (import.meta as any).env?.VITE_API_URL || (isRender ? 'https://finnova-back.onrender.com' : '');
  return fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, ...(opts?.body ? { 'Content-Type': 'application/json' } : {}) },
    ...(opts || {}),
  }).then(r => r.json());
}

const STATUS_LABEL: Record<string, string> = {
  diagnostico: '🔎 Diagnóstico',
  preparacion: '📚 Preparación',
  postulacion: '📤 Postulación',
  entrevista: '🎤 Entrevista',
  cerrada: '✅ Cerrada',
};

const STATUS_ORDER = ['diagnostico', 'preparacion', 'postulacion', 'entrevista', 'cerrada'];

export default function VacancyTracker({ theme, onBack }: VacancyTrackerProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [active, setActive] = useState(0);
  const [limit, setLimit] = useState(2);
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await apiFetch('/api/vacancies');
      setVacancies(d.vacancies || []);
      setActive(d.active || 0);
      setLimit(d.limit || 2);
      setPlan(d.plan || 'free');
    } catch {
      setError('No se pudo cargar el seguimiento de vacantes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function advance(v: Vacancy) {
    const idx = STATUS_ORDER.indexOf(v.status);
    if (idx === -1 || idx === STATUS_ORDER.length - 1) return;
    const next = STATUS_ORDER[idx + 1];
    const d = await apiFetch(`/api/vacancies/${encodeURIComponent(v.vacancy_id)}/status`, { method: 'POST', body: JSON.stringify({ status: next }) });
    if (d?.ok) load();
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🎯</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Seguimiento de vacantes</span>
        <span className="flex-1" />
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: active >= limit ? '#ef444420' : '#22c55e20', color: active >= limit ? '#ef4444' : '#22c55e' }}>
          {active}/{limit} activas · plan {plan}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {error && <div className="text-[11px] px-3 py-2 rounded-lg font-mono" style={{ background: '#ef444410', color: '#ef4444' }}>{error}</div>}

        {active >= limit && (
          <div className="text-[11px] px-3 py-2 rounded-lg font-mono flex items-center justify-between" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
            <span>⚠ Plan free: máximo {limit} vacantes simultáneas. Cierra una o actualiza a Pro.</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-2 animate-pulse">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 rounded-xl" style={{ background: colors.cardSecondary }} />)}</div>
        ) : vacancies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-[13px] font-bold font-mono" style={{ color: colors.textMuted }}>Sin vacantes en seguimiento</p>
            <p className="text-[11px] font-mono mt-1" style={{ color: colors.textMuted }}>Pega una vacante en el diagnóstico (Etapa 1) para comenzar</p>
          </div>
        ) : (
          vacancies.map((v) => (
            <div key={v.vacancy_id} className="rounded-xl border-2 p-3" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-bold font-mono truncate" style={{ color: colors.text }}>{v.vacante_titulo || v.vacancy_id}</span>
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: v.modo === 'A' ? '#22c55e20' : '#3b82f620', color: v.modo === 'A' ? '#22c55e' : '#3b82f6' }}>Modo {v.modo}</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono mb-2" style={{ color: colors.textMuted }}>
                <span>{STATUS_LABEL[v.status] || v.status}</span>
                {v.match_pct != null && <span>· match {v.match_pct}%</span>}
                {v.vacante_stack && <span className="truncate">· {v.vacante_stack}</span>}
              </div>
              <div className="flex gap-1.5">
                {STATUS_ORDER.map((s, i) => (
                  <div key={s} className="flex-1 h-1.5 rounded" style={{ background: STATUS_ORDER.indexOf(v.status) >= i ? (v.status === 'cerrada' ? '#22c55e' : colors.primary) : colors.border }} />
                ))}
              </div>
              {v.status !== 'cerrada' && (
                <button onClick={() => advance(v)} className="mt-2 text-[10px] px-2 py-1 rounded-lg border-2 font-bold cursor-pointer" style={{ borderColor: colors.primary, color: colors.primary }}>
                  Avanzar →
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>VacancyTracker · Etapa 2 (R-10)</span>
        <span style={{ color: colors.primary }}>límite plan free: {limit} activas</span>
      </div>
    </div>
  );
}