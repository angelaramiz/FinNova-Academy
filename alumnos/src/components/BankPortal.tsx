import { useState, useEffect } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';

interface BankPortalProps {
  theme: Theme;
  onBack?: () => void;
}

function fmt(n: number): string { return n.toLocaleString('es-MX', { minimumFractionDigits: 2 }); }

export default function BankPortal({ theme, onBack }: BankPortalProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/sim/documents/bank_statement?format=json').then(d => setData(d)).catch(() => {});
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-3 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        {onBack && <button onClick={onBack} className="text-[11px] cursor-pointer" style={{ color: colors.textMuted }}>←</button>}
        <span className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>🏦 Banco — Portal</span>
        <div className="flex-1" />
        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>Banco Nacional de México</span>
      </div>

      <div className="p-3 flex-1 overflow-auto">
        <div className="rounded-xl border-2 mb-3 p-3" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc' }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Cuenta corriente</p>
              <p className="text-[12px] font-mono font-bold" style={{ color: colors.text }}>{data?.account || '6550 **** ****'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Saldo final</p>
              <p className="text-[14px] font-bold font-mono" style={{ color: '#22c55e' }}>${fmt(data?.finalBalance || 0)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <div className="px-3 py-2 border-b-2" style={{ borderColor: colors.border }}>
            <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>Movimientos</span>
          </div>
          <div className="divide-y" style={{ borderColor: colors.border + '40' }}>
            {(data?.movements || []).map((m: any, i: number) => (
              <div key={i} className="px-3 py-2 flex items-center gap-2">
                <span className="text-[9px] font-mono shrink-0" style={{ color: colors.textMuted }}>{m.date}</span>
                <span className="flex-1 text-[10px] truncate" style={{ color: colors.text }}>{m.desc}</span>
                <span className={`text-[10px] font-mono font-bold shrink-0 ${m.in > 0 ? '' : ''}`} style={{ color: m.in > 0 ? '#22c55e' : '#ef4444' }}>
                  {m.in > 0 ? '+' : '-'}${fmt(m.in > 0 ? m.in : m.out)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl border-2 p-3" style={{ borderColor: '#22c55e50', background: '#22c55e10' }}>
          <p className="text-[10px] font-mono" style={{ color: colors.text }}>💡 <strong>Consejo:</strong> Verifica que el pago con tarjeta aparezca en el estado de cuenta como "Compra con tarjeta TPV" o "Pago domiciliado". La conciliación compara estos movimientos con tus registros contables.</p>
        </div>
      </div>
    </div>
  );
}