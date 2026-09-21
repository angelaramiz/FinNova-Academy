// EXP finanzas — gráfica de línea SVG propia (cero dependencias).
// Sin datos quemados: todo entra por props (la serie sale del motor).
import { useMemo } from 'react';
import { themeColors, Theme } from '../../lib/theme';
import { buildPoints } from './chartMath';

interface Props {
  series: number[];
  labels: string[];
  formato?: 'mxn' | 'num';
  titulo?: string;
  theme: Theme;
}

const W = 260;
const H = 120;
const PAD = 14;

export default function LineChart({ series, labels, formato = 'mxn', titulo, theme }: Props) {
  const colors = themeColors[theme];
  const pts = useMemo(() => buildPoints(series, W, H, PAD), [series]);
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const min = series.length ? Math.min(...series) : 0;
  const max = series.length ? Math.max(...series) : 0;
  const fmt = (v: number) =>
    formato === 'mxn' ? `$${v.toLocaleString('es-MX', { maximumFractionDigits: 2 })}` : String(v);
  const labelIdx = series.length > 1 ? [0, series.length - 1] : [0];

  return (
    <div
      role="img"
      aria-label={titulo ? `Gráfica: ${titulo}. Máximo ${fmt(max)}.` : `Gráfica de línea. Máximo ${fmt(max)}.`}
      className="p-3 rounded-xl border-2"
      style={{ borderColor: colors.border, background: colors.cardBg }}
    >
      {titulo && (
        <div className="text-[11px] font-bold font-mono mb-2" style={{ color: colors.text }}>
          {titulo}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={colors.border} strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={colors.border} strokeWidth="1" />
        <polyline points={line} fill="none" stroke={colors.primary} strokeWidth="2" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={colors.primary} stroke={colors.cardBg} strokeWidth="1" />
        ))}
        {labelIdx.map((i) =>
          series[i] !== undefined ? (
            <text
              key={i}
              x={Math.min(Math.max(pts[i].x, 30), W - 30)}
              y={Math.max(pts[i].y - 5, 9)}
              textAnchor="middle"
              fontSize="8"
              fill={colors.textMuted}
            >
              {fmt(series[i])}
            </text>
          ) : null,
        )}
      </svg>
      <div className="flex justify-between text-[9px] font-mono mt-1" style={{ color: colors.textMuted }}>
        <span>{labels[0] ?? ''}</span>
        <span>
          mín {fmt(min)} · máx {fmt(max)}
        </span>
        <span>{labels[labels.length - 1] ?? ''}</span>
      </div>
    </div>
  );
}
