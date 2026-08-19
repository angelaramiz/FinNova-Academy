import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface CareerCenterProps { theme: Theme; onBack: () => void; onOpenTool?: (tool: string) => void; }

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
  persisted?: boolean;
}

interface Diagnosis {
  assessment_id: string;
  vacancy: { title?: string; skills?: any[]; requires_experience?: boolean; source?: string };
  match_pct: number;
  breakdown: any;
  top_gaps: string[];
  covered: string[];
  routing: string;
  needs_experience: boolean;
  source: string;
  tracked?: boolean;
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

const TOOL_LABEL: Record<string, string> = {
  sql: 'SQL Sim', spreadsheet: 'Excel Sim', dbt: 'dbt Sim', notebook: 'Notebook',
  pipeline: 'Foundry', airflow: 'Airflow', cloud: 'Cloud', bi: 'BI Sim',
  accounting: 'Contable', banking: 'Banco', catalog: 'Catalog', monitor: 'Monitor',
};

const ROUTING_LABEL: Record<string, string> = {
  ETAPA_2_MODO_A: 'Etapa 2 · Modo A (postulación asistida)',
  ETAPA_2_MODO_B: 'Etapa 2 · Modo B (simulador intensivo)',
  ETAPA_3: 'Etapa 3 (experiencia comprobable)',
};

export default function CareerCenter({ theme, onBack, onOpenTool }: CareerCenterProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'diag' | 'kit' | 'intensive' | 'density' | 'outcome'>('diag');

  // ── Etapa 1 — Diagnóstico
  const [vacancyText, setVacancyText] = useState('');
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [prueba, setPrueba] = useState<Record<string, boolean>>({});
  const [assessments, setAssessments] = useState<any[]>([]);
  const [reevalMsg, setReevalMsg] = useState<string | null>(null);

  // ── Modo A — kit
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [match, setMatch] = useState(0);
  const [kit, setKit] = useState<Kit | null>(null);
  const [kitLoading, setKitLoading] = useState(false);

  // ── Modo B — intensivo
  const [gaps, setGaps] = useState('');
  const [plan, setPlan] = useState<AppliedCaseUI[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  // ── Etapa 3 — densidad
  const [density, setDensity] = useState<DensityUI | null>(null);
  const [densLoading, setDensLoading] = useState(false);
  const [densInput, setDensInput] = useState({ casos: 0, complejidad: 0, variedad: 0, incidentes: 0, resultados: 0 });

  useEffect(() => { loadAssessments(); }, []);

  async function loadAssessments() {
    const d = await apiFetch('/api/stage1/assessments');
    setAssessments(d.assessments || []);
  }

  async function runAnalyze() {
    setDiagLoading(true); setReevalMsg(null); setPrueba({});
    const d = await apiFetch('/api/stage1/analyze', { method: 'POST', body: JSON.stringify({ vacancyText }) });
    if (d?.error) { setReevalMsg(d.error); } else { setDiag(d); }
    setDiagLoading(false);
  }

  async function runSubmit() {
    if (!diag) return; setSubmitLoading(true);
    const d = await apiFetch('/api/stage1/submit', { method: 'POST', body: JSON.stringify({ assessmentId: diag.assessment_id, answers: prueba }) });
    if (d?.error) { setReevalMsg(d.error); } else { setDiag({ ...d, tracked: d.tracked }); await loadAssessments(); }
    setSubmitLoading(false);
  }

  async function runReevaluate(assessmentId: string) {
    setReevalMsg(null);
    const d = await apiFetch('/api/stage1/reevaluate', { method: 'POST', body: JSON.stringify({ assessmentId }) });
    if (d?.error) { setReevalMsg(d.error); } else { setDiag(d); setReevalMsg(`Reevaluado: match ${d.match_pct}% → ${ROUTING_LABEL[d.routing] || d.routing}`); await loadAssessments(); }
  }

  async function buildKit() {
    setKitLoading(true);
    const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
    const d = await apiFetch('/api/stage1/kit', { method: 'POST', body: JSON.stringify({ vacancyTitle: title, skillsTarget: skillsList, match_pct: match }) });
    setKit(d); setKitLoading(false);
  }

  async function buildPlan() {
    setPlanLoading(true);
    const gapsList = gaps.split(',').map(s => s.trim()).filter(Boolean);
    const d = await apiFetch('/api/stage1/intensive', { method: 'POST', body: JSON.stringify({ assessmentId: diag?.assessment_id || 'manual', gaps: gapsList }) });
    setPlan(d.cases || []); setPlanLoading(false);
  }

  async function computeDensity() {
    setDensLoading(true);
    const d = await apiFetch('/api/stage1/density', { method: 'POST', body: JSON.stringify(densInput) });
    setDensity(d); setDensLoading(false);
  }

  // ── Resultado real (R-11 T6, consentido) — cierra el ciclo del flywheel
  const [outApplied, setOutApplied] = useState('');
  const [outInterviews, setOutInterviews] = useState('');
  const [outHired, setOutHired] = useState(false);
  const [outSkills, setOutSkills] = useState('');
  const [outConsent, setOutConsent] = useState(false);
  const [outResult, setOutResult] = useState<any>(null);
  const [outLoading, setOutLoading] = useState(false);

  async function saveOutcome() {
    setOutLoading(true);
    const d = await apiFetch('/api/stage1/outcome', {
      method: 'POST',
      body: JSON.stringify({
        applied: Number(outApplied) || 0,
        interviews: Number(outInterviews) || 0,
        hired: outHired,
        skills_entrevista: outSkills.split(',').map(s => s.trim()).filter(Boolean),
        consent: outConsent,
      }),
    });
    setOutResult(d); setOutLoading(false);
  }

  const field = (v: string) => ({ borderColor: colors.border, background: isDark ? '#0f172a' : '#fff', color: colors.text });
  const btn = { background: colors.primary, color: '#fff' };
  const openTool = (tool: string) => { if (onOpenTool && TOOL_LABEL[tool]) onOpenTool(tool); };

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3 flex-wrap" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">💼</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Centro de Carrera</span>
        <div className="flex-1" />
        {(['diag', 'kit', 'intensive', 'density', 'outcome'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="text-[10px] px-2 py-1 rounded-full font-bold cursor-pointer" style={{ background: tab === t ? colors.primary : 'transparent', color: tab === t ? '#fff' : colors.textMuted }}>
            {t === 'diag' ? '🔎 Diagnóstico' : t === 'kit' ? 'Modo A · Kit' : t === 'intensive' ? 'Modo B · Intensivo' : t === 'density' ? 'Etapa 3 · Densidad' : '🎯 Resultado real'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {tab === 'diag' && (
          <>
            <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Etapa 1 · Diagnóstico: pega una vacante, detectamos los skills, evaluamos tu match y te enrutamos automáticamente (Modo A ≥ 75% / Modo B &lt; 75% / Etapa 3).</p>
            <textarea placeholder="Pega aquí el texto completo de la vacante (responsabilidades, requisitos, años de experiencia…)" value={vacancyText} onChange={e => setVacancyText(e.target.value)} rows={6} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none resize-none" style={field(vacancyText)} />
            <button onClick={runAnalyze} disabled={diagLoading} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer" style={{ ...btn, opacity: diagLoading ? 0.6 : 1 }}>
              {diagLoading ? 'Analizando vacante…' : '🔎 Analizar vacante'}
            </button>

            {reevalMsg && <div className="text-[11px] px-3 py-2 rounded-lg font-mono" style={{ background: '#3b82f620', color: '#3b82f6' }}>{reevalMsg}</div>}

            {diag && (
              <div className="rounded-xl border-2 p-3 space-y-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>{diag.vacancy.title || 'Vacante'}</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: diag.source === 'ai' ? '#8b5cf620' : '#64748b30', color: diag.source === 'ai' ? '#8b5cf6' : '#94a3b8' }}>{diag.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold font-mono" style={{ color: diag.match_pct >= 75 ? '#22c55e' : diag.match_pct >= 50 ? '#f59e0b' : '#ef4444' }}>{diag.match_pct}%</div>
                  <div className="text-[11px] font-mono" style={{ color: colors.text }}>match</div>
                </div>
                <div className="text-[11px] font-bold font-mono px-2 py-1 rounded-lg" style={{ background: diag.routing === 'ETAPA_2_MODO_A' ? '#22c55e20' : diag.routing === 'ETAPA_2_MODO_B' ? '#3b82f620' : '#a855f720', color: diag.routing === 'ETAPA_2_MODO_A' ? '#22c55e' : diag.routing === 'ETAPA_2_MODO_B' ? '#3b82f6' : '#a855f7' }}>
                  🧭 {ROUTING_LABEL[diag.routing] || diag.routing}
                </div>
                {diag.needs_experience && <div className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>⚠ La vacante exige experiencia ({diag.vacancy.requires_experience ? 'sí' : 'no'}).</div>}

                {diag.covered.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>✅ Cubiertos</div>
                    <div className="flex flex-wrap gap-1.5">{diag.covered.map(s => <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#22c55e20', color: '#22c55e' }}>{s}</span>)}</div>
                  </div>
                )}
                {diag.top_gaps.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>🔻 Gaps a reforzar</div>
                    <div className="flex flex-wrap gap-1.5">{diag.top_gaps.map(s => <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#ef444420', color: '#ef4444' }}>{s}</span>)}</div>
                  </div>
                )}

                {diag.routing === 'ETAPA_2_MODO_B' && diag.top_gaps.length > 0 && (
                  <>
                    <div className="text-[10px] font-bold font-mono mt-2" style={{ color: colors.textMuted }}>📝 Prueba rápida: confirma tu dominio de los gaps</div>
                    <div className="flex flex-wrap gap-1.5">
                      {diag.top_gaps.map(s => (
                        <label key={s} className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full cursor-pointer" style={{ background: prueba[s] ? '#22c55e20' : colors.cardSecondary, color: colors.text }}>
                          <input type="checkbox" checked={!!prueba[s]} onChange={e => setPrueba({ ...prueba, [s]: e.target.checked })} className="accent-emerald-500" />
                          {s}
                        </label>
                      ))}
                    </div>
                    <button onClick={runSubmit} disabled={submitLoading} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer mt-1" style={{ ...btn, opacity: submitLoading ? 0.6 : 1 }}>
                      {submitLoading ? 'Enviando…' : 'Enviar y registrar en seguimiento'}
                    </button>
                  </>
                )}
                {diag.tracked && <div className="text-[10px] font-mono" style={{ color: '#22c55e' }}>✓ Vacante registrada en seguimiento (Etapa 2).</div>}
              </div>
            )}

            {assessments.length > 0 && (
              <div className="rounded-xl border-2 p-3 space-y-1.5" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>🧾 Diagnósticos previos — reevaluar</div>
                {assessments.map(a => (
                  <div key={a.assessment_id} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="truncate flex-1" style={{ color: colors.text }}>{a.title} · {a.match_pct}%</span>
                    <span className="text-[9px]" style={{ color: colors.textMuted }}>{ROUTING_LABEL[a.routing] || a.routing}</span>
                    <button onClick={() => runReevaluate(a.assessment_id)} className="text-[9px] px-2 py-0.5 rounded-lg border font-bold cursor-pointer" style={{ borderColor: colors.primary, color: colors.primary }}>Reevaluar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

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
            <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Plan intensivo (Modo B): un caso aplicado por cada skill con score &lt; 75. Cada caso abre la herramienta real del puesto y termina con reflexión.</p>
            <div className="space-y-2">
              <input placeholder="Skills débiles (gaps, separados por coma, ej: Airflow, dbt)" value={gaps} onChange={e => setGaps(e.target.value)} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none" style={field(gaps)} />
              <button onClick={buildPlan} disabled={planLoading} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer" style={{ ...btn, opacity: planLoading ? 0.6 : 1 }}>
                {planLoading ? 'Construyendo plan…' : 'Generar plan intensivo'}
              </button>
            </div>
            {plan.map((c, i) => (
              <div key={c.id} className="rounded-xl border-2 p-3 space-y-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: colors.primary + '20', color: colors.primary }}>Caso {i + 1}</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>{c.skill}</span>
                  <button onClick={() => openTool(c.tool)} disabled={!onOpenTool || !TOOL_LABEL[c.tool]} className="text-[9px] px-2 py-0.5 rounded-lg border font-bold cursor-pointer" style={{ borderColor: '#3b82f6', color: '#3b82f6', opacity: !onOpenTool || !TOOL_LABEL[c.tool] ? 0.5 : 1 }}>
                    🛠 Abrir {TOOL_LABEL[c.tool] || c.tool}
                  </button>
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
            {plan.length > 0 && (
              <button onClick={() => diag?.assessment_id && runReevaluate(diag.assessment_id)} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer" style={{ background: '#22c55e', color: '#fff' }}>
                🔁 Reevaluar tras completar el plan (migra a Modo A si match ≥ 75%)
              </button>
            )}
          </>
        )}

        {tab === 'density' && (
          <>
            <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Densidad de experiencia (Etapa 3): la experiencia no se mide solo en años. Se guarda en tu perfil como evidencia comprobable.</p>
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
                {density.persisted && <div className="text-[10px] font-mono" style={{ color: '#22c55e' }}>✓ Guardada en tu perfil como evidencia.</div>}
                <div>
                  <div className="text-[10px] font-bold font-mono mb-1" style={{ color: colors.textMuted }}>Evidencia para el expediente</div>
                  {density.evidencia.map((e, i) => <div key={i} className="text-[10px] font-mono flex gap-2" style={{ color: colors.text }}><span style={{ color: '#22c55e' }}>✓</span>{e}</div>)}
                </div>
              </div>
            )}
          </>
        )}
        {tab === 'outcome' && (
          <>
            <p className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Resultado real (R-11 T6): registra con consentimiento qué pasó con tu búsqueda. Esto cierra el ciclo del flywheel: el sistema aprende qué skills sí consiguen empleo y pesa tu ruta en consecuencia.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Aplicaciones enviadas</label>
                <input type="number" min={0} value={outApplied} onChange={e => setOutApplied(e.target.value)} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none mt-0.5" style={field(outApplied)} />
              </div>
              <div>
                <label className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Entrevistas</label>
                <input type="number" min={0} value={outInterviews} onChange={e => setOutInterviews(e.target.value)} className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none mt-0.5" style={field(outInterviews)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[11px] font-mono cursor-pointer" style={{ color: colors.text }}>
              <input type="checkbox" checked={outHired} onChange={e => setOutHired(e.target.checked)} /> ¿Conseguiste empleo?
            </label>
            <div>
              <label className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Skills que te preguntaron en entrevistas (separados por coma)</label>
              <input value={outSkills} onChange={e => setOutSkills(e.target.value)} placeholder="sql, python, excel" className="w-full text-[11px] font-mono rounded-lg px-3 py-2 outline-none mt-0.5" style={field(outSkills)} />
            </div>
            <label className="flex items-start gap-2 text-[10px] font-mono cursor-pointer" style={{ color: colors.textMuted }}>
              <input type="checkbox" checked={outConsent} onChange={e => setOutConsent(e.target.checked)} className="mt-0.5" />
              <span>Consiento guardar este resultado de forma anonimizada (hash irreversible, sin datos personales) para mejorar el simulador. Puedo borrarlo después.</span>
            </label>
            <button onClick={saveOutcome} disabled={outLoading || !outConsent} className="w-full text-[11px] font-bold font-mono rounded-lg px-3 py-2 cursor-pointer" style={{ ...btn, opacity: outLoading || !outConsent ? 0.5 : 1 }}>
              {outLoading ? 'Guardando…' : 'Guardar resultado'}
            </button>
            {outResult?.ok && (
              <div className="rounded-xl border-2 p-3" style={{ borderColor: '#22c55e', background: colors.cardBg }}>
                <div className="text-[11px] font-mono" style={{ color: '#22c55e' }}>✓ Guardado. Aplicaciones: {outResult.outcome.applied} · Entrevistas: {outResult.outcome.interviews} · Empleo: {outResult.outcome.hired ? 'Sí' : 'Aún no'}</div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>CareerCenter · R-10 v2</span>
        <span style={{ color: colors.primary }}>Diagnóstico → Seguimiento → Densidad</span>
      </div>
    </div>
  );
}