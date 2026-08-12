import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface TutorialProps {
  theme: Theme;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  highlight?: string; // CSS selector to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  onDismiss: () => void;
  onSkip: () => void;
}

const TUTORIAL_STEPS_ACCOUNTING = [
  {
    title: '¡Bienvenido al Simulador!',
    description: 'Esta es tu oficina virtual. Aquí trabajarás como Contador Junior en Logística del Norte S.A. de C.V.',
    highlight: '',
    position: 'center' as const,
  },
  {
    title: 'Tu escritorio de trabajo',
    description: 'Haz clic en la pantalla del monitor para abrir tu escritorio virtual con todas las herramientas.',
    highlight: '.monitor-glow',
    position: 'bottom' as const,
  },
  {
    title: 'Bandeja de entrada',
    description: 'Revisa tus correos aquí. El Lic. Gómez te enviará instrucciones y tareas pendientes.',
    highlight: '[data-app="correo"]',
    position: 'bottom' as const,
  },
  {
    title: 'Tareas del día',
    description: 'Estas son las tareas que debes completar hoy. Haz clic en una para comenzar.',
    highlight: '[data-task]',
    position: 'right' as const,
  },
  {
    title: 'Sistema contable',
    description: 'Aquí verás el catálogo de cuentas, el libro diario y los reportes financieros.',
    highlight: '[data-app="contable"]',
    position: 'bottom' as const,
  },
  {
    title: '¡Listo para trabajar!',
    description: 'Completa las tareas para ganar puntos y mejorar tu ranking. ¡Buena suerte!',
    highlight: '',
    position: 'center' as const,
  },
];

const TUTORIAL_STEPS_DE = [
  {
    title: '¡Bienvenido al Simulador!',
    description: 'Esta es tu oficina virtual. Aquí trabajarás como Ingeniero de Datos Jr en DataFlow Analytics S.A.',
    highlight: '',
    position: 'center' as const,
  },
  {
    title: 'Tu escritorio de trabajo',
    description: 'Haz clic en la pantalla del monitor para abrir tu escritorio virtual con todas las herramientas de Data Engineering.',
    highlight: '.monitor-glow',
    position: 'bottom' as const,
  },
  {
    title: 'Bandeja de entrada',
    description: 'Revisa tus correos aquí. Ing. Sandra Mora te enviará instrucciones y tickets de trabajo.',
    highlight: '[data-app="correo"]',
    position: 'bottom' as const,
  },
  {
    title: 'Tareas del día',
    description: 'Estas son las tareas que debes completar hoy. Haz clic en una para comenzar.',
    highlight: '[data-task]',
    position: 'right' as const,
  },
  {
    title: 'Pipeline de datos',
    description: 'Aquí encontrarás dbt, Airflow, el Data Catalog y todas las herramientas del stack de datos.',
    highlight: '[data-app="dbt"]',
    position: 'bottom' as const,
  },
  {
    title: '¡Listo para trabajar!',
    description: 'Completa las tareas para ganar puntos y mejorar tu ranking. ¡Buena suerte!',
    highlight: '',
    position: 'center' as const,
  },
];

export function useTutorial(specialty: 'accounting' | 'data_engineering' = 'accounting') {
  const [tutorialStep, setTutorialStep] = useState(-1);
  const [tutorialActive, setTutorialActive] = useState(false);

  const TUTORIAL_STEPS = specialty === 'data_engineering' ? TUTORIAL_STEPS_DE : TUTORIAL_STEPS_ACCOUNTING;

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('tutorial_completed');
    if (!hasSeenTutorial) {
      setTutorialActive(true);
      setTutorialStep(0);
    }
  }, []);

  function nextStep() {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  }

  function completeTutorial() {
    setTutorialActive(false);
    setTutorialStep(-1);
    localStorage.setItem('tutorial_completed', 'true');
  }

  function skipTutorial() {
    completeTutorial();
  }

  function resetTutorial() {
    localStorage.removeItem('tutorial_completed');
    setTutorialActive(true);
    setTutorialStep(0);
  }

  return {
    tutorialActive,
    tutorialStep,
    totalSteps: TUTORIAL_STEPS.length,
    currentStep: TUTORIAL_STEPS[Math.max(0, tutorialStep)],
    nextStep,
    completeTutorial,
    skipTutorial,
    resetTutorial,
  };
}

export default function TutorialOverlay({ theme, step, totalSteps, title, description, highlight, position = 'center', onDismiss, onSkip }: TutorialProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onDismiss} />

      {/* Tutorial card */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto animate-slide-in"
        style={{ width: '90%', maxWidth: 380 }}>
        <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: isDark ? '#1e293b' : '#fff', border: `2px solid ${colors.primary}` }}>
          {/* Progress bar */}
          <div className="h-1 w-full" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
            <div className="h-full transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%`, background: colors.primary }} />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono font-bold px-2 py-1 rounded" style={{ background: colors.primary + '20', color: colors.primary }}>
                Paso {step + 1} de {totalSteps}
              </span>
              <button onClick={onSkip} className="text-[10px] font-mono cursor-pointer hover:opacity-70" style={{ color: colors.textMuted }}>
                Saltar tutorial
              </button>
            </div>

            <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>{title}</h3>
            <p className="text-[12px] leading-relaxed mb-6" style={{ color: colors.textMuted }}>{description}</p>

            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={() => onDismiss()} className="flex-1 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition hover:opacity-80"
                  style={{ background: isDark ? '#334155' : '#e5e7eb', color: colors.text }}>
                  Anterior
                </button>
              )}
              <button onClick={onDismiss} className="flex-1 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition hover:opacity-80"
                style={{ background: colors.primary, color: '#1B2632' }}>
                {step < totalSteps - 1 ? 'Siguiente' : '¡Comenzar!'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Highlight ring */}
      {highlight && (
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 0 4px ${colors.primary}` }} />
      )}
    </div>
  );
}
