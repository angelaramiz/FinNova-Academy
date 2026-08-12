import { useMemo, useRef, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';

interface NotebookSimProps { theme: Theme; onBack: () => void; }

// ─── Tipos ─────────────────────────────────────────────────────

interface PyTable { columns: string[]; rows: Record<string, any>[]; }

type Output = { kind: 'table'; table: PyTable } | { kind: 'text'; text: string };

interface Cell { id: string; kind: 'code' | 'markdown'; source: string; output?: Output; exec: number | null; }

// ─── Warehouse: tablas reales del pipeline dbt ─────────────────

export function buildWarehouse(): Record<string, PyTable> {
  const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
  const order = ['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente'];
  for (const name of order) {
    const model = MODELS.find(m => m.name === name);
    if (!model) continue;
    const compiled = compileModelSql(model.sql, { ...SOURCES, ...tables });
    tables[name] = compiled;
  }
  return {
    stg_ventas: { columns: tables.stg_ventas.schema, rows: tables.stg_ventas.rows },
    stg_clientes: { columns: tables.stg_clientes.schema, rows: tables.stg_clientes.rows },
    int_ventas_cliente: { columns: tables.int_ventas_cliente.schema, rows: tables.int_ventas_cliente.rows },
    mrt_ventas_por_cliente: { columns: tables.mrt_ventas_por_cliente.schema, rows: tables.mrt_ventas_por_cliente.rows },
  };
}

const fmtNum = (v: any): string => {
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (typeof v === 'number') return v.toLocaleString('es-MX');
  return String(v);
};

// ─── Mini-kernel Python (subset pandas sobre el warehouse dbt) ─

function isTable(v: any): v is PyTable {
  return !!v && typeof v === 'object' && Array.isArray((v as PyTable).columns) && Array.isArray((v as PyTable).rows);
}

export class Kernel {
  vars: Record<string, any>;

  constructor(builtins: Record<string, PyTable>) {
    this.vars = { ...builtins };
  }

  reset(builtins: Record<string, PyTable>) {
    this.vars = { ...builtins };
  }

  stringify(value: any): string {
    if (value === null || value === undefined) return 'None';
    if (Array.isArray(value)) return `[${value.map(v => this.stringify(v)).join(', ')}]`;
    if (typeof value === 'object') {
      const t = value as PyTable;
      if (isTable(value)) return `<DataFrame: ${t.rows.length} rows x ${t.columns.length} cols>`;
      return JSON.stringify(value);
    }
    return String(value);
  }

  format(value: any): Output {
    if (isTable(value)) {
      const t = value as PyTable;
      return { kind: 'table', table: { columns: t.columns, rows: t.rows.slice(0, 15).map(r => ({ ...r })) } };
    }
    return { kind: 'text', text: this.stringify(value) };
  }

  evalRef(expr: string): any {
    const parts = expr.trim().split('.');
    let cur: any = parts[0] in this.vars ? this.vars[parts[0]] : undefined;
    for (let i = 1; i < parts.length; i++) cur = cur != null ? (cur as any)[parts[i]] : undefined;
    return cur;
  }

  execCell(source: string): Output {
    const code = source.replace(/^\s*#.*$/gm, '').trim();
    const first = code.split('\n').map(l => l.trim()).find(Boolean) || '';

    if (/^\s*(import|from)\s+\w+/.test(first)) {
      const lib = first.replace(/^\s*(import|from)\s+/, '').split(/[.\s]+/)[0];
      if (lib === 'pandas' || lib === 'numpy') return { kind: 'text', text: '' };
      throw new Error(`ModuleNotFoundError: No module named '${lib}'`);
    }

    const stmts = code.split('\n').map(s => s.trim()).filter(Boolean);
    let last: any = null;
    for (const stmt of stmts) last = this.execStatement(stmt);
    return this.format(last);
  }

  execStatement(stmt: string): any {
    let body = stmt;
    let assignName: string | null = null;
    const assign2 = body.match(/^(\w+)\s*=\s*([\s\S]+)$/);
    if (assign2) {
      assignName = assign2[1];
      body = assign2[2].trim();
    }
    if (/^\w+\s*=\s*$/.test(stmt)) throw new Error('SyntaxError: falta la expresión a la derecha de =');

    const out = this.execExpr(body);
    if (assignName) this.vars[assignName] = out;
    return out;
  }

  execExpr(b: string): any {
    if (b === '') return null;

    // print(...)
    const printM = b.match(/^print\((.*)\)$/s);
    if (printM) {
      const args = printM[1].split(',').map(a => a.trim());
      const txt = args.map(a => {
        const f = a.match(/^f([\"'])(.+)\1$/);
        if (f) {
          return f[2].replace(/\{(\w+)\}/g, (_: string, vname: string) => this.stringify(this.evalRef(vname)));
        }
        const q = a.match(/^(['"])(.*)\1$/s);
        if (q) return q[2];
        return this.stringify(this.evalRef(a));
      }).join(' ');
      return txt;
    }

    const name = (b.match(/^(\w+)/) || [])[1] || '';
    const rest = b.slice(name.length);
    const val = name ? this.vars[name] : undefined;

    if (name && isTable(val)) {
      const df = val as PyTable;
      const rc = (c: string): number[] => df.rows.map(r => Number(r[c])).filter(v => !isNaN(v));
      const colOf = (c: string) => {
        const bare = c.includes('.') ? c.split('.').pop()! : c;
        if (!df.columns.includes(bare)) throw new Error(`KeyError: '${c}'`);
        return bare;
      };

      const hh = rest.match(/^\.(head|tail)\((\d*)\)$/i);
      if (hh) {
        const n = hh[2] ? Number(hh[2]) : 5;
        const rows = hh[1].toLowerCase() === 'head' ? df.rows.slice(0, n) : df.rows.slice(-n);
        return { columns: df.columns, rows };
      }

      if (/^\.describe\(\)$/i.test(rest)) {
        const numeric = df.columns.filter(c => df.rows.some(r => typeof r[c] === 'number'));
        if (!numeric.length) return { kind: 'text', text: 'DataFrame sin columnas numéricas' };
        const stats: string[] = ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'];
        const rows: Record<string, any>[] = stats.map(s => {
          const row: Record<string, any> = { stat: s };
          for (const c of numeric) {
            const vals = rc(c);
            switch (s) {
              case 'count': row[c] = vals.length; break;
              case 'mean': row[c] = vals.length ? vals.reduce((a2, b2) => a2 + b2, 0) / vals.length : 0; break;
              case 'std': row[c] = vals.length > 1 ? Math.sqrt(vals.reduce((a2, b2) => a2 + (b2 - vals.reduce((x, y) => x + y, 0) / vals.length) ** 2, 0) / (vals.length - 1)) : 0; break;
              case 'min': row[c] = vals.length ? Math.min(...vals) : 0; break;
              case 'max': row[c] = vals.length ? Math.max(...vals) : 0; break;
              case '25%': row[c] = quantile(vals, 0.25); break;
              case '50%': row[c] = quantile(vals, 0.5); break;
              case '75%': row[c] = quantile(vals, 0.75); break;
            }
          }
          return row;
        });
        return { columns: ['stat', ...numeric], rows };
      }

      if (/^\.dtypes$/i.test(rest)) {
        const rows = df.columns.map(c => {
          const sample = df.rows.find(r => r[c] != null);
          const t = typeof sample === 'number' ? (Number.isInteger(sample) ? 'int64' : 'float64') : 'object';
          return { columna: c, dtype: t };
        });
        return { columns: ['columna', 'dtype'], rows };
      }

      if (/^\.columns$/i.test(rest)) return `Index([${df.columns.map(c => `'${c}'`).join(', ')}], dtype='object')`;

      const shape = rest.match(/^\.shape$/i);
      if (shape) return `(${df.rows.length}, ${df.columns.length})`;

      if (/^\.info\(\)$/i.test(rest)) {
        const lines = [
          `<class 'pandas.core.frame.DataFrame'>`,
          `RangeIndex: ${df.rows.length} entries, 0 to ${df.rows.length - 1}`,
          `Data columns (total ${df.columns.length} columnas):`,
          '',
          ...df.columns.map(c => {
            const nn = df.rows.filter(r => r[c] != null).length;
            const sample = df.rows.find(r => r[c] != null);
            const dt = typeof sample === 'number' ? 'int64' : 'object';
            return `  ${c.padEnd(26)} ${nn} non-null   ${dt}`;
          }),
          `dtypes: object, int64`,
          `memory usage: ${((df.rows.length * df.columns.length * 8) / 1024).toFixed(1)} KB`,
        ];
        return lines.join('\n');
      }

      const selSeries = rest.match(/\[\s*['"](\w+)['"]\s*\]$/i);
      if (selSeries) {
        const c = colOf(selSeries[1]);
        const series = df.rows.map((r, i) => `${i}    ${fmtNum(r[c])}`);
        return series.join('\n');
      }

      const sortM = rest.match(/^\.sort_values\(\s*['"](\w+)['"]\s*(?:,\s*ascending=(True|False))?\s*\)$/i);
      if (sortM) {
        const c = colOf(sortM[1]);
        const asc = (sortM[2] || 'true').toLowerCase() === 'true';
        const rows = [...df.rows].sort((a, r2) => {
          const av = Number(a[c]); const bv = Number(r2[c]);
          if (isNaN(av) || isNaN(bv)) return String(a[c]).localeCompare(String(r2[c]));
          return asc ? av - bv : bv - av;
        });
        return { columns: df.columns, rows };
      }

      const filterM = rest.match(/^\[\s*(\w+(?:\.\w+)*)\s*([<>=!]+)\s*(.+)\s*\]$/i);
      if (filterM) {
        const c = colOf(filterM[1]);
        const op = filterM[2];
        let rhs: any = filterM[3].trim();
        if (/^[-+]?\d+(\.\d+)?$/.test(rhs)) rhs = Number(rhs);
        else if (/^['"].*['"]$/.test(rhs)) rhs = rhs.slice(1, -1);
        const rows = df.rows.filter(r => {
          const l = r[c];
          switch (op) {
            case '>': return Number(l) > Number(rhs);
            case '<': return Number(l) < Number(rhs);
            case '>=': return Number(l) >= Number(rhs);
            case '<=': return Number(l) <= Number(rhs);
            case '==': return String(l) === String(rhs);
            case '!=': return String(l) !== String(rhs);
            default: return false;
          }
        });
        return { columns: df.columns, rows };
      }

      const grpM = rest.match(/^\.groupby\(\s*\[?\s*['"](\w+)['"]\s*(?:,\s*['"](\w+)['"]\s*)?\s*\]?\s*\)\s*(?:\[\s*['"](\w+)['"]\s*\])?\s*\.(sum|mean|min|max|count)\(\)$/i);
      if (grpM) {
        const keyCols = (grpM[2] ? [grpM[1], grpM[2]] : [grpM[1]]).map(colOf);
        const sel = grpM[3];
        const fn = grpM[4].toLowerCase();
        const numCols = sel ? [colOf(sel)] : df.columns.filter(c => !keyCols.includes(c) && df.rows.some(r => typeof r[c] === 'number'));
        const groups = new Map<string, Record<string, any>[]>();
        for (const row of df.rows) {
          const key = keyCols.map(c => String(row[c])).join('|');
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(row);
        }
        const outRows: Record<string, any>[] = [];
        for (const [key, g] of groups) {
          const row: Record<string, any> = {};
          keyCols.forEach((c, i) => { row[c] = key.split('|')[i]; });
          numCols.forEach(c => {
            const vals = g.map(r => Number(r[c])).filter(v => !isNaN(v));
            row[c] = fn === 'sum' ? vals.reduce((a2, b2) => a2 + b2, 0) : fn === 'count' ? vals.length : fn === 'max' ? (vals.length ? Math.max(...vals) : 0) : fn === 'min' ? (vals.length ? Math.min(...vals) : 0) : (vals.length ? vals.reduce((a2, b2) => a2 + b2, 0) / vals.length : 0);
          });
          outRows.push(row);
        }
        return { columns: [...keyCols, ...numCols], rows: outRows };
      }

      const seriesAgg = rest.match(/\[\s*['"](\w+)['"]\s*\]\.(sum|mean|max|min|count)\(\)$/i);
      if (seriesAgg) {
        const c = colOf(seriesAgg[1]);
        const vals = rc(c);
        const f = seriesAgg[2].toLowerCase();
        return f === 'sum' ? vals.reduce((a2, b2) => a2 + b2, 0) : f === 'mean' ? (vals.length ? vals.reduce((a2, b2) => a2 + b2, 0) / vals.length : 0) : f === 'max' ? Math.max(...vals) : f === 'min' ? Math.min(...vals) : vals.length;
      }

      const nunique = rest.match(/\[\s*['"](\w+)['"]\s*\]\.nunique\(\)/i);
      if (nunique) {
        const c = colOf(nunique[1]);
        return new Set(df.rows.map(r => r[c])).size;
      }

      const prop = rest.match(/^\.(\w+)/i);
      if (prop) {
        throw new Error(`AttributeError: 'DataFrame' has no attribute '${prop[1]}'`);
      }
    }

    if (name && !(name in this.vars)) {
      throw new Error(`NameError: name '${name}' is not defined`);
    }

    if (name && this.vars[name] !== undefined && !isTable(this.vars[name])) {
      throw new Error(`AttributeError: '${typeof this.vars[name]}' object has no attribute '${rest.slice(1)}'`);
    }

    const arith = b.match(/^([-+]?\d+(\.\d+)?)\s*([+\-*/])\s*([-+]?\d+(\.\d+)?)$/);
    if (arith) {
      const a = Number(arith[1]); const c2 = Number(arith[4]);
      const o = arith[3];
      return o === '+' ? a + c2 : o === '-' ? a - c2 : o === '*' ? a * c2 : a / c2;
    }

    const rndM = b.match(/^round\((.+),\s*(\d+)\)$/);
    if (rndM) {
      const inner = this.evalRef(rndM[1].trim());
      const n = Number(rndM[2]);
      return Number(Number(inner).toFixed(n));
    }

    const nameOnly = /^\w+$/.test(b);
    if (nameOnly) {
      if (name in this.vars) {
        const t = this.vars[name] as PyTable;
        return { columns: t.columns, rows: t.rows.slice(0, 10).map(r => ({ ...r })) };
      }
      throw new Error(`NameError: name '${b}' is not defined`);
    }

    throw new Error(`SyntaxError: ${b}`);
  }
}

function quantile(vals: number[], p: number): number {
  if (!vals.length) return 0;
  const s = [...vals].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx); const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

// ─── Markdown (render básico) ──────────────────────────────────

function inlineMd(text: string, cols: any): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: cols.text }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="px-1 py-0.5 rounded text-[10px]" style={{ background: cols.cardBg, color: cols.primary }}>{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  })}</>;
}

function renderMarkdown(text: string, cols: any): React.ReactElement {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        const h1 = line.match(/^#\s+(.*)/);
        if (h1) return <div key={i} className="text-sm font-extrabold" style={{ color: cols.text }}>{h1[1]}</div>;
        const h2 = line.match(/^##\s+(.*)/);
        if (h2) return <div key={i} className="text-[13px] font-bold mt-2" style={{ color: cols.text }}>{inlineMd(h2[1], cols)}</div>;
        const h3 = line.match(/^###\s+(.*)/);
        if (h3) return <div key={i} className="text-xs font-bold" style={{ color: cols.text }}>{inlineMd(h3[1], cols)}</div>;
        const li = line.match(/^\s*[-*]\s+(.*)/);
        if (li) return <div key={i} className="flex gap-1.5 text-[11px]"><span style={{ color: cols.primary }}>•</span><span style={{ color: cols.textMuted }}>{inlineMd(li[1], cols)}</span></div>;
        if (line.trim() === '') return <div key={i} className="h-1.5" />;
        return <div key={i} className="text-[11px]" style={{ color: cols.textMuted }}>{inlineMd(line, cols)}</div>;
      })}
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────

const DEFAULT_NOTEBOOK: Array<{ kind: 'code' | 'markdown'; source: string }> = [
  { kind: 'markdown', source: `# Reporte de Ventas · Warehouse dbt\nNotebook de análisis sobre el pipeline compilado en **dbt Transform**. Variables disponibles: \`ventas\`, \`clientes\`, \`ventas_cliente\`, \`top_clientes\`.` },
  { kind: 'code', source: `ventas.head()` },
  { kind: 'code', source: `ventas['total'].sum()` },
  { kind: 'code', source: `top_clientes.sort_values('total_ventas', ascending=False)` },
  { kind: 'markdown', source: `## Insight\nEl cliente protagonista del mes es **TechCorp SA**. Verifica su monto con: \`ventas[ventas.cliente == 'TechCorp SA']['total'].sum()\`.` },
  { kind: 'code', source: `total_ventas = ventas['total'].sum()\nprint(f"Total facturado del mes: {total_ventas} MXN")` },
  { kind: 'code', source: `top_clientes.describe()` },
];

let uidCounter = 0;
const uid = () => `cell-${++uidCounter}`;

export default function NotebookSim({ theme, onBack }: NotebookSimProps) {
  const colors = themeColors[theme];
  const warehouse = useMemo(() => {
    const all = buildWarehouse();
    return {
      ventas: all.stg_ventas,
      clientes: all.stg_clientes,
      ventas_cliente: all.int_ventas_cliente,
      top_clientes: all.mrt_ventas_por_cliente,
    };
  }, []);

  const [cells, setCells] = useState<Cell[]>(() =>
    DEFAULT_NOTEBOOK.map(c => ({ id: uid(), kind: c.kind, source: c.source, output: undefined, exec: null }))
  );
  const kernelRef = useRef<Kernel>(new Kernel(warehouse));
  const execCounter = useRef(0);

  const runCell = (id: string): void => {
    const cell = cells.find(c => c.id === id);
    if (!cell || cell.kind !== 'code') return;
    execCounter.current += 1;
    const n = execCounter.current;
    try {
      const out = kernelRef.current.execCell(cell.source);
      setCells(prev => prev.map(c => (c.id === id ? { ...c, output: out, exec: n } : c)));
    } catch (err: any) {
      setCells(prev => prev.map(c => (c.id === id ? { ...c, output: { kind: 'text', text: err.message || String(err) } as Output, exec: n } : c)));
    }
  };

  const runAll = (): void => {
    const kernel = kernelRef.current;
    let count = execCounter.current;
    const next = cells.map(c => {
      if (c.kind !== 'code') return { ...c };
      count += 1;
      try {
        const out = kernel.execCell(c.source);
        return { ...c, output: out, exec: count };
      } catch (err: any) {
        return { ...c, output: { kind: 'text', text: err.message || String(err) } as Output, exec: count };
      }
    });
    execCounter.current = count;
    setCells(next);
  };

  const addCell = (kind: 'code' | 'markdown'): void => {
    setCells(prev => [...prev, { id: uid(), kind, source: kind === 'code' ? 'df = ventas\ndf.head()' : '', output: undefined, exec: null }]);
  };

  const deleteCell = (id: string): void => {
    setCells(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx <= 0) return prev;
      return prev.filter(c => c.id !== id);
    });
  };

  const clearOutputs = (): void => {
    setCells(prev => prev.map(c => (c.kind === 'code' ? { ...c, output: undefined, exec: null } : c)));
  };

  const restart = (): void => {
    kernelRef.current.reset(warehouse);
    execCounter.current = 0;
    clearOutputs();
  };

  const updateSource = (id: string, source: string): void => {
    setCells(prev => prev.map(c => (c.id === id ? { ...c, source } : c)));
  };

  const btn = (pressed = false) => ({
    background: pressed ? colors.primary : colors.cardBg,
    border: `1px solid ${pressed ? colors.primary : colors.border}`,
    color: pressed ? '#fff' : colors.textMuted,
  });

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <button onClick={onBack} className="text-[10px] px-2 py-1 rounded font-bold cursor-pointer hover:opacity-80" style={{ background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>← Escritorio</button>
        <span className="text-sm">🐍</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>reporte_ventas.ipynb</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.success}18`, color: colors.success }}>● idle · python3</span>
        <div className="flex-1" />
        <button onClick={() => addCell('code')} className="text-[10px] px-2 py-1 rounded" style={btn()}>＋ Código</button>
        <button onClick={() => addCell('markdown')} className="text-[10px] px-2 py-1 rounded" style={btn()}>＋ Markdown</button>
        <button onClick={clearOutputs} className="text-[10px] px-2 py-1 rounded" style={btn()}>Limpiar salidas</button>
        <button onClick={restart} className="text-[10px] px-2 py-1 rounded" style={btn()}>⭮ Kernel</button>
        <button onClick={runAll} className="text-[10px] px-3 py-1 rounded font-bold" style={btn(true)}>▶▶ Ejecutar todo</button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {cells.map((cell, idx) => {
          const out = cell.output;
          return (
            <div key={cell.id} className="rounded-lg border overflow-hidden" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-2 px-3 py-1 border-b" style={{ background: colors.bg, borderColor: colors.border }}>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: cell.kind === 'code' ? colors.primary : colors.secondary, color: '#fff' }}>
                  {cell.kind === 'code' ? `In [${cell.exec ?? ' '}]:` : 'MD'}
                </span>
                <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{cell.kind === 'code' ? `# código · línea ${idx + 1}` : 'markdown'}</span>
                <div className="flex-1" />
                {cell.kind === 'code' && (
                  <button onClick={() => runCell(cell.id)} className="text-[9px] px-1.5 py-0.5 rounded hover:opacity-80" style={{ background: colors.primary, color: '#fff' }}>▶ Ejecutar</button>
                )}
                <button onClick={() => deleteCell(cell.id)} className="text-[9px] px-1 py-0.5 rounded hover:bg-red-500/20" style={{ color: colors.textMuted }} title="Eliminar celda">✕</button>
              </div>

              {cell.kind === 'markdown' ? (
                <div className="px-4 py-2.5">{renderMarkdown(cell.source, colors)}</div>
              ) : (
                <>
                  <div className="px-3 py-2">
                    {cell.source.split('\n').map((line, li) => (
                      <div key={li} className="flex items-start gap-2">
                        <span className="w-8 text-right text-[9px] font-mono select-none shrink-0" style={{ color: colors.textMuted }}>{String(li + 1).padStart(2, '0')}</span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          className="flex-1 text-[11px] font-mono outline-none"
                          style={{ color: colors.text, whiteSpace: 'pre' }}
                          onInput={(e) => {
                            const lines = cell.source.split('\n');
                            lines[li] = e.currentTarget.textContent || '';
                            updateSource(cell.id, lines.join('\n'));
                          }}
                        >
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>

                  {out && (
                    <div className="mx-3 mb-3 rounded-md overflow-hidden" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2 px-3 py-1 border-b" style={{ borderColor: colors.border }}>
                        <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>Out [{cell.exec}]:</span>
                        {out.kind === 'table' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.success}18`, color: colors.success }}>DataFrame · {out.table.rows.length} rows</span>
                        )}
                      </div>
                      {out.kind === 'table' ? (
                        <div className="overflow-x-auto">
                          <table className="border-collapse w-full text-left">
                            <thead>
                              <tr>
                                {out.table.columns.map((c: string) => (
                                  <th key={c} className="text-[9px] font-mono px-2 py-1 font-semibold" style={{ color: colors.primary, borderBottom: `1px solid ${colors.border}` }}>{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {out.table.rows.map((r, ri) => (
                                <tr key={ri} style={{ background: ri % 2 ? colors.cardSecondary : undefined }}>
                                  {out.table.columns.map((c: string) => (
                                    <td key={c} className="text-[9px] font-mono px-2 py-1 whitespace-nowrap" style={{ color: colors.text }}>{fmtNum(r[c])}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <pre className="px-3 py-2 text-[10px] font-mono whitespace-pre-wrap" style={{ color: colors.text }}>{out.text}</pre>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}