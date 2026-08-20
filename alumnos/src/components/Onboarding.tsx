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
  { id: 'b0000000-0000-0000-0000-000000000001', title: 'Auxiliar Contable', desc: 'Registro de operaciones diarias, facturación, conciliación bancaria', difficulty: 1, specialty: 'accounting' },
  { id: 'b0000000-0000-0000-0000-000000000002', title: 'Analista de Cuentas por Pagar', desc: 'Gestión de proveedores, programación de pagos, conciliación CxP', difficulty: 2, specialty: 'accounting' },
  { id: 'b0000000-0000-0000-0000-000000000003', title: 'Analista de Datos', desc: 'SQL, Python, profiling, calidad de datos — desbloquea Ingeniería o Ciencia con tu práctica', difficulty: 1, specialty: 'data_engineering' },
  { id: 'b0000000-0000-0000-0000-000000000004', title: 'Practicante de Contabilidad', desc: 'Prácticas profesionales guiadas por módulos: CFDI, gastos, nómina, conciliación — con guía paso a paso', difficulty: 1, specialty: 'practicas' },
];

function jobForSpecialty(specialty: string, difficulty: number): typeof JOBS[0] {
  if (specialty === 'data_engineering') {
    return JOBS.find(j => j.specialty === 'data_engineering') || JOBS[0];
  }
  if (specialty === 'practicas') {
    return JOBS.find(j => j.specialty === 'practicas') || JOBS[0];
  }
  return JOBS.find(j => j.specialty === 'accounting' && j.difficulty === difficulty) || JOBS[0];
}

const SPECIALTIES = [
  { id: 'accounting', label: 'Contabilidad', desc: 'Contador General Junior — Facturación, impuestos, reportes financieros', icon: '📊' },
  { id: 'practicas', label: 'Prácticas Profesionales', desc: 'Para alumnos de contabilidad (mitad o ¾ de carrera): aprende el oficio por módulos con guía paso a paso (CFDI, gastos, nómina, conciliación)', icon: '🎓' },
  { id: 'data_engineering', label: 'Data Engineering', desc: 'Analista de Datos (ruta inicial) — Desbloquea Ingeniería o Ciencia de Datos con tu práctica', icon: '🔀' },
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
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    setSaving(true);
    try {
      // Persistir localmente ANTES de la llamada API para que un remount
      // posterior no reinicie a la bienvenida (anti-reset, FALLA prod).
      localStorage.setItem('sim_specialty', selectedSpecialty);
      localStorage.setItem('sim_assigned_job', JSON.stringify(selectedJob));
      localStorage.setItem('sim_visited', '1');
      await api('/api/sim/subscribe', {});
      await api('/api/sim/onboarding', {
        simulationProfile: simProfile,
        experienceLevel: experience,
        assignedJobId: selectedJob.id,
        assignedCompanyId: selectedCompany.id,
        specialty: selectedSpecialty,
      });
      // R-11: consentimiento explícito y revocable de telemetría anonimizada.
      try {
        await api('/api/sim/telemetry', { events: [{ stage: 0, type: 'consent_given', ref: { specialty: selectedSpecialty }, data: { consented: true } }] });
      } catch { /* no bloquea el onboarding */ }
      onComplete();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function handleContinue() {
    if (step === 0) setStep(1);
    else if (step === 1 && simProfile) setStep(2);
    else if (step === 2 && selectedSpecialty) setStep(3);
    else if (step === 3 && experience) setStep(4);
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

    // Step 2: Specialty selection
    <div key="specialty" className="space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold text-center" style={{ color: colors.text }}>¿Qué especialidad?</h2>
      <p className="text-xs text-center" style={{ color: colors.textMuted }}>Selecciona el área en la que quieres trabajar</p>
      {SPECIALTIES.map(s => (
        <button key={s.id} onClick={() => { setSelectedSpecialty(s.id); setSelectedJob(jobForSpecialty(s.id, 1)); }}
          className="w-full text-left p-5 rounded-xl border-2 transition cursor-pointer hover:scale-[1.01]"
          style={{
            borderColor: selectedSpecialty === s.id ? colors.primary : colors.border,
            background: selectedSpecialty === s.id ? colors.primary + '15' : colors.cardBg,
            boxShadow: `4px 4px 0px 0px ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.text }}>{s.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{s.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>,

    // Step 3: Experience level
    <div key="experience" className="space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold text-center" style={{ color: colors.text }}>¿Cuál es tu nivel de experiencia?</h2>
      {LEVELS.map(l => (
        <button key={l.id} onClick={() => { setExperience(l.id); setSelectedJob(jobForSpecialty(selectedSpecialty, l.id === 'beginner' ? 1 : 2)); }}
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

    // Step 4: Summary
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
          <span className="text-2xl">{selectedSpecialty === 'data_engineering' ? '🔀' : selectedSpecialty === 'practicas' ? '🎓' : '📊'}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: colors.text }}>{selectedSpecialty === 'data_engineering' ? 'Data Engineering' : selectedSpecialty === 'practicas' ? 'Prácticas Profesionales' : 'Contabilidad'}</p>
            <p className="text-[11px]" style={{ color: colors.textMuted }}>Especialidad</p>
          </div>
        </div>
        <div className="border-t" style={{ borderColor: colors.border }}></div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: colors.primary, color: '#1B2632' }}>
            {(selectedJob?.title || '?').charAt(0)}
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
            width: `${((step + 1) / 5) * 100}%`,
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

          {step < 4 ? (
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
