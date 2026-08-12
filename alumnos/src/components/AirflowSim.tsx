import { useEffect, useRef, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';
import { simSlash } from '../lib/simTime';

interface AirflowSimProps { theme: Theme; onBack: () => void; }

type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

interface DagTask {
  id: string;
  label: string;
  operator: string;
  duration: string;
  upstream: string[];
  rows: number;
}

interface DagRun {
  date: string;
  time: string;
  statuses: Record<string, TaskStatus>;
}

// ─── Tareas del DAG (usa el pipeline dbt real) ─────────────────

const ROW_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
  for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente']) {
    const model = MODELS.find(m => m.name === name);
    if (!model) continue;
    const compiled = compileModelSql(model.sql, { ...SOURCES, ...tables });
    tables[name] = compiled;
    counts[name] = compiled.rows.length;
  }
  return counts;
})();

export const DAG_TASKS: DagTask[] = [
  { id: 'ingest_ventas', label: 'ingest_ventas', operator: 'PythonOperator', duration: '38s', upstream: [], rows: 8 },
  { id: 'ingest_clientes', label: 'ingest_clientes', operator: 'PythonOperator', duration: '24s', upstream: [], rows: 5 },
  { id: 'dbt_stg', label: 'dbt_run_stg', operator: 'BashOperator (dbt run --select stg_*)', duration: '52s', upstream: ['ingest_ventas', 'ingest_clientes'], rows: ROW_COUNTS.stg_ventas + ROW_COUNTS.stg_clientes },
  { id: 'dbt_int', label: 'dbt_run_int', operator: 'BashOperator (dbt run --select int_ventas_cliente)', duration: '41s', upstream: ['dbt_stg'], rows: ROW_COUNTS.int_ventas_cliente },
  { id: 'dbt_mart', label: 'dbt_run_mart', operator: 'BashOperator (dbt run --select mrt_ventas_por_cliente)', duration: '33s', upstream: ['dbt_int'], rows: ROW_COUNTS.mrt_ventas_por_cliente },
  { id: 'dbt_test', label: 'dbt_test', operator: 'BashOperator (dbt test)', duration: '28s', upstream: ['dbt_mart'], rows: 5 },
  { id: 'export_redshift', label: 'export_redshift', operator: 'S3ToRedshiftOperator', duration: '1m 12s', upstream: ['dbt_test'], rows: ROW_COUNTS.mrt_ventas_por_cliente },
];

export const TOPO_ORDER = DAG_TASKS.map(t => t.id);

export const DAG_CODE = `from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

default_args = {
    'owner': 'dataflow',
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'email_on_failure': True,
    'email': ['sandra.mora@dataflow.mx'],
}

with DAG(
    dag_id='lno_sales_pipeline',
    default_args=default_args,
    description='ELT ventas -> marts ejecutivos (dbt)',
    schedule='0 8 * * *',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['ventas', 'dbt'],
) as dag:

    ingest_ventas = PythonOperator(
        task_id='ingest_ventas',
        python_callable=ingest_api,
        op_kwargs={'table': 'raw_ventas'},
    )

    ingest_clientes = PythonOperator(
        task_id='ingest_clientes',
        python_callable=ingest_api,
        op_kwargs={'table': 'raw_clientes'},
    )

    dbt_stg = BashOperator(
        task_id='dbt_run_stg',
        bash_command='dbt run --select stg_ventas stg_clientes',
    )

    dbt_int = BashOperator(
        task_id='dbt_run_int',
        bash_command='dbt run --select int_ventas_cliente',
    )

    dbt_mart = BashOperator(
        task_id='dbt_run_mart',
        bash_command='dbt run --select mrt_ventas_por_cliente',
    )

    dbt_test = BashOperator(
        task_id='dbt_test',
        bash_command='dbt test',
    )

    export_redshift = S3ToRedshiftOperator(
        task_id='export_redshift',
        table='marts.mrt_ventas_por_cliente',
    )

    [ingest_ventas, ingest_clientes] >> dbt_stg >> dbt_int >> dbt_mart >> dbt_test >> export_redshift`;

// ─── Utilidades ────────────────────────────────────────────────

const fmtTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// Duraciones simuladas de los runs semilla (variadas; el run fallido es el lento por retries)
const DUR_SEEDS = ['4m 12s', '4m 38s', '5m 02s', '6m 10s', '4m 55s', '4m 48s'];

function seedRuns(): DagRun[] {
  const runs: DagRun[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const statuses: Record<string, TaskStatus> = {};
    DAG_TASKS.forEach(t => { statuses[t.id] = 'success'; });
    if (offset === 3) {
      statuses.dbt_test = 'failed';
      statuses.export_redshift = 'pending';
    }
    runs.push({ date: simSlash(offset), time: '08:00', statuses });
  }
  return runs;
}

function nodeColor(s: TaskStatus, colors: any): string {
  switch (s) {
    case 'success': return colors.success;
    case 'failed': return colors.error;
    case 'running': return colors.warning;
    case 'pending': return colors.textMuted;
    default: return colors.textMuted;
  }
}

function statusLabel(s: TaskStatus): string {
  return s === 'success' ? 'success' : s === 'failed' ? 'failed' : s === 'running' ? 'running' : 'pending';
}

export const GRAPH_POS: Record<string, { x: number; y: number }> = {
  ingest_ventas: { x: 70, y: 60 },
  ingest_clientes: { x: 70, y: 190 },
  dbt_stg: { x: 260, y: 125 },
  dbt_int: { x: 450, y: 100 },
  dbt_mart: { x: 640, y: 100 },
  dbt_test: { x: 830, y: 100 },
  export_redshift: { x: 1020, y: 100 },
};

// ─── Componente ────────────────────────────────────────────────

export default function AirflowSim({ theme, onBack }: AirflowSimProps) {
  const colors = themeColors[theme];
  const [tab, setTab] = useState<'runs' | 'graph' | 'code'>('runs');
  const [runs, setRuns] = useState<DagRun[]>(seedRuns);
  const [isRunning, setIsRunning] = useState(false);
  const [selected, setSelected] = useState<DagTask>(DAG_TASKS[2]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const runStatuses = runs.length ? runs[runs.length - 1].statuses : {};
  const completedCount = DAG_TASKS.filter(t => runStatuses[t.id] === 'success').length;
  const failedCount = DAG_TASKS.filter(t => runStatuses[t.id] === 'failed').length;

  const triggerRun = (): void => {
    if (isRunning) return;
    setIsRunning(true);
    const run: DagRun = { date: simSlash(0), time: fmtTime(), statuses: {} };
    DAG_TASKS.forEach(t => { run.statuses[t.id] = 'pending'; });
    setRuns(prev => [...prev, run]);
    let tick = 0;
    const id = setInterval(() => {
      const taskIdx = Math.floor(tick / 2);
      if (taskIdx >= DAG_TASKS.length) {
        clearInterval(id);
        timerRef.current = null;
        setIsRunning(false);
        return;
      }
      const taskId = DAG_TASKS[taskIdx].id;
      const mark = tick % 2 === 0 ? 'running' : 'success';
      setRuns(prev => {
        const last = prev[prev.length - 1];
        if (last.time !== run.time || last.date !== run.date) return prev;
        const st = { ...last.statuses };
        st[taskId] = mark;
        return [...prev.slice(0, -1), { ...last, statuses: st }];
      });
      tick += 1;
    }, 550);
    timerRef.current = id;
  };

  // ── Estado tab ──
  const opts: Array<{ id: typeof tab; label: string; icon: string }> = [
    { id: 'runs', label: 'Ejecuciones', icon: '📋' },
    { id: 'graph', label: 'Grafo', icon: '🗺️' },
    { id: 'code', label: 'Código', icon: '🧑‍💻' },
  ];

  const runsView = runs[runs.length - 1];
  const allSuccess = !isRunning && DAG_TASKS.every(t => runsView?.statuses[t.id] === 'success');

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {/* Barra */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <button onClick={onBack} className="text-[10px] px-2 py-1 rounded font-bold cursor-pointer hover:opacity-80" style={{ background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>← Escritorio</button>
        <span className="text-sm">🛫</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>Airflow · lno_sales_pipeline</span>
        {isRunning && <span className="text-[9px] px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: `${colors.warning}18`, color: colors.warning }}>● ejecutando run…</span>}
        {allSuccess && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.success}18`, color: colors.success }}>● run completado</span>}
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>schedule · 0 8 * * *</span>
        <div className="flex-1" />
        <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{completedCount}/{DAG_TASKS.length} tareas ok{failedCount > 0 ? ` · ${failedCount} falla` : ''}</div>
        <button onClick={triggerRun} disabled={isRunning} className="text-[10px] px-3 py-1 rounded font-bold" style={{ background: colors.primary, color: '#fff', opacity: isRunning ? 0.5 : 1 }}>
          {isRunning ? '⏳ Trigger…' : '▶ Trigger run'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 shrink-0">
        {opts.map(o => (
          <button key={o.id} onClick={() => { setTab(o.id); }} className="text-[10px] px-3 py-1 rounded" style={tab === o.id ? { background: colors.primary, color: '#fff' } : { background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
            {o.icon} {o.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {tab === 'runs' && <RunsTable runs={runs} colors={colors} onSelect={() => {}} />}
        {tab === 'graph' && <GraphView runs={runs} colors={colors} onSelect={setSelected} />}
        {tab === 'code' && (
          <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
              dags/lno_sales_pipeline.py · sintaxis: bitshift ({'>'}{'>'})
            </div>
            <pre className="p-3 overflow-x-auto text-[10px] font-mono leading-relaxed whitespace-pre" style={{ color: colors.text }}>
              {DAG_CODE}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vistas ────────────────────────────────────────────────────

function RunsTable({ runs, colors, onSelect }: { runs: DagRun[]; colors: any; onSelect: (r: DagRun) => void }) {
  return (
    <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Run ID</th>
            <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Fecha</th>
            <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Hora</th>
            <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Estado</th>
            <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Duración</th>
            <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Tareas</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r, i) => {
            const st = r.statuses;
            const ok = DAG_TASKS.filter(t => st[t.id] === 'success').length;
            const bad = DAG_TASKS.filter(t => st[t.id] === 'failed').length;
            const runningNow = DAG_TASKS.some(t => st[t.id] === 'running');
            const state = bad > 0 ? 'failed' : runningNow ? 'running' : ok === DAG_TASKS.length ? 'success' : 'pending';
            return (
              <tr key={`${r.date}-${r.time}-${i}`} onClick={() => onSelect(r)} className="cursor-pointer hover:opacity-90" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.text }}>scheduled__{i + 1}</td>
                <td className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted }}>{r.date}</td>
                <td className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted }}>{r.time}</td>
                <td className="px-3 py-1.5"><span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${nodeColor(state, colors)}18`, color: nodeColor(state, colors) }}>{statusLabel(state)}</span></td>
                <td className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted }}>{DUR_SEEDS[i % DUR_SEEDS.length]}</td>
                <td className="px-3 py-1.5">
                  <div className="flex gap-0.5">
                    {DAG_TASKS.map(t => (
                      <span key={t.id} className="w-1.5 h-3 rounded-sm" style={{ background: nodeColor(st[t.id] || 'pending', colors) }} title={`${t.label}: ${st[t.id] || 'pending'}`} />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GraphView({ runs, colors, onSelect }: { runs: DagRun[]; colors: any; onSelect: (t: DagTask) => void }) {
  const latest = runs[runs.length - 1]?.statuses || {};
  const edges: Array<{ from: DagTask; to: DagTask }> = [];
  DAG_TASKS.forEach(t => {
    t.upstream.forEach(u => {
      const fu = DAG_TASKS.find(x => x.id === u);
      if (fu) edges.push({ from: fu, to: t });
    });
  });
  return (
    <div className="rounded-md p-2" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }} >
      <div className="relative w-full" style={{ height: 230 }}>
        <svg viewBox="0 0 1100 230" className="w-full h-full">
          {edges.map((e, i) => {
            const a = GRAPH_POS[e.from.id];
            const b = GRAPH_POS[e.to.id];
            return <line key={i} x1={a.x + 70} y1={a.y + 20} x2={b.x} y2={b.y + 20} stroke={colors.border} strokeWidth={1.5} />;
          })}
          {DAG_TASKS.map(t => {
            const p = GRAPH_POS[t.id];
            const st = latest[t.id] || 'pending';
            const c = nodeColor(st, colors);
            return (
              <foreignObject key={t.id} x={p.x} y={p.y} width={140} height={52} onClick={() => onSelect(t)}>
                <div className="rounded-md border px-2 py-1 cursor-pointer" style={{ borderColor: c, background: colors.bg, width: 140, height: 52 }}>
                  <div className="text-[9px] font-mono font-bold truncate" style={{ color: colors.text }}>{t.label}</div>
                  <div className="text-[8px] font-mono truncate" style={{ color: colors.textMuted }}>{t.operator}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    <span className="text-[8px] font-mono" style={{ color: c }}>{statusLabel(st)}</span>
                    <span className="text-[8px] font-mono ml-auto" style={{ color: colors.textMuted }}>{t.duration}</span>
                  </div>
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>
      <div className="flex gap-3 mt-2 px-1 flex-wrap">
        {DAG_TASKS.map(t => {
          const st = latest[t.id] || 'pending';
          return (
            <button key={t.id} onClick={() => onSelect(t)} className="text-[9px] font-mono px-2 py-1 rounded hover:opacity-80" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
              {t.label} · <span style={{ color: nodeColor(st, colors) }}>{statusLabel(st)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}