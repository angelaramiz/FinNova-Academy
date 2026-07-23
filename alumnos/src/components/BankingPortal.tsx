import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

function fmt(n: number) { return n.toLocaleString('es-MX', { minimumFractionDigits: 2 }); }

interface BankingPortalProps {
  theme: Theme;
  onClose: () => void;
}

interface Movement {
  date: string;
  description: string;
  in: number;
  out: number;
  balance: number;
}

function generateMovements(): Movement[] {
  let balance = r(180000, 450000);
  const ms: Movement[] = [];
  for (let i = 0; i < 15; i++) {
    const day = String(r(1, 28)).padStart(2, '0');
    const isIn = Math.random() > 0.45;
    const amt = r(2000, 80000);
    const descs = isIn
      ? ['Depósito SPEUA', 'Abono cliente domiciliado', 'Pago factura cobranza', 'Transferencia entrante', 'Devolución proveedor']
      : ['Retiro cajero automático', 'Cargo comisión', 'SPEUI enviado', 'Pago proveedor', 'IVA trasladado', 'ISR retenido'];
    const desc = descs[Math.floor(Math.random() * descs.length)];
    ms.push({
      date: `2026-07-${day}`,
      description: desc,
      in: isIn ? amt : 0,
      out: !isIn ? amt : 0,
      balance: (balance += isIn ? amt : -amt),
    });
  }
  return ms;
}

function r(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default function BankingPortal({ theme, onClose }: BankingPortalProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [movements] = useState(generateMovements);
  const [activeTab, setActiveTab] = useState<'movements' | 'info'>('movements');
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    const csv = 'Fecha,Descripción,Depósitos,Retiros,Saldo\n' + movements.map(m =>
      `${m.date},"${m.description}",${m.in || '-'},${m.out || '-'},${m.balance}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'estado-cuenta-julio-2026.csv'; a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }

  const totalIn = movements.reduce((s, m) => s + m.in, 0);
  const totalOut = movements.reduce((s, m) => s + m.out, 0);
  const finalBalance = movements[movements.length - 1]?.balance || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Bank header — looks like BBVA/Banorte */}
      <div className="px-4 py-3 border-b-2 shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.4)' : '#1a365d' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#FFB162', color: '#1B2632' }}>
              🏦
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: isDark ? colors.text : '#fff' }}>BancaNet Corporativo</p>
              <p className="text-[8px] font-mono" style={{ color: isDark ? colors.textMuted : '#90cdf4' }}>Banca por Internet · Empresas</p>
            </div>
          </div>
          <span className="text-[8px] px-2 py-1 rounded-lg" style={{ background: '#22c55e', color: '#fff' }}>Sesión activa</span>
        </div>
      </div>

      {/* Account summary */}
      <div className="px-4 py-3 border-b-2" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : '#ebf8ff' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>CTA. 6550 **** 4823 · MX</span>
          <div className="flex gap-1">
            <button onClick={() => setActiveTab('movements')}
              className="text-[8px] px-2 py-0.5 rounded font-bold cursor-pointer"
              style={{ background: activeTab === 'movements' ? colors.primary : 'transparent', color: activeTab === 'movements' ? '#1B2632' : colors.textMuted }}>
              Movimientos
            </button>
            <button onClick={() => setActiveTab('info')}
              className="text-[8px] px-2 py-0.5 rounded font-bold cursor-pointer"
              style={{ background: activeTab === 'info' ? colors.primary : 'transparent', color: activeTab === 'info' ? '#1B2632' : colors.textMuted }}>
              Info
            </button>
          </div>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-lg font-bold" style={{ color: colors.text }}>${fmt(finalBalance)}</p>
            <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>Saldo actual</p>
          </div>
          <div className="text-right ml-auto">
            <p className="text-[9px] font-mono" style={{ color: '#22c55e' }}>+${fmt(totalIn)}</p>
            <p className="text-[9px] font-mono" style={{ color: '#ef4444' }}>-${fmt(totalOut)}</p>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'movements' ? (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {movements.map((m, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:opacity-80" style={{ borderBottomColor: colors.border + '30' }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px]" style={{
                    background: m.in > 0 ? '#22c55e20' : '#ef444420',
                    color: m.in > 0 ? '#22c55e' : '#ef4444',
                  }}>{m.in > 0 ? '↑' : '↓'}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold truncate" style={{ color: colors.text }}>{m.description}</p>
                    <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{new Date(m.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {m.in > 0 && <p className="text-[10px] font-bold" style={{ color: '#22c55e' }}>+${fmt(m.in)}</p>}
                  {m.out > 0 && <p className="text-[10px] font-bold" style={{ color: '#ef4444' }}>-${fmt(m.out)}</p>}
                  <p className="text-[8px] font-mono" style={{ color: colors.textMuted }}>$ {fmt(m.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <p className="text-xs font-bold mb-2" style={{ color: colors.text }}>Detalle de la cuenta</p>
              <div className="grid grid-cols-2 gap-3 text-[9px]">
                {[
                  ['Titular', 'Operadora Logística del Norte S.A. de C.V.'],
                  ['Tipo', 'Cheques Corporativo'],
                  ['Número', '6550 0482 3921 4823'],
                  ['CLABE', '012 180 00482392148 3'],
                  ['Moneda', 'MXN (Peso Mexicano)'],
                  ['Apertura', '15/03/2019'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ color: colors.textMuted }}>{k}</span>
                    <p className="font-bold" style={{ color: colors.text }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download button */}
      <div className="px-4 py-3 border-t-2 flex items-center justify-between shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.2)' : colors.bg }}>
        <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>
          {downloaded ? '✅ Descargado!' : 'Última actualización: hace 5 min'}
        </span>
        <button onClick={handleDownload}
          className="px-3 py-1.5 rounded-lg border-2 text-[9px] font-bold cursor-pointer hover:opacity-85 transition"
          style={{ borderColor: colors.primary, color: colors.primary, background: 'transparent' }}
        >⬇ Descargar CSV</button>
      </div>
    </div>
  );
}
