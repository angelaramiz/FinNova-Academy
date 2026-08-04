import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  dark: boolean;
}

function KPICard({ icon, label, value, trend, trendUp, color, dark }: KPICardProps) {
  const colors = themeColors[dark ? 'dark' : 'light'];
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{ background: dark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        {trend && (
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: trendUp ? '#22c55e20' : '#ef444420', color: trendUp ? '#22c55e' : '#ef4444' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="text-[12px] font-mono" style={{ color: colors.textMuted }}>{label}</div>
      <div className="text-base font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

interface ChartBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  dark: boolean;
}

function ChartBar({ label, value, max, color, dark }: ChartBarProps) {
  const colors = themeColors[dark ? 'dark' : 'light'];
  const width = `${(value / max) * 100}%`;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] font-mono w-20 text-right shrink-0" style={{ color: colors.textMuted }}>{label}</span>
      <div className="flex-1 h-5 rounded" style={{ background: dark ? '#0f172a' : '#e5e7eb' }}>
        <div className="h-full rounded" style={{ width, background: color, minWidth: value > 0 ? 4 : 0 }} />
      </div>
      <span className="text-[12px] font-mono w-16 shrink-0" style={{ color: colors.text }}>${(value / 1000).toFixed(1)}k</span>
    </div>
  );
}

interface DashboardProps {
  theme: Theme;
  onBack: () => void;
}

export default function Dashboard({ theme, onBack }: DashboardProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [quickStats, setQuickStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const [statsData, progressResult, quickResult] = await Promise.all([
          apiFetch('/api/sim/my-stats').catch(() => null),
          apiFetch(`/api/sim/progress/month/${now.getMonth()}/${now.getFullYear()}`).catch(() => null),
          apiFetch('/api/sim/progress/quick').catch(() => null),
        ]);
        setStats(statsData);
        setProgressData(progressResult);
        setQuickStats(quickResult);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const kpis = [
    { icon: '📋', label: 'Tareas completadas', value: progressData ? `${progressData.completedTasks}/${progressData.totalTasks}` : stats?.totalTasks ? String(stats.totalTasks) : '—', trend: quickStats?.todayCompleted ? `+${quickStats.todayCompleted} hoy` : undefined, trendUp: true, color: '#22c55e' },
    { icon: '⏱', label: 'Tiempo invertido', value: progressData?.totalHours ? `${progressData.totalHours}h` : stats?.avgTimeMin ? `${Math.round(stats.avgTimeMin)}min` : '—', trend: undefined, trendUp: true, color: '#3b82f6' },
    { icon: '🎯', label: 'Precisión promedio', value: progressData?.avgScore ? `${progressData.avgScore}%` : stats?.avgScore ? `${Math.round(stats.avgScore * 100)}%` : '—', trend: progressData?.passRate ? `${progressData.passRate}% aprobación` : undefined, trendUp: (progressData?.passRate || 0) >= 70, color: '#f59e0b' },
    { icon: '🔥', label: 'Racha actual', value: quickStats?.streak ? `${quickStats.streak} días` : '0 días', trend: progressData?.bestStreak ? `máx: ${progressData.bestStreak}` : undefined, trendUp: true, color: '#ef4444' },
    { icon: '💰', label: 'Facturas emitidas', value: progressData?.byCategory?.facturacion?.completed?.toString() || '0', trend: undefined, trendUp: true, color: '#22c55e' },
    { icon: '🏢', label: 'Clientes atendidos', value: '5', trend: 'base datos', trendUp: true, color: '#8b5cf6' },
  ];

  const monthlyData = progressData?.weeks ? progressData.weeks.map((w: any, i: number) => ({
    label: `S${i + 1}`,
    value: w.completed * 5000,
  })) : [
    { label: 'S1', value: 0 },
    { label: 'S2', value: 0 },
    { label: 'S3', value: 0 },
    { label: 'S4', value: 0 },
  ];

  const maxVal = Math.max(...monthlyData.map((d: any) => d.value), 1);

  const recentTasks = (progressData?.recentCompletions || []).slice(0, 4).map((t: any) => ({
    title: t.title,
    score: t.score,
    date: `S${t.week}D${t.day}`,
    status: t.passed ? 'completada' : 'fallida',
  }));

  if (loading) {
    return (
      <div className="h-full flex flex-col" style={{ background: colors.bg }}>
        <div className="px-5 py-3 border-b-2 shrink-0" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="h-4 w-40 rounded animate-pulse" style={{ background: colors.border }} />
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
                <div className="h-4 w-4 rounded mb-2" style={{ background: colors.border }} />
                <div className="h-2 w-16 rounded mb-1" style={{ background: colors.border }} />
                <div className="h-3 w-12 rounded" style={{ background: colors.border }} />
              </div>
            ))}
          </div>
          <div className="h-8 rounded-xl animate-pulse" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }} />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 rounded-xl animate-pulse" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }} />
            <div className="h-48 rounded-xl animate-pulse" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-5 py-3 border-b-2 flex items-center gap-3 shrink-0" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[12px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <div className="flex-1">
          <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>📊 Dashboard Ejecutivo</span>
          <span className="text-[11px] font-mono ml-2" style={{ color: colors.textMuted }}>Simulador Laboral 3D</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
          <span className="text-[11px] font-mono" style={{ color: '#22c55e' }}>En vivo</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-3">
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} dark={isDark} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Revenue Chart */}
          <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
            <div className="text-[13px] font-bold font-mono mb-3" style={{ color: colors.text }}>📈 Ingresos mensuales</div>
            <div className="space-y-2">
              {monthlyData.map((d: any, i: number) => (
                <ChartBar key={i} label={d.label} value={d.value} max={maxVal} color={i === monthlyData.length - 1 ? colors.primary : '#6b7280'} dark={isDark} />
              ))}
            </div>
          </div>

          {/* Task Distribution */}
          <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
            <div className="text-[13px] font-bold font-mono mb-3" style={{ color: colors.text }}>📋 Distribución de tareas</div>
            <div className="space-y-2.5">
              {[
                { label: 'Facturación', pct: 35, color: '#22c55e' },
                { label: 'Pagos', pct: 25, color: '#3b82f6' },
                { label: 'Conciliación', pct: 20, color: '#f59e0b' },
                { label: 'Nómina', pct: 15, color: '#8b5cf6' },
                { label: 'Otros', pct: 5, color: '#6b7280' },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-[12px] font-mono flex-1" style={{ color: colors.textMuted }}>{d.label}</span>
                  <div className="w-24 h-2 rounded" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
                    <div className="h-full rounded" style={{ width: `${d.pct}%`, background: d.color }} />
                  </div>
                  <span className="text-[12px] font-mono w-8 text-right" style={{ color: colors.text }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
          <div className="text-[13px] font-bold font-mono mb-3" style={{ color: colors.text }}>🕐 Actividad reciente</div>
          <div className="space-y-2">
            {recentTasks.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${colors.border}` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: t.score >= 80 ? '#22c55e20' : '#f59e0b20', color: t.score >= 80 ? '#22c55e' : '#f59e0b' }}>
                  {t.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-mono font-bold truncate" style={{ color: colors.text }}>{t.title}</div>
                  <div className="text-[13px] font-mono" style={{ color: colors.textMuted }}>{t.date}</div>
                </div>
                <span className="text-[13px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#22c55e20', color: '#22c55e' }}>✓ {t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-1.5 border-t-2 text-[13px] font-mono shrink-0 flex justify-between" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>Dashboard · Simulador Laboral 3D</span>
        <span style={{ color: colors.textMuted }}>Última actualización: {new Date().toLocaleTimeString('es-MX')}</span>
      </div>
    </div>
  );
}
