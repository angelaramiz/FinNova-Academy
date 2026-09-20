// EXP finanzas — matemática pura de la gráfica (sin JSX, testeable en node).
// LineChart.tsx la consume; los tests la verifican sin DOM.

export interface Punto { x: number; y: number; }

// Mapea una serie al rectángulo (w,h) con margen pad. Sin datos quemados.
export function buildPoints(series: number[], w: number, h: number, pad: number): Punto[] {
  if (series.length === 0) return [];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const rango = max - min === 0 ? 1 : max - min;
  const n = series.length;
  return series.map((v, i) => ({
    x: n === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1),
    y: pad + (1 - (v - min) / rango) * (h - pad * 2),
  }));
}
