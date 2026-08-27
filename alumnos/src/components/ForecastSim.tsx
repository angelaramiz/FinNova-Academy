import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Props { theme: Theme; onBack: () => void; }

// Serie mensual real del mart (jul 2026): media móvil + MAPE.
export const FORECAST_SERIES = [112400, 118900, 124150, 128350];
function movAvg(series: number[], w: number): number | null {
  if (series.length < w || w <= 0) return null;
  return Math.round(series.slice(-w).reduce((a, b) => a + b, 0) / w);
}

export default function ForecastSim({ theme, onBack }: Props) {
  const colors = themeColors[theme];
  const [window, setWindow] = useState(3);
  const fc = movAvg(FORECAST_SERIES, window);
  const last = FORECAST_SERIES[FORECAST_SERIES.length - 1];
  const mape = last ? Math.round(Math.abs(last - (fc || 0)) / last * 100) : 0;
  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>🔮 Forecast — Pronóstico de ventas</span>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded ml-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>Escritorio</button>
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <div className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Serie del mart (ventas mensuales): {FORECAST_SERIES.map(v => `$${v.toLocaleString('es-MX')}`).join(' → ')}</div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono" style={{ color: colors.textMuted }}>Ventana media móvil:</span>
          {[2, 3].map(w => (
            <button key={w} onClick={() => setWindow(w)}
              className="px-3 py-1 rounded-xl border-2 text-[11px] font-bold cursor-pointer"
              style={{ borderColor: colors.primary, background: window === w ? colors.primary : 'transparent', color: window === w ? '#1B2632' : colors.primary }}>{w}</button>
          ))}
        </div>
        {fc && (
          <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: colors.border, background: colors.cardBg }}>
            <div style={{ color: colors.text }}>Pronóstico media móvil (ventana {window}): <strong style={{ color: colors.primary }}>${fc.toLocaleString('es-MX')}</strong></div>
            <div style={{ color: colors.textMuted }}>MAPE vs último real (${last.toLocaleString('es-MX')}): <strong style={{ color: mape < 10 ? '#16a34a' : '#dc2626' }}>{mape}%</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}