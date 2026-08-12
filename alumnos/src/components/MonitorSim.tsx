import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { simSlash } from '../lib/simTime';

interface MonitorSimProps {
  theme: Theme;
  onBack: () => void;
}

interface PipelineRun {
  id: string;
  name: string;
  status: 'success' | 'running' | 'failed' | 'queued';
  runDate: string;
  startTime: string;
  duration: string;
  tasks: number;
  progress: number;
}

const LNO_RUNS: PipelineRun[] = [
  { id: 'scheduled__6', name: 'lno_sales_pipeline', status: 'success', runDate: simSlash(0), startTime: '08:00', duration: '4m 48s', tasks: 7, progress: 100 },
  { id: 'scheduled__5', name: 'lno_sales_pipeline', status: 'success', runDate: simSlash(1), startTime: '08:00', duration: '4m 55s', tasks: 7, progress: 100 },
  { id: 'scheduled__4', name: 'lno_sales_pipeline', status: 'success', runDate: simSlash(2), startTime: '08:00', duration: '5m 02s', tasks: 7, progress: 100 },
  { id: 'scheduled__3', name: 'lno_sales_pipeline', status: 'failed', runDate: simSlash(3), startTime: '08:00', duration: '4m 12s', tasks: 7, progress: 57 },
  { id: 'scheduled__2', name: 'lno_sales_pipeline', status: 'success', runDate: simSlash(4), startTime: '08:00', duration: '6m 10s', tasks: 7, progress: 100 },
  { id: 'scheduled__1', name: 'lno_sales_pipeline', status: 'success', runDate: simSlash(5), startTime: '08:00', duration: '4m 38s', tasks: 7, progress: 100 },
];

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  success: { color: '#22c55e', icon: '✅', label: 'Exitoso' },
  running: { color: '#3b82f6', icon: '🔄', label: 'Ejecutando' },
  failed: { color: '#ef4444', icon: '❌', label: 'Fallido' },
  queued: { color: '#64748b', icon: '⏳', label: 'En cola' },
};

export default function MonitorSim({ theme, onBack }: MonitorSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [runs] = useState<PipelineRun[]>(LNO_RUNS);
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);

  const stats = {
    total: runs.length,
    success: runs.filter(r => r.status === 'success').length,
    running: runs.filter(r => r.status === 'running').length,
    failed: runs.filter(r => r.status === 'failed').length,
  };

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📊</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Monitor de Pipelines</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: colors.textMuted }}>Airflow · DAG lno_sales_pipeline</span>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-lg font-bold" style={{ color: colors.text }}>{stats.total}</div>
            <div className="text-[9px]" style={{ color: colors.textMuted }}>Total</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: '#22c55e10', border: '1px solid #22c55e30' }}>
            <div className="text-lg font-bold" style={{ color: '#22c55e' }}>{stats.success}</div>
            <div className="text-[9px]" style={{ color: '#22c55e' }}>Exitosos</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: '#3b82f610', border: '1px solid #3b82f630' }}>
            <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>{stats.running}</div>
            <div className="text-[9px]" style={{ color: '#3b82f6' }}>Ejecutando</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: '#ef444410', border: '1px solid #ef444430' }}>
            <div className="text-lg font-bold" style={{ color: '#ef4444' }}>{stats.failed}</div>
            <div className="text-[9px]" style={{ color: '#ef4444' }}>Fallidos</div>
          </div>
        </div>

        {/* Pipeline runs table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.border }}>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                <th className="px-4 py-2 text-left" style={{ color: colors.textMuted }}>Pipeline</th>
                <th className="px-4 py-2 text-left" style={{ color: colors.textMuted }}>Estado</th>
                <th className="px-4 py-2 text-left" style={{ color: colors.textMuted }}>Inicio</th>
                <th className="px-4 py-2 text-left" style={{ color: colors.textMuted }}>Duración</th>
                <th className="px-4 py-2 text-left" style={{ color: colors.textMuted }}>Tareas</th>
                <th className="px-4 py-2 text-left" style={{ color: colors.textMuted }}>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} onClick={() => setSelectedRun(run)}
                  className="cursor-pointer hover:opacity-80 transition border-b"
                  style={{ borderColor: colors.border + '30', background: selectedRun?.id === run.id ? colors.primary + '10' : 'transparent' }}>
                  <td className="px-4 py-2.5 font-bold" style={{ color: colors.text }}>
                    <div>{run.name}</div>
                    <div className="text-[8px] font-mono font-normal" style={{ color: colors.textMuted }}>{run.id} · {run.runDate}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: STATUS_CONFIG[run.status].color + '20', color: STATUS_CONFIG[run.status].color }}>
                      {STATUS_CONFIG[run.status].icon} {STATUS_CONFIG[run.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: colors.textMuted }}>{run.startTime}</td>
                  <td className="px-4 py-2.5" style={{ color: colors.textMuted }}>{run.duration}</td>
                  <td className="px-4 py-2.5" style={{ color: colors.text }}>{run.tasks}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full" style={{ background: isDark ? '#0f172a' : '#e5e7eb' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${run.progress}%`, background: STATUS_CONFIG[run.status].color }} />
                      </div>
                      <span className="text-[9px]" style={{ color: colors.textMuted }}>{Math.round(run.progress)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Run details */}
        {selectedRun && (
          <div className="rounded-xl border p-4" style={{ borderColor: colors.border, background: colors.cardBg }}>
            <div className="text-[11px] font-bold mb-3" style={{ color: colors.text }}>📋 Detalle: {selectedRun.name}</div>
            <div className="grid grid-cols-3 gap-4 text-[10px]">
              <div>
                <span className="block mb-1" style={{ color: colors.textMuted }}>Estado</span>
                <span className="font-bold" style={{ color: STATUS_CONFIG[selectedRun.status].color }}>
                  {STATUS_CONFIG[selectedRun.status].icon} {STATUS_CONFIG[selectedRun.status].label}
                </span>
              </div>
              <div>
                <span className="block mb-1" style={{ color: colors.textMuted }}>Tareas completadas</span>
                <span className="font-bold" style={{ color: colors.text }}>{Math.round(selectedRun.tasks * selectedRun.progress / 100)}/{selectedRun.tasks}</span>
              </div>
              <div>
                <span className="block mb-1" style={{ color: colors.textMuted }}>Última ejecución</span>
                <span className="font-bold" style={{ color: colors.text }}>{selectedRun.runDate} · {selectedRun.startTime}</span>
              </div>
            </div>
            {selectedRun.status === 'failed' && (
              <div className="mt-2 text-[9px] rounded-md px-2 py-1.5 font-mono" style={{ background: '#ef444410', color: '#ef4444' }}>
                ⚠ Tarea fallida: dbt_test · logs en s3://lno-logs-airflow ({selectedRun.runDate})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
