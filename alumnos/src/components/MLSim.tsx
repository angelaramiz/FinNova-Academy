import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';

interface MLSimProps { theme: Theme; onBack: () => void; }

function buildMart() {
  const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
  for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente']) {
    const model = MODELS.find(m => m.name === name);
    if (!model) continue;
    tables[name] = compileModelSql(model.sql, { ...SOURCES, ...tables });
  }
  return tables;
}

const fmt = (v: number) => v.toLocaleString('es-MX', { maximumFractionDigits: 2 });

// Baseline golden para el caso churn de Comercial del Norte.
// El incidente del 05-jul degradó las features (montos negativos/nulos).
const BASELINE = {
  split: '80/20 train/test',
  accuracy: 0.72,
  rmse: 1842,
  note: 'Baseline degradado por el incidente 05-jul: features del mart con montos negativos o nulos.',
  recoveredAccuracy: 0.85,
  recoveredRmse: 1310,
};

export default function MLSim({ theme, onBack }: MLSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [mart] = useState(() => buildMart());
  const [history, setHistory] = useState<{ at: string; accuracy: number; rmse: number }[]>([
    { at: '07-jul 16:20', accuracy: BASELINE.accuracy, rmse: BASELINE.rmse },
  ]);
  const [lastTrain, setLastTrain] = useState<typeof BASELINE | null>(null);

  function runTrain() {
    const now = new Date();
    const at = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setHistory(prev => [...prev, { at, accuracy: BASELINE.recoveredAccuracy, rmse: BASELINE.recoveredRmse }]);
    setLastTrain({ ...BASELINE, accuracy: BASELINE.recoveredAccuracy, rmse: BASELINE.recoveredRmse });
  }

  const clientes = mart['int_ventas_cliente']?.rows.length ?? 0;
  const last = history[history.length - 1];

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🤖</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>MLSim — Modelo baseline churn</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>Ciencia de Datos</span>
        <span className="flex-1" />
        <button onClick={runTrain} className="text-[11px] font-bold px-4 py-1.5 rounded-lg cursor-pointer transition hover:opacity-90" style={{ background: '#8b5cf6', color: '#fff' }}>
          ⚡ Entrenar modelo
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'Split', v: BASELINE.split },
            { l: 'Filas features', v: String(clientes) },
            { l: 'Accuracy', v: `${(last.accuracy * 100).toFixed(1)}%` },
            { l: 'RMSE', v: `$${fmt(last.rmse)}` },
          ].map(k => (
            <div key={k.l} className="bg-slate-900/30 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">{k.l}</span>
              <span className="text-base font-bold text-slate-200 font-mono">{k.v}</span>
            </div>
          ))}
        </div>

        <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: '#8b5cf610', color: '#8b5cf6' }}>
          🧪 Caso: churn de <strong>Comercial del Norte</strong>. Las features (frecuencia, monto total) se degradaron por el incidente del 05-jul; el baseline refleja esa caída. Tras recuperar el mart, las métricas mejoran.
        </div>

        {lastTrain ? (
          <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: '#22c55e10', color: '#22c55e' }}>
            ✅ Entrenamiento completado tras recuperar el mart: accuracy {BASELINE.recoveredAccuracy * 100}% · RMSE ${fmt(BASELINE.recoveredRmse)} (baseline original {BASELINE.accuracy * 100}% / ${fmt(BASELINE.rmse)}).
          </div>
        ) : (
          <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: '#f59e0b10', color: '#f59e0b' }}>
            ⚠ Baseline inicial degradado: accuracy {BASELINE.accuracy * 100}% · RMSE ${fmt(BASELINE.rmse)}. Ejecuta "Entrenar modelo" tras recuperar el pipeline.
          </div>
        )}

        {/* Comparación */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">Comparación de métricas</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono w-24 text-slate-500">Baseline</span>
              <div className="flex-1 h-4 rounded bg-slate-800/60 relative overflow-hidden">
                <div className="h-full" style={{ width: `${BASELINE.accuracy * 100}%`, background: '#f59e0b' }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-16 text-right">{(BASELINE.accuracy * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono w-24 text-slate-500">Recuperado</span>
              <div className="flex-1 h-4 rounded bg-slate-800/60 relative overflow-hidden">
                <div className="h-full" style={{ width: `${BASELINE.recoveredAccuracy * 100}%`, background: '#22c55e' }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-16 text-right">{(BASELINE.recoveredAccuracy * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Historial de experimentos */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">🧪 Historial de experimentos</h4>
          {history.length === 0 ? (
            <p className="text-[11px] text-slate-600">Sin experimentos registrados.</p>
          ) : (
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="py-1.5 px-2">Ejecución</th>
                  <th className="py-1.5 px-2">Accuracy</th>
                  <th className="py-1.5 px-2">RMSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-900/30">
                    <td className="py-1.5 px-2 text-slate-500">{h.at}</td>
                    <td className="py-1.5 px-2" style={{ color: h.accuracy >= BASELINE.recoveredAccuracy ? '#22c55e' : '#f59e0b' }}>{(h.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-1.5 px-2 text-slate-300">${fmt(h.rmse)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>MLSim · experimentos sobre datos del pipeline dbt</span>
        <span style={{ color: '#8b5cf6' }}>caso churn · Comercial del Norte</span>
      </div>
    </div>
  );
}
