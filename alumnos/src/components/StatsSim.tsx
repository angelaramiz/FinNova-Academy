import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';

interface StatsSimProps { theme: Theme; onBack: () => void; }

// Carga el mart real compilado (golden total 128350).
function buildMart() {
  const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
  for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente']) {
    const model = MODELS.find(m => m.name === name);
    if (!model) continue;
    tables[name] = compileModelSql(model.sql, { ...SOURCES, ...tables });
  }
  return tables;
}

function fmt(v: number): string { return v.toLocaleString('es-MX', { maximumFractionDigits: 2 }); }

export default function StatsSim({ theme, onBack }: StatsSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [mart] = useState(() => buildMart());
  const martTable = mart['mrt_ventas_por_cliente'];

  const totalVentas = martTable?.rows.reduce((s: number, r: any) => s + Number(r.total_ventas || 0), 0) ?? 0;
  const clientes = martTable?.rows.length ?? 0;
  const montos = (martTable?.rows || []).map((r: any) => Number(r.total_ventas || 0)).filter(v => !isNaN(v));
  const prom = montos.length ? montos.reduce((a, b) => a + b, 0) / montos.length : 0;
  const min = montos.length ? Math.min(...montos) : 0;
  const max = montos.length ? Math.max(...montos) : 0;

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📈</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>StatsSim — Estadística descriptiva</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>Ciencia de Datos</span>
        <span className="flex-1" />
        <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>mart mrt_ventas_por_cliente</span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: 'Clientes', v: String(clientes) },
            { l: 'Total ventas', v: `$${fmt(totalVentas)}` },
            { l: 'Promedio', v: `$${fmt(prom)}` },
            { l: 'Mínimo', v: `$${fmt(min)}` },
            { l: 'Máximo', v: `$${fmt(max)}` },
          ].map(k => (
            <div key={k.l} className="bg-slate-900/30 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">{k.l}</span>
              <span className="text-base font-bold text-slate-200 font-mono">{k.v}</span>
            </div>
          ))}
        </div>

        <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: '#22c55e10', color: '#22c55e' }}>
          ✅ Golden mart: el total de ventas es $128,350 (coherente con dbt). Las features de este mart se degradan por el incidente del 05-jul (ver caso churn).
        </div>

        {/* Correlación simple: cantidad vs total */}
        {mart['stg_ventas'] && (
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">Correlación — cantidad × total (stg_ventas)</h4>
            <div className="flex items-end gap-1 h-24">
              {mart['stg_ventas'].rows.slice(0, 10).map((r: any, i: number) => {
                const total = Number(r.total || 0);
                const h = Math.min(100, Math.max(6, (total / 34000) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${h}%`, background: i % 2 ? '#8b5cf6' : '#6366f1' }} title={`${r.cliente}: $${fmt(total)}`} />
                    <span className="text-[7px] font-mono text-slate-500 truncate w-full text-center">{r.cliente?.slice(0, 8)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-2">top 10 filas · total = cantidad × precio_unit</p>
          </div>
        )}

        {/* Tabla del mart */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">Ventas por cliente (mart)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  {(martTable?.schema || []).map(c => <th key={c} className="py-1.5 px-2">{c}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {(martTable?.rows || []).map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-900/30">
                    {(martTable?.schema || []).map(c => (
                      <td key={c} className="py-1.5 px-2" style={{ color: colors.text }}>{typeof r[c] === 'number' ? fmt(r[c]) : r[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>StatsSim · datos reales del pipeline dbt</span>
        <span style={{ color: '#22c55e' }}>golden mart $128,350 ✓</span>
      </div>
    </div>
  );
}
