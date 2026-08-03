import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface ProgressDashboardProps { theme: Theme; onBack: () => void; }

interface MonthProgress {
  month: number;
  year: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  avgScore: number;
  passRate: number;
  streak: number;
  bestStreak: number;
  totalHours: number;
  byCategory: Record<string, { completed: number; total: number; avgScore: number }>;
  byDifficulty: Record<number, { completed: number; total: number; avgScore: number }>;
  weeks: WeekProgress[];
  recentCompletions: any[];
}

interface WeekProgress {
  week: number;
  theme: string;
  completed: number;
  total: number;
  avgScore: number;
  passed: number;
  failed: number;
  trapDetected: number;
  estimatedHours: number;
  actualHours: number;
  days: { date: string; day: number; completed: number; avgScore: number; tasks: any[] }[];
}

function getScoreColor(score: number) {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#f97316';
  return '#ef4444';
}

function getScoreLabel(score: number) {
  if (score >= 90) return 'Excelente';
  if (score >= 70) return 'Bueno';
  if (score >= 50) return 'Regular';
  return 'Necesita mejorar';
}

const CATEGORY_LABELS: Record<string, string> = {
  facturacion: '📋 Facturación',
  cobranza: '💰 Cobranza',
  compras: '🛒 Compras',
  banco: '🏦 Banco',
  nomina: '👥 Nómina',
  fiscal: '🏛 Fiscal',
  cierre: '📊 Cierre',
  activos: '🏗 Activos',
  conciliacion: '🔄 Conciliación',
  reportes: '📈 Reportes',
  control: '🔍 Control',
  errores: '⚠ Errores',
};

export default function ProgressDashboard({ theme, onBack }: ProgressDashboardProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [progress, setProgress] = useState<MonthProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const data = await apiFetch<MonthProgress>(`/api/sim/progress/month/${now.getMonth()}/${now.getFullYear()}`);
        setProgress(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-sm font-mono animate-pulse" style={{ color: colors.textMuted }}>Cargando progreso...</div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4" style={{ background: colors.bg }}>
        <div className="text-4xl">📊</div>
        <div className="text-sm font-bold" style={{ color: colors.text }}>Sin datos de progreso</div>
        <button onClick={onBack} className="text-[10px] px-4 py-2 rounded-lg border-2 cursor-pointer" style={{ borderColor: colors.border, color: colors.textMuted }}>← Volver</button>
      </div>
    );
  }

  const completionPct = Math.round((progress.completedTasks / progress.totalTasks) * 100);

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <div className="flex-1">
          <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>📊 Progreso Mensual</span>
          <span className="text-[8px] font-mono ml-2" style={{ color: colors.textMuted }}>Julio 2026</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: '#22c55e20' }}>
          <span className="text-[8px]">🔥</span>
          <span className="text-[9px] font-bold font-mono" style={{ color: '#22c55e' }}>{progress.streak} días</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '✅', label: 'Completadas', value: `${progress.completedTasks}/${progress.totalTasks}`, color: '#22c55e' },
            { icon: '🎯', label: 'Precisión', value: `${progress.avgScore}%`, color: getScoreColor(progress.avgScore) },
            { icon: '📈', label: 'Aprobación', value: `${progress.passRate}%`, color: progress.passRate >= 70 ? '#22c55e' : '#f59e0b' },
            { icon: '⏱', label: 'Horas', value: `${progress.totalHours}h`, color: '#3b82f6' },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl p-3 flex flex-col gap-1" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
              <span className="text-sm">{kpi.icon}</span>
              <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{kpi.label}</span>
              <span className="text-sm font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* Completion Progress Bar */}
        <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>Progreso del mes</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: colors.primary }}>{completionPct}%</span>
          </div>
          <div className="w-full h-3 rounded-full" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%`, background: `linear-gradient(90deg, ${colors.primary}, #22c55e)` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[7px] font-mono" style={{ color: colors.textMuted }}>0%</span>
            <span className="text-[7px] font-mono" style={{ color: colors.textMuted }}>{progress.completedTasks} de {progress.totalTasks} tareas</span>
            <span className="text-[7px] font-mono" style={{ color: colors.textMuted }}>100%</span>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
          <div className="text-[10px] font-bold mb-3" style={{ color: colors.text }}>📅 Calendario semanal</div>
          <div className="space-y-2">
            {progress.weeks.map((week, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => setSelectedWeek(selectedWeek === i ? null : i)}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold" style={{ color: colors.primary }}>S{week.week}</span>
                    <span className="text-[8px]" style={{ color: colors.textMuted }}>{week.theme}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono" style={{ color: week.completed > 0 ? '#22c55e' : colors.textMuted }}>{week.completed}/{week.total}</span>
                    {week.trapDetected > 0 && <span className="text-[7px] px-1 rounded" style={{ background: '#f59e0b20', color: '#f59e0b' }}>⚠{week.trapDetected}</span>}
                  </div>
                </div>
                {/* Week progress bar */}
                <div className="w-full h-1.5 rounded-full mb-1" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
                  <div className="h-full rounded-full" style={{ width: `${week.total > 0 ? (week.completed / week.total) * 100 : 0}%`, background: getScoreColor(week.avgScore) }} />
                </div>
                {/* Expanded days */}
                {selectedWeek === i && (
                  <div className="ml-4 mt-1 space-y-1">
                    {week.days.filter(d => d.completed > 0).map((day, j) => (
                      <div key={j} className="flex items-center gap-2 text-[8px]">
                        <span className="font-mono" style={{ color: colors.textMuted }}>{day.date}</span>
                        <span className="font-mono" style={{ color: colors.text }}>{day.completed} tareas</span>
                        <span className="font-mono" style={{ color: getScoreColor(day.avgScore) }}>{day.avgScore}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
          <div className="text-[10px] font-bold mb-3" style={{ color: colors.text }}>📊 Por categoría</div>
          <div className="space-y-2">
            {Object.entries(progress.byCategory).filter(([_, v]) => v.completed > 0 || v.total > 0).map(([cat, data]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-[8px] w-24 truncate" style={{ color: colors.textMuted }}>{CATEGORY_LABELS[cat] || cat}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
                  <div className="h-full rounded-full" style={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%`, background: getScoreColor(data.avgScore) }} />
                </div>
                <span className="text-[8px] font-mono w-12 text-right" style={{ color: colors.text }}>{data.completed}/{data.total}</span>
                <span className="text-[8px] font-mono w-8 text-right" style={{ color: getScoreColor(data.avgScore) }}>{data.avgScore}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
          <div className="text-[10px] font-bold mb-3" style={{ color: colors.text }}>🎯 Por dificultad</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { level: 1, label: '🌱 Básico', color: '#22c55e' },
              { level: 2, label: '📈 Intermedio', color: '#f59e0b' },
              { level: 3, label: '🔴 Avanzado', color: '#f97316' },
              { level: 4, label: '⚠ Trampa', color: '#ef4444' },
            ].map(d => {
              const data = progress.byDifficulty[d.level];
              return (
                <div key={d.level} className="rounded-lg p-2 text-center" style={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${colors.border}` }}>
                  <div className="text-[8px] mb-1">{d.label}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: d.color }}>{data.completed}/{data.total}</div>
                  <div className="text-[7px] font-mono" style={{ color: colors.textMuted }}>{data.avgScore}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
          <div className="text-[10px] font-bold mb-3" style={{ color: colors.text }}>🕐 Actividad reciente</div>
          <div className="space-y-2">
            {progress.recentCompletions.length === 0 ? (
              <div className="text-center py-4 text-[9px]" style={{ color: colors.textMuted }}>Sin actividad aún</div>
            ) : progress.recentCompletions.map((t, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${colors.border}` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: t.passed ? '#22c55e20' : '#ef444420', color: t.passed ? '#22c55e' : '#ef4444' }}>
                  {t.passed ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-mono font-bold truncate" style={{ color: colors.text }}>{t.title}</div>
                  <div className="text-[7px] font-mono" style={{ color: colors.textMuted }}>S{t.week}D{t.day} · {t.timeSpent}min</div>
                </div>
                <span className="text-[8px] font-mono font-bold" style={{ color: getScoreColor(t.score) }}>{t.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-t-2 flex items-center justify-between text-[7px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>Progreso · Simulador Laboral 3D</span>
        <span style={{ color: colors.textMuted }}>Mejor racha: {progress.bestStreak} días</span>
      </div>
    </div>
  );
}
