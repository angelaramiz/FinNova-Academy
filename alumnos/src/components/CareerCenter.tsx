import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface CareerCenterProps { theme: Theme; onBack: () => void; }

interface Kit {
  vacancyTitle: string;
  skillsTarget: string[];
  cvPitch: string;
  checklist: string[];
  starQuestions: string[];
  evidencias: string[];
  match_pct: number;
}

interface AppliedCaseUI {
  id: string;
  skill: string;
  tool: string;
  context: string;
  decision: string;
  trap: { id: string; description: string; validation: string };
  validable: boolean;
  reflection: string;
  feedsNext?: string;
}

interface DensityUI {
  density: number;
  density_pct: number;
  nivel: string;
  anos_equivalentes: number;
  evidencia: string[];
  narrativa: string;
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

export default function CareerCenter({ theme, onBack }: CareerCenterProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'kit' | 'intensive' | 'density'>('kit');

  // Modo A — kit
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [match, setMatch] = useState(0);
  const [kit, setKit] = useState<Kit | null>(null);
  const [kitLoading, setKitLoading] = useState(false);

  // Modo B — intensivo
  const [gaps, setGaps] = useState('');
  const [plan, setPlan] = useState<AppliedCaseUI[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  // Etapa 3 — densidad
  const [density, setDensity] = useState<DensityUI | null>(null);
  const [densLoading, setDensLoading] = useState(false);
  const [densInput, setDensInput] = useState({ casos: 0, complejidad: 0, variedad: 0, incidentes: 0, resultados: 0 });

  async function buildKit() {
    setKitLoading(true);
    const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
    const d = await apiFetch('/api/stage1/kit', { method: 'POST', body: JSON.stringify({ vacancyTitle: title, skillsTarget: skillsList, match_pct: match }) });
    setKit(d);
    setKitLoading(false);
  }

  async function buildPlan() {
    setPlanLoading(true);
    const gapsList = gaps.split(',').map(s => s.trim()).filter(Boolean);
    const d = await apiFetch('/api/stage1/intensive', { method: 'POST', body: JSON.stringify({ assessmentId: 'manual', gaps: gapsList }) });
    setPlan(d.cases || []);
    setPlanLoading(false);
  }

  async function computeDensity() {
    setDensLoading(true);
    const d = await apiFetch('/api/stage1/density', { method: 'POST', body: JSON.stringify(densInput) });
    setDensity(d);
    setDensLoading(false);
  }

  const field = (v: string) => ({ borderColor: colors.border, background: isDark ? '#0f172a' : '#fff', color: colors.text });
  const btn = { background: colors.primary, color: '#fff' };

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">💼</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Centro de Carrera</span>
        <div className="flex-1" />
        {(['kit', 'intensive', 'density'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="text-[10px] px-2 py-1 rounded-full font-bold cursor-pointer" style={{ background: tab === t ? colors.primary : 'transparent', color: tab === t ? '#fff' : colors.textMuted }}>
            {t === 'kit' ? 'Modo A · Kit' : t === 'intensive' ? 'Modo B · Intensivo' : 'Etapa 3 · Densidad'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {tab === 'kit' && (
          <>
            <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Kit de postulación a la medida de una vacante con match ≥ 75% (Modo A).</p>
            <div className="space-y-2">
              <input placeholder="Título de la vacante" value={title} onChange={e => setTitle(e.target.value)} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none" style={field(title)} />
              <input placeholder="Skills objetivo (separados por coma, ej: SQL, Python, dbt)" value={skills} onChange={e => setSkills(e.target.value)} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none" style={field(skills)} />
              <input type="number" placeholder="Match %" value={match} onChange={e => setMatch(Number(e.target.value))} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none" style={field(String(match))} />
              <button onClick={buildKit} disabled={kitLoading} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer" style={{ ...btn, opacity: kitLoading ? 0.6 : 1 }}>
                {kitLoading ? 'Generando…' : 'Generar kit de postulación'}
              </button>
            </div>
            {kit && (
              <div className="rounded-xl border-2 p-3 space-y-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <div className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>CV a la medida · {kit.vacancyTitle} <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#22c55e20', color: '#22c55e' }}>{kit.match_pct}% match</span></div>
                <p className="text-[11px] font-mono leading-relaxed" style={{ color: colors.text }}>{kit.cvPitch}</p>
                <div>
                  <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>📝 Checklist de aplicación</div>
                  {kit.checklist.map((c, i) => <div key={i} className="text-[10px] font-mono flex gap-2" style={{ color: colors.text }}><span style={{ color: colors.primary }}>▢</span>{c}</div>)}
                </div>
                <div>
                  <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>🎤 Preguntas STAR (logros reales)</div>
                  {kit.starQuestions.map((q, i) => <div key={i} className="text-[10px] font-mono flex gap-2" style={{ color: colors.text }}><span style={{ color: colors.primary }}>›</span>{q}</div>)}
                </div>
                {kit.evidencias.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>🔗 Evidencias del expediente (R-08)</div>
                    {kit.evidencias.map((e, i) => <div key={i} className="text-[10px] font-mono flex gap-2" style={{ color: colors.text }}><span style={{ color: '#22c55e' }}>✓</span>{e}</div>)}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'intensive' && (
          <>
            <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Plan intensivo (Modo B): un caso aplicado por cada skill con score &lt; 75, con contexto real, decisión multi-camino, trampa oculta, validación por motor y reflexión.</p>
            <div className="space-y-2">
              <input placeholder="Skills débiles (gaps, separados por coma, ej: Airflow, dbt)" value={gaps} onChange={e => setGaps(e.target.value)} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none" style={field(gaps)} />
              <button onClick={buildPlan} disabled={planLoading} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer" style={{ ...btn, opacity: planLoading ? 0.6 : 1 }}>
                {planLoading ? 'Construyendo plan…' : 'Generar plan intensivo'}
              </button>
            </div>
            {plan.map((c, i) => (
              <div key={c.id} className="rounded-xl border-2 p-3 space-y-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: colors.primary + '20', color: colors.primary }}>Caso {i + 1}</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>{c.skill}</span>
                  <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>· herramienta: {c.tool}</span>
                </div>
                <p className="text-[11px] font-mono" style={{ color: colors.text }}>🏢 {c.context}</p>
                <p className="text-[11px] font-mono" style={{ color: colors.text }}>🤔 {c.decision}</p>
                <p className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>⚠ Restricción oculta: {c.trap.description}</p>
                <p className="text-[10px] font-mono" style={{ color: '#a855f7' }}>💭 Reflexión: {c.reflection}</p>
                <div className="flex items-center gap-2 text-[9px] font-mono" style={{ color: colors.textMuted }}>
                  <span style={{ color: c.validable ? '#22c55e' : '#ef4444' }}>{c.validable ? '✓ validable por motor' : '✗ no validable'}</span>
                  {c.feedsNext && <span>· alimenta: {c.feedsNext}</span>}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'density' && (
          <>
            <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Densidad de experiencia (Etapa 3): la experiencia no se mide solo en años, sino en casos, complejidad, variedad e incidentes resueltos.</p>
            <div className="grid grid-cols-2 gap-2">
              {([['casos', 'Casos resueltos'], ['complejidad', 'Complejidad (0-100)'], ['variedad', 'Skills distintos'], ['incidentes', 'Incidentes'], ['resultados', 'Entregables validados']] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{label}</label>
                  <input type="number" value={densInput[k]} onChange={e => setDensInput({ ...densInput, [k]: Number(e.target.value) })} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none mt-0.5" style={field(String(densInput[k]))} />
                </div>
              ))}
            </div>
            <button onClick={computeDensity} disabled={densLoading} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer" style={{ ...btn, opacity: densLoading ? 0.6 : 1 }}>
              {densLoading ? 'Calculando…' : 'Calcular densidad'}
            </button>
            {density && (
              <div className="rounded-xl border-2 p-3 space-y-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold font-mono" style={{ color: colors.primary }}>{density.density_pct}%</div>
                  <div>
                    <div className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>Nivel: {density.nivel}</div>
                    <div className="text-[10px] font-mono" style={{ color: colors.textMuted }}>{density.anos_equivalentes} años equivalentes</div>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.border }}>
                  <div className="h-full" style={{ width: `${density.density_pct}%`, background: density.density_pct >= 75 ? '#22c55e' : density.density_pct >= 50 ? '#3b82f6' : '#f59e0b' }} />
                </div>
                <p className="text-[10px] font-mono italic" style={{ color: colors.textMuted }}>“{density.narrativa}”</p>
                <div>
                  <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>Evidencia para el expediente</div>
                  {density.evidencia.map((e, i) => <div key={i} className="text-[10px] font-mono flex gap-2" style={{ color: colors.text }}><span style={{ color: '#22c55e' }}>✓</span>{e}</div>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>CareerCenter · R-10 v2</span>
        <span style={{ color: colors.primary }}>Modo A ≥75% · Modo B &lt;75% · Etapa 3 densidad</span>
      </div>
    </div>
  );
}