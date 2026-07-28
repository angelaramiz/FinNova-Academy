import { themeColors, Theme } from '../lib/theme';

interface EmailInboxProps {
  theme: Theme;
  tasks: { id: string; title: string; type: string; difficulty: number; time: number }[];
  onSelectTask: (taskId: string) => void;
  onBack: () => void;
}

function generatePreview(type: string): string {
  const previews: Record<string, string> = {
    invoice_emission: 'Por favor emite una factura a nombre del cliente por los servicios de este mes.',
    payment_registration: 'Adjuntamos comprobante de pago correspondiente a la factura del periodo.',
    tax_calculation: 'Necesito que calcules el IVA del mes para preparar la declaración.',
    bank_reconciliation: 'Necesito que concilies el estado de cuenta bancario del mes.',
    journal_entry: 'Necesito que registres la depreciación del equipo de cómputo.',
    payroll: 'Adjunto la lista de asistencia de la primera quincena.',
    supplier_invoice: 'Adjuntamos nuestra factura electrónica por los servicios prestados.',
    payment_scheduling: 'A continuación las facturas de proveedores que vencen esta semana.',
    ap_reconciliation: 'Necesito conciliar las cuentas por pagar del mes.',
    cfdi_reception: 'Se ha recibido un Comprobante Fiscal Digital versión 4.0.',
  };
  return previews[type] || `Tarea: ${type.replace(/_/g, ' ')}`;
}

export default function EmailInbox({ theme, tasks, onSelectTask, onBack }: EmailInboxProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';

  const senders = ['Lic. Gómez', 'María López — RRHH', 'Tesorería', 'Sistema SAT'];

  return (
    <div className="flex flex-col flex-1" style={{ background: theme === 'dark' ? '#1B2632' : '#E2DCD0' }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : colors.bg }}>
        <button onClick={onBack} className="text-[10px] px-2 py-1 rounded border cursor-pointer hover:opacity-70 shrink-0" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📧</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Bandeja de entrada</span>
        <span className="text-[8px] font-mono ml-auto" style={{ color: colors.textMuted }}>{tasks.length} mensajes</span>
      </div>
      <div className="flex-1 overflow-auto divide-y" style={{ borderColor: colors.border + '30' }}>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-[10px]" style={{ color: colors.textMuted }}>No tienes mensajes</p>
          </div>
        ) : (
          tasks.map((t, i) => (
            <div key={t.id} className="px-4 py-3 hover:opacity-80 transition cursor-pointer" onClick={() => onSelectTask(t.id)}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{
                  background: i % 2 === 0 ? colors.primary + '20' : colors.secondary + '20',
                  color: i % 2 === 0 ? colors.primary : colors.secondary,
                }}>
                  {senders[i % senders.length].charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{t.title}</span>
                    <span className="text-[7px] font-mono shrink-0 ml-2" style={{ color: colors.textMuted }}>{t.time} min</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[8px] font-mono truncate" style={{ color: colors.primary }}>{senders[i % senders.length]}</span>
                    <span className="text-[7px] font-mono shrink-0 ml-2" style={{ color: colors.textMuted }}>
                      Vence: hoy
                    </span>
                  </div>
                  <p className="text-[8px] mt-1 truncate" style={{ color: colors.textMuted }}>{generatePreview(t.type)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
