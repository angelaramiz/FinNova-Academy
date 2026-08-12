import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface DBTSimProps { theme: Theme; onBack: () => void; }

// ─── Tipos ─────────────────────────────────────────────────────

interface AnyTable { schema: string[]; rows: Record<string, any>[]; }

interface DbtModel {
  id: string;
  name: string;
  path: string;
  description: string;
  sql: string;
}

interface DbtTest {
  id: string;
  model: string;
  column: string;
  type: 'not_null' | 'unique' | 'positive';
  label: string;
}

interface BuildResult { model: DbtModel; table: AnyTable; elapsedMs: number; }

interface TestResult { test: DbtTest; pass: boolean; detail: string; }

// ─── Fuentes (sources) ─────────────────────────────────────────

export const SOURCES: Record<string, AnyTable> = {
  raw_ventas: {
    schema: ['id', 'fecha', 'cliente', 'producto', 'cantidad', 'precio_unit'],
    rows: [
      { id: 1, fecha: '2026-07-01', cliente: 'TechCorp SA', producto: 'Flete express', cantidad: 2, precio_unit: 8500 },
      { id: 2, fecha: '2026-07-01', cliente: 'Distribuidora Luna', producto: 'Almacenaje', cantidad: 10, precio_unit: 320 },
      { id: 3, fecha: '2026-07-02', cliente: 'TechCorp SA', producto: 'Carga especializada', cantidad: 1, precio_unit: 12500 },
      { id: 4, fecha: '2026-07-03', cliente: 'Constructora Norte', producto: 'Flete express', cantidad: 3, precio_unit: 8500 },
      { id: 5, fecha: '2026-07-03', cliente: 'Distribuidora Luna', producto: 'Seguro de carga', cantidad: 5, precio_unit: 250 },
      { id: 6, fecha: '2026-07-04', cliente: 'Comercial Valle', producto: 'Transporte intl', cantidad: 1, precio_unit: 28500 },
      { id: 7, fecha: '2026-07-05', cliente: 'TechCorp SA', producto: 'Almacenaje', cantidad: 20, precio_unit: 320 },
      { id: 8, fecha: '2026-07-05', cliente: 'Inversiones Trust', producto: 'Flete express', cantidad: 4, precio_unit: 8500 },
    ],
  },
  raw_clientes: {
    schema: ['id', 'nombre', 'rfc', 'ciudad', 'sector'],
    rows: [
      { id: 1, nombre: 'TechCorp SA', rfc: 'TEC-990101', ciudad: 'CDMX', sector: 'Tecnología' },
      { id: 2, nombre: 'Distribuidora Luna', rfc: 'DLU-880202', ciudad: 'Guadalajara', sector: 'Retail' },
      { id: 3, nombre: 'Constructora Norte', rfc: 'CNO-770303', ciudad: 'Monterrey', sector: 'Construcción' },
      { id: 4, nombre: 'Comercial Valle', rfc: 'CVA-660404', ciudad: 'Puebla', sector: 'Comercio' },
      { id: 5, nombre: 'Inversiones Trust', rfc: 'ITR-550505', ciudad: 'CDMX', sector: 'Finanzas' },
    ],
  },
};

// ─── Models (archivos .sql con sintaxis dbt/Jinja) ─────────────

export const MODELS: DbtModel[] = [
  {
    id: 'm1', name: 'stg_ventas', path: 'models/staging/',
    description: 'Staging: limpia el raw de ventas y calcula el total por línea.',
    sql: `{{ config(materialized='table', schema='staging') }}

SELECT
    id,
    fecha,
    cliente,
    producto,
    cantidad,
    precio_unit,
    cantidad * precio_unit AS total
FROM {{ source('raw_ventas') }}
WHERE cantidad > 0`,
  },
  {
    id: 'm2', name: 'stg_clientes', path: 'models/staging/',
    description: 'Staging: renombra columnas del catálogo de clientes.',
    sql: `{{ config(materialized='table', schema='staging') }}

SELECT
    id AS cliente_id,
    nombre,
    rfc,
    ciudad,
    sector
FROM {{ source('raw_clientes') }}`,
  },
  {
    id: 'm3', name: 'int_ventas_cliente', path: 'models/intermediate/',
    description: 'Intermediate: JOIN de ventas con clientes usando ref().',
    sql: `{{ config(materialized='table', schema='intermediate') }}

SELECT
    v.id AS venta_id,
    v.fecha,
    v.cliente,
    v.producto,
    v.cantidad,
    v.total,
    c.cliente_id,
    c.ciudad,
    c.sector
FROM {{ ref('stg_ventas') }} v
LEFT JOIN {{ ref('stg_clientes') }} c
  ON c.nombre = v.cliente
WHERE v.total > 0`,
  },
  {
    id: 'm4', name: 'mrt_ventas_por_cliente', path: 'models/marts/',
    description: 'Mart: ventas agregadas por cliente para el reporte ejecutivo.',
    sql: `{{ config(materialized='table', schema='marts') }}

SELECT
    v.cliente,
    c.ciudad,
    c.sector,
    COUNT(*) AS num_ventas,
    SUM(v.total) AS total_ventas
FROM {{ ref('int_ventas_cliente') }} v
LEFT JOIN {{ ref('stg_clientes') }} c
  ON c.nombre = v.cliente
GROUP BY v.cliente, c.ciudad, c.sector
ORDER BY total_ventas DESC`,
  },
];

const TESTS: DbtTest[] = [
  { id: 't1', model: 'stg_ventas', column: 'id', type: 'not_null', label: 'not_null(id)' },
  { id: 't2', model: 'stg_ventas', column: 'total', type: 'positive', label: 'positive(total > 0)' },
  { id: 't3', model: 'stg_clientes', column: 'cliente_id', type: 'unique', label: 'unique(cliente_id)' },
  { id: 't4', model: 'int_ventas_cliente', column: 'venta_id', type: 'not_null', label: 'not_null(venta_id)' },
  { id: 't5', model: 'mrt_ventas_por_cliente', column: 'total_ventas', type: 'positive', label: 'positive(total_ventas)' },
];

// ─── Documentación de columnas (dbt docs) ──────────────────────

const MODEL_COLUMN_DOCS: Record<string, Record<string, { type: string; description: string }>> = {
  stg_ventas: {
    id: { type: 'INT', description: 'Identificador único de la venta.' },
    fecha: { type: 'DATE', description: 'Fecha en que se facturó el servicio.' },
    cliente: { type: 'VARCHAR', description: 'Nombre del cliente (join con clientes).' },
    producto: { type: 'VARCHAR', description: 'Servicio de logística vendido.' },
    cantidad: { type: 'INT', description: 'Cantidad de unidades del servicio.' },
    precio_unit: { type: 'NUMERIC', description: 'Precio unitario en MXN.' },
    total: { type: 'NUMERIC', description: 'Resultado de cantidad × precio_unit.' },
  },
  stg_clientes: {
    cliente_id: { type: 'INT', description: 'Clave primaria del cliente.' },
    nombre: { type: 'VARCHAR', description: 'Razón social del cliente.' },
    rfc: { type: 'VARCHAR', description: 'RFC del cliente.' },
    ciudad: { type: 'VARCHAR', description: 'Ciudad de operación.' },
    sector: { type: 'VARCHAR', description: 'Sector económico.' },
  },
  int_ventas_cliente: {
    venta_id: { type: 'INT', description: 'Clave primaria de la venta (heredada).' },
    cliente: { type: 'VARCHAR', description: 'Nombre del cliente.' },
    total: { type: 'NUMERIC', description: 'Monto total de la venta.' },
    cliente_id: { type: 'INT', description: 'FK al catálogo de clientes.' },
    ciudad: { type: 'VARCHAR', description: 'Ciudad del cliente.' },
    sector: { type: 'VARCHAR', description: 'Sector del cliente.' },
  },
  mrt_ventas_por_cliente: {
    cliente: { type: 'VARCHAR', description: 'Cliente agregado.' },
    ciudad: { type: 'VARCHAR', description: 'Ciudad del cliente.' },
    sector: { type: 'VARCHAR', description: 'Sector del cliente.' },
    num_ventas: { type: 'INT', description: 'Número de ventas del cliente.' },
    total_ventas: { type: 'NUMERIC', description: 'Suma total de ventas en MXN.' },
  },
};

// ─── Micro-compilador SQL (dbt: refs + config + SQL puro) ──────

interface Kw { name: string; pos: number; end: number; }

function keywords(sql: string): Kw[] {
  const lower = sql.toLowerCase();
  const all: Kw[] = [];
  for (const kw of ['select', 'from', 'join', 'on', 'where', 'group', 'order', 'having', 'limit']) {
    let i = lower.indexOf(kw);
    while (i !== -1) {
      const before = i === 0 ? '' : lower[i - 1];
      const after = i + kw.length >= lower.length ? '' : lower[i + kw.length];
      if (!/[a-z0-9_]/.test(before) && !/[a-z0-9_]/.test(after)) all.push({ name: kw, pos: i, end: i + kw.length });
      i = lower.indexOf(kw, i + kw.length);
    }
  }
  return all.sort((a, b) => a.pos - b.pos);
}

function resolveColumn(row: Record<string, any>, key: string): any {
  const k = key.trim();
  if (k.includes('.')) return row[k];
  if (k in row) return row[k];
  const prefixed = Object.entries(row).filter(([ck]) => ck.includes('.') && ck.split('.').pop() === k);
  return prefixed.length ? prefixed[0][1] : undefined;
}

function evalCondition(row: Record<string, any>, cond: string): boolean {
  const c = cond.trim();
  const notNull = c.match(/^(.+?)\s+is\s+not\s+null$/i);
  if (notNull) return resolveColumn(row, notNull[1]) != null;
  const isNull = c.match(/^(.+?)\s+is\s+null$/i);
  if (isNull) return resolveColumn(row, isNull[1]) == null;
  const op = c.match(/^(.+?)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)$/);
  if (!op) return Boolean(resolveColumn(row, c));
  const lhs = resolveColumn(row, op[1]);
  let rhs: any = op[3].trim();
  if (/^[0-9]+([.,][0-9]+)?$/.test(rhs)) rhs = Number(rhs);
  else if (/^['"].*['"]$/.test(rhs)) rhs = rhs.slice(1, -1);
  else rhs = resolveColumn(row, rhs);
  switch (op[2]) {
    case '=': return String(lhs) === String(rhs);
    case '!=': case '<>': return String(lhs) !== String(rhs);
    case '>': return Number(lhs) > Number(rhs);
    case '<': return Number(lhs) < Number(rhs);
    case '>=': return Number(lhs) >= Number(rhs);
    case '<=': return Number(lhs) <= Number(rhs);
    default: return true;
  }
}

interface SelectItem { name: string; expr: string; aggFn: string; aggCol: string; isAgg: boolean; isStar: boolean; }

function parseSelectItem(item: string): SelectItem {
  const raw = item.trim();
  const asm = raw.match(/^(.+?)\s+as\s+["']?(\w+)["']?$/i);
  const expr = (asm ? asm[1] : raw).trim();
  const alias = asm ? asm[2] : expr.replace(/^\w+\./, '');
  const aggMatch = expr.match(/^(sum|avg|min|max|count)\s*\(\s*(distinct\s+)?([\w.]+|\*)\s*\)$/i);
  if (aggMatch) return { name: alias, expr, aggFn: aggMatch[1].toLowerCase(), aggCol: aggMatch[3], isAgg: true, isStar: false };
  return { name: alias, expr, aggFn: '', aggCol: '', isAgg: false, isStar: expr === '*' };
}

export function compileModelSql(sql: string, tables: Record<string, AnyTable>): AnyTable {
  let s = sql
    .replace(/\{\{\s*config\([^)]*\)\s*\}\}/g, '')
    .replace(/\{\{\s*ref\('([\w.]+)'\)\s*\}\}/g, '$1')
    .replace(/\{\{\s*source\('([\w.]+)'\)\s*\}\}/g, '$1')
    .replace(/;\s*$/, '');

  const kws = keywords(s);
  const selectKw = kws.find(k => k.name === 'select');
  const fromKw = kws.find(k => k.name === 'from');
  if (!selectKw || !fromKw) return { schema: [], rows: [] };

  const selectText = s.slice(selectKw.end, fromKw.pos).trim();
  const nextAfterFrom = kws.filter(k => k.pos > fromKw.pos && k.name !== 'from');
  const fromEnd = nextAfterFrom.length ? nextAfterFrom[0].pos : s.length;
  const fromText = s.slice(fromKw.end, fromEnd).trim();

  const fromTokens = fromText.replace(/\s+/g, ' ').split(' ');
  const fromName = fromTokens[0];
  let fromAlias = fromName.split('.').pop() || fromName;
  if (fromTokens.length >= 2) {
    if (fromTokens[1].toLowerCase() === 'as' && fromTokens[2]) fromAlias = fromTokens[2];
    else if (!/^(as|on|where|group|order|limit)$/i.test(fromTokens[1])) fromAlias = fromTokens[1];
  }

  // JOINs
  const joinSpecs: { table: string; alias: string; kind: 'left' | 'inner'; on: string }[] = [];
  for (const kwk of kws.filter(k => k.name === 'join')) {
    const beforeJoin = s.slice(0, kwk.pos);
    const leftWord = beforeJoin.trim().split(/\s+/).pop() || '';
    const isLeft = leftWord.toLowerCase() === 'left';
    const onKw = kws.find(k => k.name === 'on' && k.pos > kwk.end);
    if (!onKw) continue;
    const endAfterOn = kws.find(k => k.pos > onKw.end && (k.name === 'where' || k.name === 'group' || k.name === 'order' || k.name === 'limit'));
    const tableSpec = s.slice(kwk.end, onKw.pos).trim();
    const onText = s.slice(onKw.end, endAfterOn ? endAfterOn.pos : s.length).trim();
    const tt = tableSpec.replace(/\s+/g, ' ').split(' ');
    const table = tt[0];
    let alias = table.split('.').pop() || table;
    if (tt.length >= 2) {
      if (tt[1].toLowerCase() === 'as' && tt[2]) alias = tt[2];
      else alias = tt[1];
    }
    joinSpecs.push({ table, alias, kind: isLeft ? 'left' : 'inner', on: onText });
  }

  // Cargar tabla base con columnas con prefijo de alias
  const base = tables[fromName];
  if (!base) return { schema: [], rows: [] };
  let leftRows: Record<string, any>[] = base.rows.map((r: any) => {
    const out: Record<string, any> = {};
    Object.entries(r).forEach(([col, v]) => { out[`${fromAlias}.${col}`] = v; });
    return out;
  });

  // Aplicar joins
  for (const join of joinSpecs) {
    const right = tables[join.table];
    if (!right || !leftRows.length) continue;
    const rightRows = right.rows.map((r: any) => {
      const out: Record<string, any> = {};
      Object.entries(r).forEach(([col, v]) => { out[`${join.alias}.${col}`] = v; });
      return out;
    });
    if (!rightRows.length) { if (join.kind !== 'left') leftRows = []; continue; }
    const onMatch = join.on.match(/([\w.]+)\s*=\s*([\w.]+)/);
    let next: Record<string, any>[] = [];
    if (onMatch) {
      const lk = onMatch[1].trim();
      const rk = onMatch[2].trim();
      if (lk in leftRows[0] && rk in rightRows[0]) {
        for (const lr of leftRows) {
          const matches = rightRows.filter(rr => String(resolveColumn(lr, lk)) === String(resolveColumn(rr, rk)));
          if (matches.length) matches.forEach(m => next.push({ ...lr, ...m }));
          else if (join.kind === 'left') next.push({ ...lr });
        }
      } else if (rk in leftRows[0] && lk in rightRows[0]) {
        for (const lr of leftRows) {
          const matches = rightRows.filter(rr => String(resolveColumn(rr, lk)) === String(resolveColumn(lr, rk)));
          if (matches.length) matches.forEach(m => next.push({ ...lr, ...m }));
          else if (join.kind === 'left') next.push({ ...lr });
        }
      } else {
        next = leftRows;
      }
    } else {
      if (join.kind === 'left') next = leftRows;
      else next = [];
    }
    leftRows = next;
  }

  // WHERE
  const whereKw = kws.find(k => k.name === 'where');
  if (whereKw) {
    const endAfterWhere = kws.find(k => k.pos > whereKw.end && (k.name === 'group' || k.name === 'order' || k.name === 'limit'));
    const whereText = s.slice(whereKw.end, endAfterWhere ? endAfterWhere.pos : s.length);
    const conditions = whereText.split(/\s+and\s+/i);
    leftRows = leftRows.filter(row => conditions.every(cond => evalCondition(row, cond)));
  }

  // Agregación
  const items = selectText.split(',').map(parseSelectItem);
  const hasAgg = items.some(it => it.isAgg);
  const groupKw = kws.find(k => k.name === 'group');
  let groupCols: string[] = [];
  if (groupKw) {
    const endAfterGroup = kws.find(k => k.pos > groupKw.end && (k.name === 'order' || k.name === 'limit'));
    groupCols = s.slice(groupKw.end, endAfterGroup ? endAfterGroup.pos : s.length)
      .replace(/^\s*by\s+/i, '').split(',').map((c: string) => c.trim()).filter(Boolean);
  }

  let out: Record<string, any>[] = [];

  if (groupCols.length > 0 || hasAgg) {
    const groups = new Map<string, Record<string, any>[]>();
    for (const row of leftRows) {
      const key = groupCols.map(c => String(resolveColumn(row, c))).join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    out = Array.from(groups.values()).map(groupRows => {
      const outRow: Record<string, any> = {};
      for (const it of items) {
        if (it.isStar || it.isAgg) continue;
        outRow[it.name] = resolveColumn(groupRows[0], it.expr);
      }
      const vals = (it2: SelectItem) => groupRows.map(r => Number(resolveColumn(r, it2.aggCol))).filter(v => !isNaN(v));
      for (const it of items) {
        if (!it.isAgg) continue;
        if (it.aggFn === 'count') outRow[it.name] = it.aggCol === '*' ? groupRows.length : vals(it).length;
        else if (it.aggFn === 'sum') outRow[it.name] = vals(it).reduce((a, b) => a + b, 0);
        else if (it.aggFn === 'avg') outRow[it.name] = vals(it).length ? vals(it).reduce((a, b) => a + b, 0) / vals(it).length : 0;
        else if (it.aggFn === 'min') outRow[it.name] = vals(it).length ? Math.min(...vals(it)) : 0;
        else if (it.aggFn === 'max') outRow[it.name] = vals(it).length ? Math.max(...vals(it)) : 0;
      }
      return outRow;
    });
  } else {
    out = leftRows.map(row => {
      const outRow: Record<string, any> = {};
      for (const it of items) {
        if (it.isStar) continue;
        if (it.expr.includes('*') && it.expr !== '*' && /[*+/-]/.test(it.expr)) {
          const parts = it.expr.split('*').map(p => Number(resolveColumn(row, p.trim())));
          outRow[it.name] = parts.reduce((a, b) => a * b, 1);
        } else {
          outRow[it.name] = resolveColumn(row, it.expr);
        }
      }
      return outRow;
    });
  }

  // ORDER BY
  const orderKw = kws.find(k => k.name === 'order');
  if (orderKw) {
    const endAfterOrder = kws.find(k => k.pos > orderKw.end && k.name === 'limit');
    const orderText = s.slice(orderKw.end, endAfterOrder ? endAfterOrder.pos : s.length).replace(/^\s*by\s+/i, '');
    const m = orderText.match(/^\s*(.+?)\s*(desc|asc)?\s*$/i);
    if (m) {
      const col = m[1].replace(/^\w+\./, '').trim();
      const dir = (m[2] || 'ASC').toUpperCase();
      out.sort((a, b) => {
        const av = Number(resolveColumn(a, col)) || 0;
        const bv = Number(resolveColumn(b, col)) || 0;
        return dir === 'DESC' ? bv - av : av - bv;
      });
    }
  }

  // Schema en orden del SELECT
  const schema: string[] = [];
  for (const it of items) {
    if (it.isStar) continue;
    schema.push(it.name);
  }
  const cleanSchema = schema.length ? schema : Object.keys(out[0] || {});
  return { schema: cleanSchema, rows: out };
}

// ─── Lineage / orden topológico ─────────────────────────────────

function depsOf(model: DbtModel): string[] {
  return [...model.sql.matchAll(/\{\{\s*ref\('([^']+)'\)\s*\}\}/g)].map(m => m[1]);
}

export function topoOrder(): DbtModel[] {
  const pending = [...MODELS];
  const ordered: DbtModel[] = [];
  const done = new Set<string>(Object.keys(SOURCES));
  let guard = 0;
  while (pending.length && guard < 50) {
    guard++;
    const next = pending.filter(m => depsOf(m).every(d => done.has(d)));
    if (!next.length) break;
    for (const m of next) { done.add(m.name); ordered.push(m); }
    pending.splice(0, pending.length, ...pending.filter(m => !next.includes(m)));
  }
  return [...ordered, ...pending];
}

// ─── Componente ────────────────────────────────────────────────

export default function DBTSim({ theme, onBack }: DBTSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedId, setSelectedId] = useState<string>(MODELS[0].id);
  const [code, setCode] = useState<string>(MODELS[0].sql);
  const [tab, setTab] = useState<'editor' | 'results' | 'docs'>('editor');
  const [building, setBuilding] = useState(false);
  const [results, setResults] = useState<BuildResult[]>([]);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [preview, setPreview] = useState<BuildResult | null>(null);

  const selected = MODELS.find(m => m.id === selectedId) || MODELS[0];

  function selectModel(id: string) {
    const m = MODELS.find(mm => mm.id === id);
    if (!m) return;
    setSelectedId(id);
    setCode(m.sql);
    setTab('editor');
  }

  function runBuild() {
    if (building) return;
    setBuilding(true);
    setTestResults(null);
    setPreview(null);
    setTimeout(() => {
      const tables: Record<string, AnyTable> = { ...SOURCES };
      const out: BuildResult[] = [];
      const ordered = topoOrder();
      for (const m of ordered) {
        const start = performance.now();
        const table = compileModelSql(m.sql, tables);
        tables[m.name] = table;
        out.push({ model: m, table, elapsedMs: Math.round(performance.now() - start) });
      }
      setResults(out);
      setTestResults(runAllTests(tables));
      setPreview(out[out.length - 1]);
      setTab('results');
      setBuilding(false);
    }, 900);
  }

  function runAllTests(tables: Record<string, AnyTable>): TestResult[] {
    return TESTS.map(test => {
      const table = tables[test.model];
      if (!table) return { test, pass: false, detail: `El modelo ${test.model} no existe` };
      const vals = table.rows.map(r => resolveColumn(r, test.column));
      if (test.type === 'not_null') {
        const nulls = vals.filter(v => v == null || v === '').length;
        return { test, pass: nulls === 0, detail: nulls === 0 ? `${vals.length} filas válidas` : `${nulls} valores nulos detectados` };
      }
      if (test.type === 'unique') {
        const dups = vals.length - new Set(vals.map(String)).size;
        return { test, pass: dups === 0, detail: dups === 0 ? `${vals.length} valores únicos` : `${dups} duplicados detectados` };
      }
      const n = vals.filter(v => v == null || Number(v) <= 0).length;
      return { test, pass: n === 0, detail: n === 0 ? `${vals.length} valores positivos` : `${n} valores <= 0` };
    });
  }

  function runTestsOnly() {
    if (building) return;
    if (!results.length) {
      setPreview(null);
      setTestResults(null);
      setTab('results');
      return;
    }
    const tables: Record<string, AnyTable> = { ...SOURCES };
    for (const r of results) tables[r.model.name] = r.table;
    setTestResults(runAllTests(tables));
    setTab('results');
  }

  function lineage(): { up: Record<string, string[]>; down: Record<string, string[]> } {
    const up: Record<string, string[]> = {};
    const down: Record<string, string[]> = {};
    for (const m of MODELS) {
      up[m.name] = depsOf(m);
      for (const d of up[m.name]) { (down[d] = down[d] || []).push(m.name); }
    }
    return { up, down };
  }

  const lin = lineage();
  const passedTests = testResults?.filter(t => t.pass).length ?? 0;

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🧱</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>dbt · Data Build Tool</span>
        <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: '#facc1530', color: '#f59e0b' }}>Delta Lake</span>
        <div className="flex-1" />
        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>DataFlow Analytics · warehouse</span>
        <button onClick={runTestsOnly} disabled={building}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition hover:opacity-90 disabled:opacity-40"
          style={{ border: `1px solid ${colors.border}`, color: colors.textMuted, background: colors.bg }}>
          ✓ Tests
        </button>
        <button onClick={runBuild} disabled={building}
          className="text-[11px] font-bold px-4 py-1.5 rounded-lg cursor-pointer transition hover:opacity-90 disabled:opacity-40"
          style={{ background: '#f59e0b', color: '#1B2632' }}>
          {building ? '⏳ Compilando...' : '⚡ dbt build'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: explorador del proyecto */}
        <div className="w-56 shrink-0 border-r-2 overflow-auto flex flex-col" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>📁 dbt_project.yml</span>
            <div className="text-[8px] mt-0.5" style={{ color: colors.textMuted }}>name: dataflow-analytics</div>
          </div>

          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: '#a855f7' }}>🗄️ Sources</div>
            {Object.entries(SOURCES).map(([name, ds]) => (
              <div key={name} className="text-[9px] font-mono py-1 px-2 rounded mb-0.5 flex justify-between" style={{ color: '#a855f7' }}>
                <span>📋 {name}</span>
                <span style={{ opacity: 0.5 }}>{ds.rows.length} rows</span>
              </div>
            ))}
          </div>

          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: '#3b82f6' }}>🏗️ Models</div>
            {MODELS.map(m => (
              <div key={m.id} onClick={() => selectModel(m.id)}
                className="text-[9px] font-mono py-1 px-2 cursor-pointer rounded mb-0.5 flex justify-between items-center"
                style={{ color: selectedId === m.id ? '#fff' : '#3b82f6', background: selectedId === m.id ? '#3b82f6' : 'transparent' }}>
                <span>📐 {m.name}</span>
                <span className="text-[7px] opacity-70">.sql</span>
              </div>
            ))}
          </div>

          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: '#22c55e' }}>🔬 Tests</div>
            {TESTS.map(t => {
              const tr = testResults?.find(tt => tt.test.id === t.id);
              return (
                <div key={t.id} className="text-[8px] font-mono py-0.5 flex justify-between" style={{ color: tr ? (tr.pass ? '#22c55e' : '#ef4444') : colors.textMuted }}>
                  <span>{t.label}</span>
                  <span>{tr ? (tr.pass ? '✅' : '❌') : ''}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-b flex-1" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: colors.textMuted }}>⚙️ dbt_project.yml</div>
            <div className="text-[8px] font-mono space-y-0.5" style={{ color: colors.textMuted }}>
              <div>profile: dataflow</div>
              <div>target: dev</div>
              <div>model-paths: ["models"]</div>
              <div>test-paths: ["tests"]</div>
            </div>
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b-2 shrink-0" style={{ borderColor: colors.border }}>
            {(['editor', 'results', 'docs'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-[11px] font-bold cursor-pointer transition"
                style={{ color: tab === t ? colors.primary : colors.textMuted, borderBottom: tab === t ? `2px solid ${colors.primary}` : '2px solid transparent' }}>
                {t === 'editor' ? '📝 Model Editor' : t === 'results' ? '📊 Run Results' : '📚 Docs'}
              </button>
            ))}
          </div>

          {tab === 'editor' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-3 py-1 text-[9px] font-mono flex gap-4 shrink-0" style={{ background: colors.cardBg, color: colors.textMuted }}>
                <span>{selected.path}{selected.name}.sql</span>
                <span>Refs: {depsOf(selected).join(', ') || '—'}</span>
                <span>→ {depsOf(selected).length ? 'hereda de' : 'lectura de source'}</span>
              </div>
              <textarea value={code} onChange={e => setCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-[11px] outline-none resize-none leading-relaxed flex-1 min-h-0"
                style={{ background: isDark ? '#0f172a' : '#1e293b', color: '#e2e8f0', border: 'none' }}
                placeholder="-- SELECT * FROM {{ ref('modelo_dependiente') }}"
                spellCheck={false} />
            </div>
          )}

          {tab === 'results' && (
            <div className="flex-1 overflow-auto p-4">
              {!results.length && !building && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center" style={{ color: colors.textMuted }}>
                    <div className="text-3xl mb-2">🧱</div>
                    <div className="text-xs">Presiona "dbt build" para compilar el proyecto</div>
                    <div className="text-[10px] mt-1">Se ejecutan los 4 modelos en orden de dependencia + tests</div>
                  </div>
                </div>
              )}
              {building && (
                <div className="space-y-2">
                  {MODELS.map(m => (
                    <div key={m.id} className="animate-pulse flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: colors.border, background: colors.cardBg }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: colors.border }} />
                      <div className="h-2 w-40 rounded" style={{ background: colors.border }} />
                    </div>
                  ))}
                </div>
              )}
              {results.length > 0 && (
                <>
                  <div className="text-[11px] font-bold mb-3" style={{ color: colors.text }}>
                    ✅ dbt build completado
                    <span className="text-[10px] font-mono ml-2" style={{ color: colors.textMuted }}>
                      {results.length} modelos · {results.reduce((a, r) => a + r.table.rows.length, 0)} filas totales · {passedTests}/{testResults?.length ?? 0} tests
                    </span>
                  </div>

                  {/* Modelos compilados */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {results.map(r => (
                      <div key={r.model.id}
                        onClick={() => setPreview(r)}
                        className="p-3 rounded-xl border-2 cursor-pointer transition hover:opacity-85"
                        style={{ borderColor: preview?.model.id === r.model.id ? '#f59e0b' : colors.border, background: colors.cardBg }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold font-mono" style={{ color: '#22c55e' }}>✓ {r.model.name}</span>
                          <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{r.elapsedMs}ms</span>
                        </div>
                        <div className="text-[9px] font-mono mt-0.5" style={{ color: colors.textMuted }}>{r.table.rows.length} filas · {r.table.schema.length} columnas</div>
                      </div>
                    ))}
                  </div>

                  {/* Tests */}
                  {testResults && (
                    <div className="mb-4">
                      <div className="text-[10px] font-bold mb-2" style={{ color: colors.text }}>
                        {passedTests === testResults.length ? '🔬 Todos los tests pasaron' : '🔬 Tests con fallas'} ({passedTests}/{testResults.length})
                      </div>
                      <div className="space-y-1">
                        {testResults.map(tr => (
                          <div key={tr.test.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[9px]"
                            style={{ background: tr.pass ? '#22c55e10' : '#ef444410', color: tr.pass ? '#22c55e' : '#ef4444' }}>
                            <span>{tr.pass ? '✅' : '❌'}</span>
                            <span className="font-bold">{tr.test.model} · {tr.test.label}</span>
                            <span className="opacity-70">— {tr.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview del modelo seleccionado */}
                  {preview && (
                    <div>
                      <div className="text-[11px] font-bold mb-2" style={{ color: colors.text }}>
                        📊 Preview: {preview.model.name}
                        <span className="text-[10px] font-mono ml-2" style={{ color: colors.textMuted }}>
                          {preview.table.rows.length} filas · {preview.table.schema.length} columnas
                        </span>
                      </div>
                      <table className="w-full text-[10px] font-mono border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
                        <thead>
                          <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                            {preview.table.schema.map(col => (
                              <th key={col} className="px-3 py-2 text-left" style={{ color: colors.textMuted }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.table.rows.map((row, i) => (
                            <tr key={i} className="border-b" style={{ borderColor: colors.border + '30', background: i % 2 === 0 ? 'transparent' : (isDark ? '#ffffff05' : '#00000003') }}>
                              {preview.table.schema.map(col => (
                                <td key={col} className="px-3 py-1.5" style={{ color: colors.text }}>
                                  {typeof row[col] === 'number' && !isNaN(row[col]) ? row[col].toLocaleString('es-MX') : String(row[col] ?? 'NULL')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'docs' && (
            <div className="flex-1 overflow-auto p-4">
              <div className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>📚 dbt docs (generado)</div>
              <div className="text-[10px] font-mono mb-4" style={{ color: colors.textMuted }}>
                DataFlow Analytics · 4 models · 2 sources · 5 tests · doc auto
              </div>

              {/* Lineage */}
              <div className="rounded-xl border-2 p-3 mb-4 overflow-x-auto" style={{ borderColor: colors.border, background: colors.cardBg }}>
                <div className="text-[10px] font-bold mb-3" style={{ color: colors.text }}>🧬 Lineage Graph</div>
                <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                  {Object.keys(SOURCES).map(src => (
                    <span key={src} className="px-2 py-1 rounded-lg border-2" style={{ borderColor: '#a855f7', color: '#a855f7' }}>🗄️ {src}</span>
                  ))}
                  <span style={{ color: colors.textMuted }}>→</span>
                  {MODELS.map(m => (
                    <span key={m.id} className="px-2 py-1 rounded-lg border-2" style={{ borderColor: m.path.includes('marts') ? '#22c55e' : '#3b82f6', color: m.path.includes('marts') ? '#22c55e' : '#3b82f6' }}>
                      📐 {m.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cards de documentación */}
              {MODELS.map(m => (
                <div key={m.id} className="rounded-xl border-2 p-3 mb-3" style={{ borderColor: colors.border, background: colors.cardBg }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>📐 {m.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#f59e0b20', color: '#f59e0b' }}>table</span>
                    <span className="text-[8px] font-mono ml-auto" style={{ color: colors.textMuted }}>{m.path}</span>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: colors.textMuted }}>{m.description}</p>
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {depsOf(m).map(dep => (
                      <span key={dep} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#3b82f610', color: '#3b82f6' }}>↑ ref: {dep}</span>
                    ))}
                    {(lin.down[m.name] || []).map((dep: string) => (
                      <span key={dep} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#22c55e10', color: '#22c55e' }}>↓ usado por: {dep}</span>
                    ))}
                  </div>
                  <table className="w-full text-[9px] font-mono">
                    <thead>
                      <tr style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>
                        <th className="py-1 text-left">COLUMN</th>
                        <th className="py-1 text-left">TYPE</th>
                        <th className="py-1 text-left">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(MODEL_COLUMN_DOCS[m.name] || {}).map(([col, meta]) => (
                        <tr key={col} className="border-b" style={{ borderColor: colors.border + '30' }}>
                          <td className="py-1 pr-3" style={{ color: '#f59e0b' }}>{col}</td>
                          <td className="py-1 pr-3" style={{ color: colors.textMuted }}>{meta.type}</td>
                          <td className="py-1" style={{ color: colors.text }}>{meta.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>dbt v1.8 · profile: dataflow_profile · target: dev</span>
        <span style={{ color: building ? '#f59e0b' : (testResults && passedTests < (testResults?.length ?? 0) ? '#ef4444' : '#22c55e') }}>
          {building ? '⏳ compiling...' : results.length ? `last build: ${results.reduce((a, r) => a + r.table.rows.length, 0)} rows · ${passedTests}/${testResults?.length ?? 0} tests ok` : 'listo'}
        </span>
      </div>
    </div>
  );
}