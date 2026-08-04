import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface TaskInfo { id: string; title: string; type: string; time: number; difficulty: number; category?: string; }
interface CalendarProps { theme: Theme; tasks: TaskInfo[]; onBack: () => void; onSelectTask?: (taskId: string) => void; }

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
  credit_note: '#f43f5e',
  cash_cut: '#0ea5e9',
  depreciation: '#64748b',
  financial_statements: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  invoice_emission: '📋 Facturación',
  payment_registration: '💰 Cobranza',
  tax_calculation: '🏛 Cálculo fiscal',
  bank_reconciliation: '🏦 Conciliación',
  journal_entry: '📝 Póliza',
  payroll: '👥 Nómina',
  supplier_invoice: '📦 Proveedor',
  payment_scheduling: '📅 Programación',
  ap_reconciliation: '🔄 Conciliación AP',
  cfdi_reception: '📄 CFDI',
  credit_note: '↩ Nota de crédito',
  cash_cut: '💵 Corte de caja',
  depreciation: '🏗 Depreciación',
  financial_statements: '📊 Estados financieros',
};

// Recordatorios predefinidos
const REMINDERS: Record<number, { time: string; text: string; type: 'reminder' | 'event' | 'deadline' }[]> = {
  1: [{ time: '09:00', text: 'Revisar correo del Lic. Gómez', type: 'reminder' }],
  5: [{ time: '14:00', text: 'Reunión de cierre mensual', type: 'event' }],
  7: [{ time: '17:00', text: 'Fecha límite factura CFDI', type: 'deadline' }],
  10: [{ time: '10:00', text: 'Entrega de balanza de comprobación', type: 'deadline' }],
  15: [{ time: '09:00', text: 'Reunión con Tesorería', type: 'event' }, { time: '16:00', text: 'Corte de caja quincenal', type: 'deadline' }],
  17: [{ time: '12:00', text: '⚠ Fecha límite depósito IVA', type: 'deadline' }],
  20: [{ time: '09:00', text: 'Revisión de conciliaciones', type: 'reminder' }],
  25: [{ time: '14:00', text: 'Reunión de nómina', type: 'event' }],
  30: [{ time: '17:00', text: '⚠ Cierre contable del mes', type: 'deadline' }, { time: '09:00', text: 'Preparar estados financieros', type: 'reminder' }],
  31: [{ time: '18:00', text: '⚠ Entrega declaración mensual', type: 'deadline' }],
};

function getReminderIcon(type: string) {
  if (type === 'deadline') return '⚠️';
  if (type === 'event') return '📌';
  return '🔔';
}

function getReminderColor(type: string) {
  if (type === 'deadline') return '#ef4444';
  if (type === 'event') return '#3b82f6';
  return '#f59e0b';
}

export default function CalendarWidget({ theme, tasks, onBack, onSelectTask }: CalendarProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
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
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, tasks: taskDays[i] || [], reminders: REMINDERS[i] || [] });

  const selectedDayData = selectedDay ? days.find(d => d && d.day === selectedDay) : null;

  function handleDayClick(day: number) {
    setSelectedDay(day);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setSelectedDay(null);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 shrink-0" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📅</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Calendario</span>
        <span className="text-[11px] font-mono uppercase ml-auto" style={{ color: colors.primary }}>{month}</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map(d => <div key={d} className="text-[11px] font-bold font-mono" style={{ color: colors.textMuted }}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const types = [...new Set(d.tasks.map((t: TaskInfo) => t.type))];
            const hasReminders = d.reminders.length > 0;
            const hasDeadline = d.reminders.some(r => r.type === 'deadline');
            return (
              <div key={i} onClick={() => handleDayClick(d.day)}
                className="aspect-square rounded-lg border flex flex-col items-center justify-start pt-0.5 cursor-pointer hover:opacity-80 transition relative overflow-hidden"
                style={{
                  borderColor: hasDeadline ? '#ef4444' : d.tasks.length ? colors.primary : colors.border + '30',
                  background: d.day === today.getDate() ? colors.primary + '15' : (d.tasks.length ? colors.cardBg : 'transparent'),
                  boxShadow: d.day === today.getDate() ? `0 0 0 2px ${colors.primary}` : undefined,
                }}>
                <span className="text-[11px] font-bold font-mono" style={{ color: d.day === today.getDate() ? colors.primary : (d.tasks.length || hasReminders ? colors.text : colors.textMuted) }}>{d.day}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {types.slice(0, 2).map((t, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_COLORS[t] || colors.primary }} />
                  ))}
                  {hasReminders && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-lg text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-[11px] font-bold" style={{ color: colors.primary }}>{tasks.length}</div>
            <div className="text-[9px]" style={{ color: colors.textMuted }}>Tareas</div>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-[11px] font-bold" style={{ color: '#f59e0b' }}>{Object.keys(REMINDERS).length}</div>
            <div className="text-[9px]" style={{ color: colors.textMuted }}>Recordatorios</div>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-[11px] font-bold" style={{ color: '#ef4444' }}>{Object.values(REMINDERS).flat().filter(r => r.type === 'deadline').length}</div>
            <div className="text-[9px]" style={{ color: colors.textMuted }}>Fechas límite</div>
          </div>
        </div>
      </div>

      {/* Modal de eventos */}
      {showModal && selectedDayData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={handleCloseModal}>
          <div className="rounded-xl shadow-2xl overflow-hidden w-full max-w-sm max-h-[80vh] flex flex-col animate-slide-in"
            style={{ background: isDark ? '#1a1a2e' : '#fff', border: `1px solid ${colors.border}` }}
            onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${colors.border}`, background: isDark ? '#0f172a' : '#f8fafc' }}>
              <div>
                <div className="text-sm font-bold" style={{ color: colors.text }}>
                  {new Date(today.getFullYear(), today.getMonth(), selectedDayData.day).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}
                </div>
                <div className="text-[10px]" style={{ color: colors.textMuted }}>
                  {selectedDayData.tasks.length + selectedDayData.reminders.length} evento{selectedDayData.tasks.length + selectedDayData.reminders.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button onClick={handleCloseModal} className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] cursor-pointer hover:opacity-70" style={{ background: colors.border + '30', color: colors.textMuted }}>✕</button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {/* Recordatorios */}
              {selectedDayData.reminders.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold mb-2" style={{ color: colors.textMuted }}>📌 Recordatorios</div>
                  {selectedDayData.reminders.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg mb-1.5" style={{ background: getReminderColor(r.type) + '10', border: `1px solid ${getReminderColor(r.type)}30` }}>
                      <span className="text-sm shrink-0">{getReminderIcon(r.type)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold" style={{ color: colors.text }}>{r.text}</div>
                        <div className="text-[9px] font-mono" style={{ color: getReminderColor(r.type) }}>{r.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tareas del día */}
              {selectedDayData.tasks.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold mb-2" style={{ color: colors.textMuted }}>📋 Tareas asignadas</div>
                  {selectedDayData.tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg mb-1.5 cursor-pointer hover:opacity-80 transition"
                      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
                      onClick={() => { onSelectTask?.(t.id); handleCloseModal(); }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLORS[t.type] || colors.primary }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate" style={{ color: colors.text }}>{t.title}</div>
                        <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{TYPE_LABELS[t.type] || t.type} · {t.time}min</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0" style={{ background: colors.primary + '20', color: colors.primary }}>
                        {t.difficulty === 1 ? '🌱' : t.difficulty === 2 ? '📈' : '🔴'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sin eventos */}
              {selectedDayData.tasks.length === 0 && selectedDayData.reminders.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📭</div>
                  <div className="text-[11px]" style={{ color: colors.textMuted }}>Sin eventos este día</div>
                </div>
              )}

              {/* Leyenda de colores */}
              <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
                <div className="text-[9px] font-bold mb-1.5" style={{ color: colors.textMuted }}>Leyenda:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_LABELS).slice(0, 6).map(([type, label]) => (
                    <div key={type} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[type] }} />
                      <span className="text-[8px]" style={{ color: colors.textMuted }}>{label.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
