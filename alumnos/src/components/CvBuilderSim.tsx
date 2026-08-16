import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface CvBuilderSimProps { theme: Theme; onBack: () => void; }

interface CvProfile {
  specialty: string;
  branch: string;
  practicePct: number;
  skills: { label: string; score: number; level: string }[];
  overall: number;
  strengths: string[];
  gaps: string[];
  extra: {
    fullName?: string; title?: string; email?: string; phone?: string; city?: string;
    linkedin?: string; github?: string; summary?: string;
    education?: { degree: string; school: string; year: string }[];
    languages?: { name: string; level: string }[];
    certificates?: string[];
    projects?: { name: string; desc: string }[];
  };
}

async function apiGet(path: string): Promise<any> { return apiFetch(path); }
async function apiPost(path: string, body?: any): Promise<any> { return apiFetch(path, { method: body ? 'POST' : 'GET', ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) }); }

const inputCls = 'bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50 w-full';

export default function CvBuilderSim({ theme, onBack }: CvBuilderSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [profile, setProfile] = useState<CvProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTex, setShowTex] = useState(false);
  const [tex, setTex] = useState('');
  const [saved, setSaved] = useState(false);
  const [demoRole, setDemoRole] = useState<'none' | 'analyst' | 'engineering' | 'science' | 'accounting'>('none');
  const demoActive = localStorage.getItem('demo_routes_override') === '1';

  const load = async () => {
    setLoading(true);
    try {
      const specialty = localStorage.getItem('sim_specialty') === 'data_engineering' ? 'data_engineering' : 'accounting';
      const q = demoActive && demoRole !== 'none' ? `&demo=${demoRole}` : '';
      const p = await apiGet(`/api/sim/cv-profile?specialty=${specialty}${q}`);
      setProfile(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [demoRole]);

  const update = (patch: Partial<CvProfile['extra']>) => {
    setProfile(p => p ? { ...p, extra: { ...p.extra, ...patch } } : p);
    setSaved(false);
  };

  const updateEdu = (i: number, patch: Partial<{ degree: string; school: string; year: string }>) => {
    setProfile(p => p ? {
      ...p,
      extra: {
        ...p.extra,
        education: (p.extra.education || []).map((e, idx) => idx === i ? { ...e, ...patch } : e),
      },
    } : p);
    setSaved(false);
  };

  const updateLang = (i: number, patch: Partial<{ name: string; level: string }>) => {
    setProfile(p => p ? {
      ...p,
      extra: {
        ...p.extra,
        languages: (p.extra.languages || []).map((l, idx) => idx === i ? { ...l, ...patch } : l),
      },
    } : p);
    setSaved(false);
  };

  const addEdu = () => setProfile(p => p ? { ...p, extra: { ...p.extra, education: [...(p.extra.education || []), { degree: '', school: '', year: '' }] } } : p);
  const addLang = () => setProfile(p => p ? { ...p, extra: { ...p.extra, languages: [...(p.extra.languages || []), { name: '', level: '' }] } } : p);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await apiPost('/api/sim/cv-profile', profile.extra);
      setSaved(true);
    } catch (e: any) { console.error(e); }
    finally { setSaving(false); }
  };

  const download = async (kind: 'pdf' | 'tex') => {
    if (!profile) return;
    const specialty = localStorage.getItem('sim_specialty') === 'data_engineering' ? 'data_engineering' : 'accounting';
    const demoQ = demoActive && demoRole !== 'none' ? `&demo=${demoRole}` : '';
    try {
      const token = localStorage.getItem('supabase_auth_token') || '';
      const base = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${base}/api/sim/cv/${kind}?specialty=${specialty}${demoQ}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = kind === 'pdf' ? `CV-${(profile.extra.fullName || 'alumno').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf` : 'cv.tex';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const showTexSource = async () => {
    if (tex) { setShowTex(v => !v); return; }
    const specialty = localStorage.getItem('sim_specialty') === 'data_engineering' ? 'data_engineering' : 'accounting';
    const demoQ = demoActive && demoRole !== 'none' ? `&demo=${demoRole}` : '';
    try {
      const token = localStorage.getItem('supabase_auth_token') || '';
      const base = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${base}/api/sim/cv/tex?specialty=${specialty}${demoQ}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTex(await res.text());
      setShowTex(true);
    } catch (e) { console.error(e); }
  };

  const brandName = 'Simulador Laboral Institucional';

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {/* Barra */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📄</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>CV Institucional — Perfil de egreso</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#FFB16220', color: '#FFB162' }}>{brandName}</span>
        <div className="flex-1" />
        <button onClick={save} disabled={saving} className="text-[11px] font-bold px-3 py-1.5 rounded-lg border-2 cursor-pointer hover:opacity-85 disabled:opacity-50" style={{ borderColor: '#FFB162', background: '#FFB162', color: '#1B2632' }}>
          {saving ? 'Guardando...' : '💾 Guardar'}
        </button>
        {saved && <span className="text-[10px]" style={{ color: '#22c55e' }}>✓ guardado</span>}
      </div>

      {demoActive && (
        <div className="px-4 py-2 border-b-2 flex items-center gap-2 flex-wrap" style={{ borderColor: colors.border, background: '#f59e0b10' }}>
          <span className="text-[9px] font-mono font-bold uppercase" style={{ color: '#f59e0b' }}>⚡ Modo DEMO — generar CV como si completado:</span>
          {([
            { id: 'none' as const, label: 'Mis datos reales' },
            { id: 'analyst' as const, label: '🧭 Analista de Datos' },
            { id: 'engineering' as const, label: '🔀 Ingeniero de Datos' },
            { id: 'science' as const, label: '🧪 Científico de Datos' },
            { id: 'accounting' as const, label: '📊 Contador General' },
          ]).map(o => (
            <button key={o.id} onClick={() => { setDemoRole(o.id); setTex(''); setShowTex(false); }}
              className="px-2 py-1 rounded-lg border text-[10px] font-mono cursor-pointer hover:opacity-80"
              style={{ borderColor: demoRole === o.id ? '#f59e0b' : '#f59e0b40', background: demoRole === o.id ? '#f59e0b' : 'transparent', color: demoRole === o.id ? '#1B2632' : '#f59e0b' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {loading && !profile ? (
          <div className="p-10 text-center text-xs text-slate-500">Cargando perfil...</div>
        ) : profile ? (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Resumen del desempeño */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <h3 className="text-[11px] font-bold font-mono uppercase mb-3" style={{ color: colors.textMuted }}>
                🎯 Desempeño en el simulador · {profile.specialty === 'data_engineering' ? 'Especialidad Data' : 'Contabilidad'} · {profile.branch}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: colors.primary }}>{profile.practicePct}%</div>
                  <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>práctica</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: colors.primary }}>{profile.overall}/100</div>
                  <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>dominio general</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{profile.skills.length}</div>
                  <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>habilidades</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{profile.strengths.length}</div>
                  <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>fortalezas</div>
                </div>
              </div>
              {profile.skills.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {profile.skills.map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono w-36 shrink-0" style={{ color: colors.text }}>{s.label}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}>
                        <div className="h-full" style={{ width: `${s.score}%`, background: s.score >= 80 ? '#22c55e' : s.score >= 60 ? '#FFB162' : '#ef4444' }} />
                      </div>
                      <span className="text-[9px] font-mono w-24 text-right" style={{ color: colors.textMuted }}>{s.score}% · {s.level}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Datos del CV */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <h3 className="text-[11px] font-bold font-mono uppercase mb-3" style={{ color: colors.textMuted }}>📋 Tus datos para el CV</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono block mb-1" style={{ color: colors.textMuted }}>Nombre completo</label>
                  <input className={inputCls} value={profile.extra.fullName || ''} onChange={e => update({ fullName: e.target.value })} placeholder="Ej. Ana García" />
                </div>
                <div>
                  <label className="text-[10px] font-mono block mb-1" style={{ color: colors.textMuted }}>Título profesional</label>
                  <input className={inputCls} value={profile.extra.title || ''} onChange={e => update({ title: e.target.value })} placeholder="Ej. Analista de Datos" />
                </div>
                <div>
                  <label className="text-[10px] font-mono block mb-1" style={{ color: colors.textMuted }}>Correo</label>
                  <input className={inputCls} type="email" value={profile.extra.email || ''} onChange={e => update({ email: e.target.value })} placeholder="correo@ejemplo.mx" />
                </div>
                <div>
                  <label className="text-[10px] font-mono block mb-1" style={{ color: colors.textMuted }}>Teléfono</label>
                  <input className={inputCls} value={profile.extra.phone || ''} onChange={e => update({ phone: e.target.value })} placeholder="55-0000-0000" />
                </div>
                <div>
                  <label className="text-[10px] font-mono block mb-1" style={{ color: colors.textMuted }}>Ciudad</label>
                  <input className={inputCls} value={profile.extra.city || ''} onChange={e => update({ city: e.target.value })} placeholder="CDMX" />
                </div>
                <div>
                  <label className="text-[10px] font-mono block mb-1" style={{ color: colors.textMuted }}>LinkedIn</label>
                  <input className={inputCls} value={profile.extra.linkedin || ''} onChange={e => update({ linkedin: e.target.value })} placeholder="linkedin.com/in/usuario" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-mono block mb-1" style={{ color: colors.textMuted }}>Resumen profesional</label>
                  <textarea className={inputCls + ' h-16 resize-none'} value={profile.extra.summary || ''} onChange={e => update({ summary: e.target.value })} placeholder="Perfil verificado en simulador laboral institucional..." />
                </div>
              </div>
            </div>

            {/* Educación */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold font-mono uppercase" style={{ color: colors.textMuted }}>🎓 Educación</h3>
                <button onClick={addEdu} className="text-[10px] font-bold px-2 py-1 rounded-lg border-2 cursor-pointer hover:opacity-80" style={{ borderColor: colors.primary, color: colors.primary }}>+ Agregar</button>
              </div>
              {(profile.extra.education || []).map((ed, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <input className={inputCls} value={ed.degree || ''} onChange={e => updateEdu(i, { degree: e.target.value })} placeholder="Grado (Ing. en Sistemas)" />
                  <input className={inputCls} value={ed.school || ''} onChange={e => updateEdu(i, { school: e.target.value })} placeholder="Institución" />
                  <input className={inputCls} value={ed.year || ''} onChange={e => updateEdu(i, { year: e.target.value })} placeholder="Año" />
                </div>
              ))}
              {!(profile.extra.education || []).length && <p className="text-[10px]" style={{ color: colors.textMuted }}>Sin educación registrada. Agrega tu formación.</p>}
            </div>

            {/* Idiomas */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold font-mono uppercase" style={{ color: colors.textMuted }}>🌐 Idiomas</h3>
                <button onClick={addLang} className="text-[10px] font-bold px-2 py-1 rounded-lg border-2 cursor-pointer hover:opacity-80" style={{ borderColor: colors.primary, color: colors.primary }}>+ Agregar</button>
              </div>
              {(profile.extra.languages || []).map((l, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input className={inputCls} value={l.name || ''} onChange={e => updateLang(i, { name: e.target.value })} placeholder="Idioma (Inglés)" />
                  <input className={inputCls} value={l.level || ''} onChange={e => updateLang(i, { level: e.target.value })} placeholder="Nivel (B2 / Avanzado)" />
                </div>
              ))}
              {!(profile.extra.languages || []).length && <p className="text-[10px]" style={{ color: colors.textMuted }}>Sin idiomas registrados.</p>}
            </div>

            {/* Exportación */}
            <div className="rounded-xl border-2 p-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <h3 className="text-[11px] font-bold font-mono uppercase mb-3" style={{ color: colors.textMuted }}>📤 Exportar CV</h3>
              <p className="text-[10px] mb-3" style={{ color: colors.textMuted }}>
                Guarda tus datos primero y luego genera tu CV. El PDF es semántico (texto seleccionable, ideal para bolsas de trabajo). También puedes descargar el .tex y abrirlo en Overleaf.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => download('pdf')} className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer hover:opacity-85" style={{ borderColor: '#FFB162', background: '#FFB162', color: '#1B2632' }}>⬇️ Descargar PDF</button>
                <button onClick={() => download('tex')} className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer hover:opacity-85" style={{ borderColor: colors.primary, color: colors.primary }}>📄 Descargar .tex</button>
                <button onClick={showTexSource} className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer hover:opacity-85" style={{ borderColor: colors.border, color: colors.textMuted }}>👁 Ver fuente LaTeX</button>
              </div>
              {showTex && (
                <pre className="mt-3 p-3 rounded-xl font-mono text-[9px] overflow-auto max-h-64" style={{ background: isDark ? '#0a0f1a' : '#1e293b', color: '#e2e8f0' }}>
                  {tex || 'Genera el .tex primero (botón Descargar .tex).'}
                </pre>
              )}
            </div>

            <p className="text-[9px] text-center pb-4" style={{ color: colors.textMuted }}>
              Documento con marca {brandName} · validación académica simulada · no constituye experiencia laboral real.
            </p>
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">No se pudo cargar el perfil.</div>
        )}
      </div>
    </div>
  );
}
