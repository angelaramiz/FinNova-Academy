import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface TaskInfo { id: string; title: string; type: string; time: number; difficulty: number; }
interface CalendarProps { theme: Theme; tasks: TaskInfo[]; onBack: () => void; }

const TYPE_COLORS: Record<string, string> = {
  invoice_emission: '#22c55e',
  payment_registration: '#3b82f6',
  tax_calculation: '#f59e0b',
  bank_reconciliation: '#8b5cf6',
  journal_entry: '#ec4899',
  payroll: '#ef4444',
  supplier_invoice: '#06b6d4',
  payment_scheduling: '#f97316',
  ap_reconciliation: '#14b8a6',
  cfdi_reception: '#a855f7',
};

export default function CalendarWidget({ theme, tasks, onBack }: CalendarProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const today = new Date();
  const dayNames = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];
  const month = today.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay() || 7;

  // Group tasks by day
  const taskDays: Record<number, TaskInfo[]> = {};
  tasks.forEach((t, i) => {
    const day = today.getDate() + i;
    if (day <= daysInMonth) taskDays[day] = [...(taskDays[day] || []), t];
  });

  const days = [];
  for (let i = 1; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, tasks: taskDays[i] || [] });

  const selectedTasks = selectedDay ? (taskDays[selectedDay] || []) : [];

  return (
    <div className="flex flex-col h-full" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
        <button onClick={onBack} className="text-[10px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 shrink-0" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📅</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Calendario</span>
        <span className="text-[9px] font-mono uppercase ml-auto" style={{ color: colors.primary }}>{month}</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map(d => <div key={d} className="text-[8px] font-bold font-mono" style={{ color: colors.textMuted }}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const types = [...new Set(d.tasks.map((t: TaskInfo) => t.type))];
            return (
              <div key={i} onClick={() => setSelectedDay(d.day === selectedDay ? null : d.day)}
                className="aspect-square rounded-lg border flex flex-col items-center justify-start pt-0.5 cursor-pointer hover:opacity-80 transition relative overflow-hidden"
                style={{
                  borderColor: d.tasks.length ? colors.primary : (d.day === selectedDay ? colors.primary : colors.border + '30'),
                  background: d.day === selectedDay ? colors.primary + '15' : (d.tasks.length ? colors.cardBg : 'transparent'),
                  boxShadow: d.day === selectedDay ? `0 0 0 2px ${colors.primary}` : undefined,
                }}>
                <span className="text-[9px] font-bold font-mono" style={{ color: d.tasks.length ? colors.primary : colors.textMuted }}>{d.day}</span>
                {types.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {types.slice(0, 3).map((t, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_COLORS[t] || colors.primary }} />
                    ))}
                    {types.length > 3 && <span className="text-[6px] font-bold" style={{ color: colors.textMuted }}>+{types.length - 3}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected day details */}
        {selectedDay && (
          <div className="p-4 rounded-xl border-2 animate-slide-in" style={{ borderColor: colors.primary, background: colors.cardBg }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold" style={{ color: colors.text }}>
                {new Date(today.getFullYear(), today.getMonth(), selectedDay).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{selectedTasks.length} eventos</span>
            </div>
            {selectedTasks.length === 0 ? (
              <p className="text-[9px]" style={{ color: colors.textMuted }}>No hay tareas para este día</p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg border" style={{ borderColor: colors.border + '40', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLORS[t.type] || colors.primary }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{t.title}</p>
                      <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{(t.type || '').replace(/_/g, ' ')} · {t.time}min</p>
                    </div>
                    <span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{ background: colors.primary + '20', color: colors.primary }}>
                      {t.difficulty === 1 ? 'Fácil' : t.difficulty === 2 ? 'Medio' : 'Difícil'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
