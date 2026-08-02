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
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: trendUp ? '#22c55e20' : '#ef444420', color: trendUp ? '#22c55e' : '#ef4444' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{label}</div>
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
      <span className="text-[9px] font-mono w-20 text-right shrink-0" style={{ color: colors.textMuted }}>{label}</span>
      <div className="flex-1 h-5 rounded" style={{ background: dark ? '#0f172a' : '#e5e7eb' }}>
        <div className="h-full rounded" style={{ width, background: color, minWidth: value > 0 ? 4 : 0 }} />
      </div>
      <span className="text-[9px] font-mono w-16 shrink-0" style={{ color: colors.text }}>${(value / 1000).toFixed(1)}k</span>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/api/sim/my-stats');
        setStats(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const kpis = [
    { icon: '📋', label: 'Tareas completadas', value: stats?.totalTasks ? String(stats.totalTasks) : '—', trend: '+2 esta semana', trendUp: true, color: '#22c55e' },
    { icon: '⏱', label: 'Tiempo promedio', value: stats?.avgTimeMin ? `${Math.round(stats.avgTimeMin)}min` : '—', trend: '-3min vs ayer', trendUp: true, color: '#3b82f6' },
    { icon: '🎯', label: 'Precisión promedio', value: stats?.avgScore ? `${Math.round(stats.avgScore * 100)}%` : '—', trend: '+5%', trendUp: true, color: '#f59e0b' },
    { icon: '🔥', label: 'Racha actual', value: '3 días', trend: 'máx: 7', trendUp: true, color: '#ef4444' },
    { icon: '💰', label: 'Facturas emitidas', value: '12', trend: '+4 este mes', trendUp: true, color: '#22c55e' },
    { icon: '🏢', label: 'Clientes atendidos', value: '8', trend: '+2 nuevos', trendUp: true, color: '#8b5cf6' },
  ];

  const monthlyData = [
    { label: 'Ene', value: 45000 },
    { label: 'Feb', value: 52000 },
    { label: 'Mar', value: 48000 },
    { label: 'Abr', value: 61000 },
    { label: 'May', value: 55000 },
    { label: 'Jun', value: 72000 },
    { label: 'Jul', value: 68000 },
  ];

  const maxVal = Math.max(...monthlyData.map(d => d.value));

  const recentTasks = [
    { title: 'Emisión de factura', score: 85, date: 'Hoy', status: 'completada' },
    { title: 'Registro de pago', score: 92, date: 'Ayer', status: 'completada' },
    { title: 'Conciliación bancaria', score: 78, date: 'Ayer', status: 'completada' },
    { title: 'Cálculo de nómina', score: 88, date: '2 días', status: 'completada' },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-sm font-mono animate-pulse" style={{ color: colors.textMuted }}>Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-5 py-3 border-b-2 flex items-center gap-3 shrink-0" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <div className="flex-1">
          <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>📊 Dashboard Ejecutivo</span>
          <span className="text-[8px] font-mono ml-2" style={{ color: colors.textMuted }}>Simulador Laboral 3D</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
          <span className="text-[8px] font-mono" style={{ color: '#22c55e' }}>En vivo</span>
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
            <div className="text-[10px] font-bold font-mono mb-3" style={{ color: colors.text }}>📈 Ingresos mensuales</div>
            <div className="space-y-2">
              {monthlyData.map((d, i) => (
                <ChartBar key={i} label={d.label} value={d.value} max={maxVal} color={i === monthlyData.length - 1 ? colors.primary : '#6b7280'} dark={isDark} />
              ))}
            </div>
          </div>

          {/* Task Distribution */}
          <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
            <div className="text-[10px] font-bold font-mono mb-3" style={{ color: colors.text }}>📋 Distribución de tareas</div>
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
                  <span className="text-[9px] font-mono flex-1" style={{ color: colors.textMuted }}>{d.label}</span>
                  <div className="w-24 h-2 rounded" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
                    <div className="h-full rounded" style={{ width: `${d.pct}%`, background: d.color }} />
                  </div>
                  <span className="text-[9px] font-mono w-8 text-right" style={{ color: colors.text }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-xl p-4" style={{ background: isDark ? '#1a1a2e' : '#f8fafc', border: `1px solid ${colors.border}` }}>
          <div className="text-[10px] font-bold font-mono mb-3" style={{ color: colors.text }}>🕐 Actividad reciente</div>
          <div className="space-y-2">
            {recentTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${colors.border}` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px]" style={{ background: t.score >= 80 ? '#22c55e20' : '#f59e0b20', color: t.score >= 80 ? '#22c55e' : '#f59e0b' }}>
                  {t.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono font-bold truncate" style={{ color: colors.text }}>{t.title}</div>
                  <div className="text-[7px] font-mono" style={{ color: colors.textMuted }}>{t.date}</div>
                </div>
                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#22c55e20', color: '#22c55e' }}>✓ {t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-1.5 border-t-2 text-[7px] font-mono shrink-0 flex justify-between" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>Dashboard · Simulador Laboral 3D</span>
        <span style={{ color: colors.textMuted }}>Última actualización: {new Date().toLocaleTimeString('es-MX')}</span>
      </div>
    </div>
  );
}
