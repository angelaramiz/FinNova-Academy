// EXP finanzas — tema demo: interés compuesto (plantilla de los demás temas).
// Teoría mínima + quiz + gráfica. Los números SIEMPRE del motor vía
// GET /api/sim/finanzas/demo (el frontend nunca calcula).
// NOTA instructor: valida la teoría y el quiz antes de usar en clase.
import { useEffect, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { apiFetch } from '../lib/api';
import LineChart from './charts/LineChart';

interface Props { theme: Theme; onBack: () => void; }

interface DemoData {
  capital: number;
  tasaAnual: number;
  periodosPorAnio: number;
  anios: number;
  serie: Array<{ periodo: number; saldo: number; interes: number }>;
  montoFinal: number;
  interesTotal: number;
}

const QUIZ = [
  {
    q: '¿Por qué el interés compuesto crece más rápido que el simple?',
    opciones: [
      'Porque la tasa sube sola cada mes',
      'Porque cada periodo genera interés sobre el capital + los intereses ya ganados',
      'Porque el banco regala dinero al final',
    ],
    correcta: 1,
    explicacion: 'El interés de cada periodo se suma al saldo y el siguiente periodo rinde sobre ese saldo mayor.',
  },
  {
    q: '$10,000 al 12% anual capitalizable mensualmente durante 1 año dan…',
    opciones: ['$11,200.00 (12% directo)', '$11,268.25 (capitalización mensual)', '$12,000.00'],
    correcta: 1,
    explicacion: '12% directo sería interés simple; con capitalización mensual el motor calcula $11,268.25.',
  },
];

export default function FinanzasDemo({ theme, onBack }: Props) {
  const colors = themeColors[theme];
  const [data, setData] = useState<DemoData | null>(null);
  const [error, setError] = useState('');
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});

  useEffect(() => {
    apiFetch<DemoData>('/api/sim/finanzas/demo')
      .then(setData)
      .catch(() => setError('No se pudo cargar el caso del motor. Verifica que el backend (:3001) esté corriendo.'));
  }, []);

  const aciertos = QUIZ.filter((p, i) => respuestas[i] === p.correcta).length;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <span className="text-sm">🧪</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>Finanzas (exp) · Interés compuesto</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.warning}18`, color: colors.warning }}>rama experimental</span>
        <div className="flex-1" />
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>← Escritorio</button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }}>
          <div className="font-bold mb-1">Teoría mínima</div>
          <div>M = C·(1 + r/n)^(n·t): el monto crece porque cada periodo rinde sobre un saldo mayor.</div>
          <div style={{ color: colors.textMuted }}>Caso del motor: C=$10,000, r=12% anual, n=12, t=1 año.</div>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-[11px] font-mono" style={{ background: colors.errorBg, color: colors.error }}>{error}</div>
        )}

        {data && (
          <>
            <LineChart
              theme={theme}
              titulo={`Saldo mes a mes → $${data.montoFinal.toLocaleString('es-MX')} (interés total $${data.interesTotal.toLocaleString('es-MX')})`}
              series={data.serie.map((s) => s.saldo)}
              labels={data.serie.map((s) => `M${s.periodo}`)}
            />
            <div className="p-3 rounded-xl border-2 text-[11px] font-mono" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.text }}>
              <div className="font-bold mb-1">Quiz ({aciertos}/{QUIZ.length})</div>
              {QUIZ.map((p, i) => {
                const resuelta = respuestas[i] !== undefined;
                return (
                <div key={i} className="mb-3">
                  <div className="mb-1">{i + 1}. {p.q}</div>
                  {p.opciones.map((op, j) => {
                    const elegida = respuestas[i] === j;
                    return (
                      <button
                        key={j}
                        onClick={() => setRespuestas((r) => ({ ...r, [i]: j }))}
                        className="block w-full text-left px-2 py-1 my-1 rounded border text-[10px] cursor-pointer"
                        style={{
                          borderColor: colors.border,
                          background: elegida ? (j === p.correcta ? colors.successBg : colors.errorBg) : 'transparent',
                          color: colors.text,
                        }}
                      >
                        {op}
                      </button>
                    );
                  })}
                  {resuelta && (
                    <div className="text-[10px]" style={{ color: colors.textMuted }}>
                      {respuestas[i] === p.correcta ? '✓ ' : '✗ '}{p.explicacion}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
