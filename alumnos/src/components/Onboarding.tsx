import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface OnboardingProps {
  theme: Theme;
  onComplete: () => void;
}

import { apiFetch } from '../lib/api';

const api = (path: string, body: any) => apiFetch(path, {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});

const COMPANIES = [
  { id: '00000001-0000-0000-0000-000000000001', name: 'Operadora Logística del Norte', type: 'pyme', desc: 'PYME familiar · 45 empleados · Sector logística', icon: '🏢', color: '#FFB162' },
  { id: '00000001-0000-0000-0000-000000000002', name: 'Grupo Financiero Corporativo', type: 'corporate', desc: 'Gran corporativo · 2,500+ empleados · Sector financiero', icon: '🏛️', color: '#A35139' },
];

const JOBS = [
  { id: 'b0000000-0000-0000-0000-000000000001', title: 'Auxiliar Contable', desc: 'Registro de operaciones diarias, facturación, conciliación bancaria', difficulty: 1 },
  { id: 'b0000000-0000-0000-0000-000000000002', title: 'Analista de Cuentas por Pagar', desc: 'Gestión de proveedores, programación de pagos, conciliación CxP', difficulty: 2 },
];

const LEVELS = [
  { id: 'beginner', label: 'Junior', desc: 'Poco o nada de experiencia profesional', icon: '🌱' },
  { id: 'intermediate', label: 'Semi-Senior', desc: 'Conocimientos básicos de contabilidad', icon: '📈' },
];

export default function Onboarding({ theme, onComplete }: OnboardingProps) {
  const colors = themeColors[theme];
  const [step, setStep] = useState(0);
  const [simProfile, setSimProfile] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [selectedJob, setSelectedJob] = useState(JOBS[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    setSaving(true);
    try {
      await api('/api/sim/subscribe', {});
      await api('/api/sim/onboarding', {
        simulationProfile: simProfile,
        experienceLevel: experience,
        assignedJobId: selectedJob.id,
        assignedCompanyId: selectedCompany.id,
      });
      onComplete();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function handleContinue() {
    if (step === 0) setStep(1);
    else if (step === 1 && simProfile) setStep(2);
    else if (step === 2 && experience) setStep(3);
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="flex flex-col items-center text-center space-y-8 animate-fade-in py-12">
      <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl" style={{
        background: colors.primary, border: `3px solid ${colors.border}`,
        boxShadow: `6px 6px 0px 0px ${colors.border}`,
      }}>💼</div>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>¡Bienvenido al Simulador Laboral!</h1>
        <p className="text-sm mt-3 max-w-lg leading-relaxed" style={{ color: colors.textMuted }}>
          Vas a vivir la experiencia de trabajar en un puesto contable real.
          Primero, cuéntanos un poco sobre ti para asignarte la mejor posición.
        </p>
      </div>
      {loading ? (
        <div className="w-8 h-8 rounded-full border-3 animate-spin" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
      ) : null}
    </div>,

    // Step 1: Simulation profile
    <div key="profile" className="space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold text-center" style={{ color: colors.text }}>¿Qué tipo de empresa te interesa?</h2>
      <p className="text-xs text-center" style={{ color: colors.textMuted }}>Esto definirá el contexto de tus tareas diarias</p>
      {COMPANIES.map(c => (
        <button key={c.id} onClick={() => { setSimProfile(c.type); setSelectedCompany(c); }}
          className="w-full text-left p-5 rounded-xl border-2 transition cursor-pointer hover:scale-[1.01]"
          style={{
            borderColor: simProfile === c.type ? colors.primary : colors.border,
            background: simProfile === c.type ? colors.primary + '15' : colors.cardBg,
            boxShadow: `4px 4px 0px 0px ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{c.icon}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.text }}>{c.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{c.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>,

    // Step 2: Experience level
    <div key="experience" className="space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold text-center" style={{ color: colors.text }}>¿Cuál es tu nivel de experiencia?</h2>
      {LEVELS.map(l => (
        <button key={l.id} onClick={() => { setExperience(l.id); setSelectedJob(JOBS.find(j => j.difficulty === (l.id === 'beginner' ? 1 : 2)) || JOBS[0]); }}
          className="w-full text-left p-5 rounded-xl border-2 transition cursor-pointer hover:scale-[1.01]"
          style={{
            borderColor: experience === l.id ? colors.primary : colors.border,
            background: experience === l.id ? colors.primary + '15' : colors.cardBg,
            boxShadow: `4px 4px 0px 0px ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{l.icon}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.text }}>{l.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{l.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>,

    // Step 3: Summary
    <div key="summary" className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold text-center" style={{ color: colors.text }}>Tu perfil fue asignado</h2>
      <div className="p-6 rounded-xl border-2 space-y-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <div className="flex items-center gap-4">
          <span className="text-2xl">{selectedCompany.icon}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: colors.text }}>{selectedCompany.name}</p>
            <p className="text-[11px]" style={{ color: colors.textMuted }}>Empresa asignada</p>
          </div>
        </div>
        <div className="border-t" style={{ borderColor: colors.border }}></div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: colors.primary, color: '#1B2632' }}>
            {selectedJob.title.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: colors.text }}>{selectedJob.title}</p>
            <p className="text-[11px]" style={{ color: colors.textMuted }}>Puesto asignado</p>
          </div>
        </div>
        <div className="border-t" style={{ borderColor: colors.border }}></div>
        <div className="flex items-center gap-4">
          <span className="text-2xl">{experience === 'beginner' ? '🌱' : '📈'}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: colors.text }}>{experience === 'beginner' ? 'Junior' : 'Semi-Senior'}</p>
            <p className="text-[11px]" style={{ color: colors.textMuted }}>Nivel</p>
          </div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center p-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-2xl rounded-2xl border-2 shadow-2xl overflow-hidden" style={{
        borderColor: colors.border,
        background: colors.cardBg,
        boxShadow: `10px 10px 0px 0px ${colors.border}`,
      }}>
        {/* Progress bar */}
        <div className="h-2" style={{ background: colors.bg }}>
          <div className="h-full transition-all duration-500" style={{
            width: `${((step + 1) / 4) * 100}%`,
            background: colors.primary,
          }} />
        </div>

        <div className="p-8">
          {steps[step]}
        </div>

        <div className="px-8 pb-8 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer hover:opacity-75"
              style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}
            >← Atrás</button>
          ) : <div />}

          {step < 3 ? (
            <button onClick={handleContinue}
              className="px-8 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer hover:opacity-85 transition"
              style={{
                borderColor: colors.primary,
                background: colors.primary,
                color: '#1B2632',
                boxShadow: `4px 4px 0px 0px ${colors.border}`,
              }}
            >Continuar →</button>
          ) : (
            <button onClick={handleStart} disabled={saving}
              className="px-8 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer hover:opacity-85 transition disabled:opacity-50"
              style={{
                borderColor: colors.primary,
                background: colors.primary,
                color: '#1B2632',
                boxShadow: `4px 4px 0px 0px ${colors.border}`,
              }}
            >{saving ? 'Guardando...' : '¡Empezar!'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
