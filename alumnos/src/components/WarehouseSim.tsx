import { useMemo, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';

interface WarehouseSimProps {
  theme: Theme;
  onBack: () => void;
}

interface WhTable {
  type: string;
  columns: { name: string; type: string }[];
  rows: Record<string, any>[];
}

const WH_ORDER = ['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente'];

const layerOf = (p: string): string => (p.includes('staging') ? 'staging' : p.includes('intermediate') ? 'intermediate' : 'marts');

const colType = (rows: Record<string, any>[], col: string): string => {
  const v = rows[0]?.[col];
  if (v === undefined) return '?';
  if (typeof v === 'number') return Number.isInteger(v) ? 'INT' : 'NUM';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return 'DATE';
  return 'STR';
};

function buildSchema(): Record<string, WhTable> {
  const out: Record<string, WhTable> = {};
  const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
  for (const name of WH_ORDER) {
    const model = MODELS.find(m => m.name === name);
    if (!model) continue;
    const compiled = compileModelSql(model.sql, { ...SOURCES, ...tables });
    tables[name] = compiled;
    out[name] = {
      type: layerOf(model.path),
      columns: compiled.schema.map(c => ({ name: c, type: colType(compiled.rows, c) })),
      rows: compiled.rows,
    };
  }
  return out;
}

const QUERIES = [
  { name: 'Top clientes por ventas (mart)', model: 'mrt_ventas_por_cliente', sql: 'SELECT cliente, total_ventas FROM mrt_ventas_por_cliente\nORDER BY total_ventas DESC' },
  { name: 'Ventas con sector (intermediate)', model: 'int_ventas_cliente', sql: 'SELECT fecha, cliente, sector, total FROM int_ventas_cliente\nORDER BY fecha' },
  { name: 'Últimas ventas registradas (staging)', model: 'stg_ventas', sql: 'SELECT fecha, cliente, total FROM stg_ventas\nORDER BY fecha DESC' },
];

interface QueryResult {
  name: string;
  sql: string;
  schema: string[];
  rows: Record<string, any>[];
}

const LAYERS: Array<{ key: string; label: string; color: string }> = [
  { key: 'staging', label: 'Staging · raw (1:1 con fuentes)', color: '#22c55e' },
  { key: 'intermediate', label: 'Intermediate · joins y lógica de negocio', color: '#3b82f6' },
  { key: 'marts', label: 'Marts · agregaciones para BI', color: '#f59e0b' },
];

export default function WarehouseSim({ theme, onBack }: WarehouseSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const schema = useMemo(buildSchema, []);

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🏗️</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Data Warehouse</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: colors.textMuted }}>dbt lno_dbt · compile real</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Schema visualization */}
        <div className="flex-1 overflow-auto p-6">
          {LAYERS.map(layer => (
            <div key={layer.key} className="mb-6">
              <div className="text-[11px] font-bold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
                <span className="w-3 h-3 rounded" style={{ background: layer.color }} />
                {layer.label}
              </div>
              <div className="flex flex-wrap gap-4">
                {Object.entries(schema).filter(([, t]) => t.type === layer.key).map(([name, table]) => (
                  <div key={name} onClick={() => setSelectedTable(name)}
                    className="rounded-xl border-2 p-3 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ borderColor: selectedTable === name ? layer.color : colors.border, background: colors.cardBg }}>
                    <div className="text-[11px] font-bold font-mono mb-2" style={{ color: layer.color }}>{name}</div>
                    <div className="space-y-1">
                      {table.columns.map(col => (
                        <div key={col.name} className="flex items-center gap-2 text-[9px] font-mono">
                          <span style={{ color: colors.textMuted }}>•</span>
                          <span style={{ color: colors.text }}>{col.name}</span>
                          <span className="ml-auto" style={{ color: colors.textMuted }}>{col.type}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-[8px] font-mono" style={{ color: colors.textMuted }}>
                      {table.rows.length} filas · {table.columns.length} cols
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Lineage (DAG dbt) */}
          <div className="rounded-xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-[11px] font-bold mb-3" style={{ color: colors.text }}>📊 Lineage (DAG dbt)</div>
            <div className="space-y-2 text-[9px] font-mono">
              <div className="flex items-center gap-2">
                <span style={{ color: '#22c55e' }}>stg_ventas</span>
                <span style={{ color: colors.textMuted }}>──▶</span>
                <span style={{ color: '#3b82f6' }}>int_ventas_cliente</span>
                <span style={{ color: colors.textMuted }}>──▶</span>
                <span style={{ color: '#f59e0b' }}>mrt_ventas_por_cliente</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#22c55e' }}>stg_clientes</span>
                <span style={{ color: colors.textMuted }}>──▶</span>
                <span style={{ color: '#3b82f6' }}>int_ventas_cliente</span>
              </div>
              <div className="text-[8px]" style={{ color: colors.textMuted }}>
                staging (raw 1:1) → intermediate (joins/lógica) → marts (agregaciones para BI)
              </div>
            </div>
          </div>
        </div>

        {/* Query panel */}
        <div className="w-80 shrink-0 border-l-2 flex flex-col" style={{ borderColor: colors.border }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>📝 Consultas de ejemplo</span>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {QUERIES.map((q, i) => (
              <button key={i} onClick={() => {
                const t = schema[q.model];
                if (t) setQueryResult({ name: q.name, sql: q.sql, schema: t.columns.map(c => c.name), rows: t.rows });
              }}
                className="w-full text-left p-2 rounded-lg text-[9px] font-mono cursor-pointer hover:opacity-80 transition"
                style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.text }}>
                {q.name}
              </button>
            ))}
          </div>
          {queryResult && (
            <div className="p-3 border-t" style={{ borderColor: colors.border }}>
              <div className="text-[9px] font-bold mb-2" style={{ color: colors.text }}>{queryResult.name}</div>
              <pre className="text-[8px] font-mono p-2 rounded-lg overflow-auto max-h-24" style={{ background: isDark ? '#0a0f1a' : '#1e293b', color: '#94a3b8' }}>
                {queryResult.sql}
              </pre>
              <div className="mt-2 rounded-lg overflow-auto max-h-44" style={{ border: `1px solid ${colors.border}` }}>
                <table className="w-full text-[8px] font-mono">
                  <thead>
                    <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                      {queryResult.schema.map(c => (
                        <th key={c} className="px-2 py-1 text-left" style={{ color: colors.textMuted }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.slice(0, 8).map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${colors.border}40` }}>
                        {queryResult.schema.map(c => (
                          <td key={c} className="px-2 py-1" style={{ color: colors.text }}>{String(r[c])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-2 py-1 text-[8px]" style={{ color: colors.textMuted }}>
                  {queryResult.rows.length} filas · preview
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}