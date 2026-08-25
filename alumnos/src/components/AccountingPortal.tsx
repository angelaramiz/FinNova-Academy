import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface AccountingPortalProps {
  theme: Theme;
  entries: { account: string; type: 'cargo' | 'abono'; amount: number; concept: string }[];
  onConfirm?: () => void;
}

const ERPS = [
  { id: 'odoo', name: 'Odoo', icon: '🎯', color: '#875A7B', bg: '#875A7B10' },
  { id: 'contalink', name: 'Contalink', icon: '📊', color: '#E8590C', bg: '#E8590C10' },
  { id: 'compac', name: 'Compac', icon: '🧮', color: '#1971C2', bg: '#1971C210' },
  { id: 'aspel', name: 'Aspel', icon: '🗃️', color: '#2F9E44', bg: '#2F9E4410' },
];

function fmt(n: number): string { return n.toLocaleString('es-MX', { minimumFractionDigits: 2 }); }

export default function AccountingPortal({ theme, entries, onConfirm }: AccountingPortalProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [erp, setErp] = useState(ERPS[0]);
  const [confirmed, setConfirmed] = useState(false);

  const totalDebe = entries.filter(e => e.type === 'cargo').reduce((s, e) => s + e.amount, 0);
  const totalHaber = entries.filter(e => e.type === 'abono').reduce((s, e) => s + e.amount, 0);
  const balances = Math.abs(totalDebe - totalHaber) <= 1;

  return (
    <div className="flex flex-col h-full" style={{ background: colors.bg }}>
      <div className="px-3 py-2 border-b-2 flex items-center gap-2 shrink-0 flex-wrap" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>📊 Sistema Contable</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {ERPS.map(e => (
            <button key={e.id} onClick={() => setErp(e)} className="px-2 py-1 rounded text-[10px] font-mono cursor-pointer border"
              style={{ borderColor: erp.id === e.id ? e.color : colors.border, background: erp.id === e.id ? e.bg : 'transparent', color: erp.id === e.id ? e.color : colors.textMuted }}>
              {e.icon} {e.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 flex-1 overflow-auto">
        <div className="rounded-xl border-2 mb-3" style={{ borderColor: erp.color + '50', background: erp.bg }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${erp.color}30` }}>
            <span className="text-lg">{erp.icon}</span>
            <span className="text-[12px] font-bold font-mono" style={{ color: erp.color }}>{erp.name} — Asiento Contable</span>
          </div>
          <div className="p-3">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr><th className="text-left" style={{ color: colors.textMuted }}>Cuenta</th><th className="text-right" style={{ color: colors.textMuted }}>Cargo (Debe)</th><th className="text-right" style={{ color: colors.textMuted }}>Abono (Haber)</th></tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${colors.border}40` }}>
                    <td className="py-1.5" style={{ color: colors.text }}>{e.account} <span style={{ color: colors.textMuted }}>· {e.concept}</span></td>
                    <td className="text-right py-1.5" style={{ color: e.type === 'cargo' ? '#22c55e' : colors.textMuted }}>{e.type === 'cargo' ? '$' + fmt(e.amount) : ''}</td>
                    <td className="text-right py-1.5" style={{ color: e.type === 'abono' ? '#ef4444' : colors.textMuted }}>{e.type === 'abono' ? '$' + fmt(e.amount) : ''}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${colors.border}`, fontWeight: 'bold' }}>
                  <td className="py-1.5" style={{ color: colors.text }}>TOTALES {balances ? '✅' : '⚠️'}</td>
                  <td className="text-right py-1.5" style={{ color: '#22c55e' }}>${fmt(totalDebe)}</td>
                  <td className="text-right py-1.5" style={{ color: '#ef4444' }}>${fmt(totalHaber)}</td>
                </tr>
              </tbody>
            </table>
            {!balances && <p className="text-[10px] mt-2" style={{ color: '#ef4444' }}>⚠️ Los totales no cuadran: Debe debe ser igual a Haber.</p>}
            {balances && <p className="text-[10px] mt-2" style={{ color: '#22c55e' }}>✅ Asiento cuadrado: Debe = Haber</p>}
          </div>
        </div>

        {!confirmed && (
          <button onClick={() => { setConfirmed(true); onConfirm?.(); }} disabled={!balances}
            className="w-full py-2 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-50"
            style={{ background: balances ? '#22c55e' : colors.border, color: '#fff' }}>
            {balances ? '✅ Guardar asiento en ' + erp.name : 'Corrige los totales primero'}
          </button>
        )}
        {confirmed && <p className="text-center text-[11px] font-bold mt-2" style={{ color: '#22c55e' }}>✓ Asiento registrado en {erp.name}</p>}
      </div>
    </div>
  );
}