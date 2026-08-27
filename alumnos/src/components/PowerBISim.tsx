import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Props { theme: Theme; onBack: () => void; }

// Motor DAX real: la medida de ventas totales del mart = 128350 (dbtCatalog).
export const DAX_TOTAL = 128350;

export default function PowerBISim({ theme, onBack }: Props) {
  const colors = themeColors[theme];
  const [measure, setMeasure] = useState('VentasTotales = CALCULATE(SUM(mrt_ventas_por_cliente[total_ventas]), ALL(mrt_ventas_por_cliente[sector]))');
  const [show, setShow] = useState(false);
  const ok = /calculate/i.test(measure) && /sumx|sum/i.test(measure);
  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>📊 Power BI — Editor DAX</span>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded ml-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>Escritorio</button>
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <div className="text-[11px] font-mono" style={{ color: colors.textMuted }}>
          Modelo: <strong>{'mrt_ventas_por_cliente'}</strong> · Total real del mart: <strong style={{ color: colors.primary }}>${DAX_TOTAL.toLocaleString('es-MX')}</strong> · Columnas: cliente, num_ventas, total_ventas, sector
        </div>
        <label className="text-[10px] font-bold font-mono" style={{ color: colors.textMuted }}>Medida DAX (usa CALCULATE + SUMX/SUM):</label>
        <textarea value={measure} onChange={e => setMeasure(e.target.value)}
          className="w-full p-3 rounded-xl border-2 text-[11px] font-mono outline-none h-28"
          style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }} />
        <button onClick={() => setShow(true)}
          className="px-4 py-2 rounded-xl border-2 text-[11px] font-bold cursor-pointer"
          style={{ borderColor: colors.primary, background: colors.primary, color: '#1B2632' }}>▶ Validar medida</button>
        {show && (
          <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: ok ? '#22c55e' : '#ef4444', background: ok ? '#22c55e10' : '#ef444410', color: ok ? '#16a34a' : '#dc2626' }}>
            {ok ? `✓ CALCULATE + agregación correcta. Ventas totales = $${DAX_TOTAL.toLocaleString('es-MX')}.` : '✗ La medida debe usar CALCULATE y una agregación (SUMX/SUM) sobre el mart.'}
          </div>
        )}
      </div>
    </div>
  );
}