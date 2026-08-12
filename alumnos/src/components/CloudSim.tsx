import { useMemo, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';

interface CloudSimProps { theme: Theme; onBack: () => void; }

type Section = 'dashboard' | 's3' | 'redshift' | 'iam' | 'billing';

// ─── Datos reales del pipeline dbt ─────────────────────────────

function warehouseRows(): Record<string, number> {
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
}

const fmtMXN = (v: number) => v.toLocaleString('es-MX');
const fmtBytes = (rows: number, cols: number) => {
  const kb = (rows * cols * 40) / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};

// ─── Buckets S3 ────────────────────────────────────────────────

interface S3Object { key: string; size: string; modified: string; storage: string; }

const BUCKETS: Record<string, S3Object[]> = {
  'lno-raw-ventas': [
    { key: 'api/ventas_2026-07-01.json', size: '12.4 KB', modified: '2026-07-01 08:05', storage: 'S3 Standard' },
    { key: 'api/ventas_2026-07-02.json', size: '11.8 KB', modified: '2026-07-02 08:04', storage: 'S3 Standard' },
    { key: 'api/ventas_2026-07-03.json', size: '13.1 KB', modified: '2026-07-03 08:06', storage: 'S3 Standard' },
    { key: 'api/ventas_2026-07-04.json', size: '10.9 KB', modified: '2026-07-04 08:03', storage: 'S3 Standard' },
    { key: 'api/ventas_2026-07-05.json', size: '12.2 KB', modified: '2026-07-05 08:05', storage: 'S3 Standard' },
    { key: 'api/ventas_2026-07-06.json', size: '11.6 KB', modified: '2026-07-06 08:04', storage: 'S3 Standard' },
    { key: 'api/ventas_2026-07-07.json', size: '12.9 KB', modified: '2026-07-07 08:05', storage: 'S3 Standard' },
    { key: 'api/ventas_2026-07-08.json', size: '12.4 KB', modified: '2026-07-08 08:05', storage: 'S3 Standard' },
    { key: 'bootstrap/manifiesto.json', size: '1.1 KB', modified: '2026-06-30 17:20', storage: 'S3 Standard' },
  ],
  'lno-staging-dbt': [
    { key: 'stg/stg_ventas.parquet', size: fmtBytes(8, 7), modified: '2026-07-08 08:40', storage: 'S3 Intelligent-Tiering' },
    { key: 'stg/stg_clientes.parquet', size: fmtBytes(5, 5), modified: '2026-07-08 08:41', storage: 'S3 Intelligent-Tiering' },
    { key: 'int/int_ventas_cliente.parquet', size: fmtBytes(8, 9), modified: '2026-07-08 08:45', storage: 'S3 Intelligent-Tiering' },
    { key: 'marts/mrt_ventas_por_cliente.parquet', size: fmtBytes(5, 5), modified: '2026-07-08 08:50', storage: 'S3 Standard' },
    { key: 'catalog/schema.yml', size: '3.2 KB', modified: '2026-07-08 08:51', storage: 'S3 Standard' },
  ],
  'lno-logs-airflow': [
    { key: 'dag_runs/2026/07/08/lno_sales_pipeline_ok.log', size: '86.1 KB', modified: '2026-07-08 09:00', storage: 'S3 Glacier IR' },
    { key: 'dag_runs/2026/07/07/lno_sales_pipeline_ok.log', size: '82.4 KB', modified: '2026-07-07 09:01', storage: 'S3 Glacier IR' },
    { key: 'dag_runs/2026/07/06/lno_sales_pipeline_ok.log', size: '81.9 KB', modified: '2026-07-06 09:02', storage: 'S3 Glacier IR' },
    { key: 'dag_runs/2026/07/05/lno_sales_pipeline_failed.log', size: '44.6 KB', modified: '2026-07-05 09:03', storage: 'S3 Glacier IR' },
    { key: 'dag_runs/2026/07/04/lno_sales_pipeline_ok.log', size: '79.8 KB', modified: '2026-07-04 09:01', storage: 'S3 Glacier IR' },
    { key: 'dag_runs/2026/07/03/lno_sales_pipeline_ok.log', size: '78.3 KB', modified: '2026-07-03 09:02', storage: 'S3 Glacier IR' },
  ],
};

const BUCKET_REGION: Record<string, string> = {
  'lno-raw-ventas': 'us-east-1',
  'lno-staging-dbt': 'us-east-1',
  'lno-logs-airflow': 'us-east-1',
};

// ─── Redshift ─────────────────────────────────────────────────

interface RedshiftTable { name: string; schema: string; rows: number; cols: number; size: string; sortkey: string; }

const REDSHIFT_TABLES = (rows: Record<string, number>): RedshiftTable[] => [
  { name: 'stg_ventas', schema: 'staging', rows: rows.stg_ventas, cols: 7, size: fmtBytes(rows.stg_ventas, 7), sortkey: 'fecha' },
  { name: 'stg_clientes', schema: 'staging', rows: rows.stg_clientes, cols: 5, size: fmtBytes(rows.stg_clientes, 5), sortkey: 'cliente_id' },
  { name: 'int_ventas_cliente', schema: 'intermediate', rows: rows.int_ventas_cliente, cols: 9, size: fmtBytes(rows.int_ventas_cliente, 9), sortkey: 'fecha' },
  { name: 'mrt_ventas_por_cliente', schema: 'marts', rows: rows.mrt_ventas_por_cliente, cols: 5, size: fmtBytes(rows.mrt_ventas_por_cliente, 5), sortkey: 'total_ventas' },
];

// ─── IAM ──────────────────────────────────────────────────────

interface IamUser { name: string; arn: string; group: string; policies: string[]; isActive: boolean; }

const IAM_USERS: IamUser[] = [
  { name: 'sandra.mora', arn: 'arn:aws:iam::482901234567:user/sandra.mora', group: 'data-engineering', policies: ['AmazonS3FullAccess', 'AmazonRedshiftDataFullAccess', 'AWSDataExportsFullAccess'], isActive: true },
  { name: 'de-sim-alumno', arn: 'arn:aws:iam::482901234567:user/de-sim-alumno', group: 'data-engineering', policies: ['AmazonS3ReadOnlyAccess', 'AmazonRedshiftReadOnlyAccess'], isActive: true },
  { name: 'scheduler-airflow', arn: 'arn:aws:iam::482901234567:user/scheduler-airflow', group: 'automation', policies: ['AmazonS3FullAccess'], isActive: true },
  { name: 'ana.lopez', arn: 'arn:aws:iam::482901234567:user/ana.lopez', group: 'analytics', policies: ['AmazonRedshiftReadOnlyAccess'], isActive: false },
];

// ─── Billing / costos ─────────────────────────────────────────

const MONTHS = ['Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
const COSTS: Record<string, number> = { Feb: 184.5, Mar: 212.1, Abr: 246.8, May: 305.4, Jun: 342.6, Jul: 381.9 };

const COST_BREAKDOWN = [
  { service: 'Amazon Redshift', cost: 168.4, pct: 44 },
  { service: 'Amazon S3', cost: 46.2, pct: 12 },
  { service: 'CloudWatch / Airflow', cost: 88.9, pct: 23 },
  { service: 'AWS Glue', cost: 45.3, pct: 12 },
  { service: 'Transfer / otros', cost: 33.1, pct: 9 },
];

const RECENT_EVENTS = [
  { time: '09:00', service: 'Airflow', event: 'lno_sales_pipeline 2026-07-08 completado → export S3/Redshift' },
  { time: '08:51', service: 'S3', event: 'PutObject lno-staging-dbt/catalog/schema.yml' },
  { time: '08:50', service: 'S3', event: 'PutObject lno-staging-dbt/marts/mrt_ventas_por_cliente.parquet' },
  { time: '08:45', service: 'S3', event: 'PutObject lno-staging-dbt/int/int_ventas_cliente.parquet' },
  { time: '08:40', service: 'S3', event: 'PutObject lno-staging-dbt/stg/stg_ventas.parquet' },
  { time: '08:05', service: 'CloudTrail', event: 'api.ventas API call desde DataFlow Analytics (IAM ok)' },
];

// ─── Componente ────────────────────────────────────────────────

const NAV: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 's3', label: 'S3 · Buckets', icon: '🗂️' },
  { id: 'redshift', label: 'Redshift', icon: '🛢️' },
  { id: 'iam', label: 'IAM', icon: '🔐' },
  { id: 'billing', label: 'Billing', icon: '💳' },
];

export default function CloudSim({ theme, onBack }: CloudSimProps) {
  const colors = themeColors[theme];
  const [section, setSection] = useState<Section>('dashboard');
  const [bucket, setBucket] = useState<string>('lno-raw-ventas');
  const rows = useMemo(warehouseRows, []);

  const header = (title: string, sub: string) => (
    <div className="mb-3">
      <div className="text-xs font-bold" style={{ color: colors.text }}>{title}</div>
      <div className="text-[9px]" style={{ color: colors.textMuted }}>{sub}</div>
    </div>
  );

  const cell = (s: string) => <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{s}</span>;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {/* Barra superior */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <span className="text-sm">☁️</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>AWS Console · dataflow-analytics</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>región: us-east-1</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.warning}18`, color: colors.warning }}>cuenta: 4829-0123-4567</span>
        <div className="flex-1" />
        <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>usuario: de-sim-alumno</span>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>← Salir</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r p-2 flex flex-col gap-1 overflow-y-auto" style={{ background: colors.cardSecondary, borderColor: colors.border }}>
          <div className="text-[8px] font-bold px-2 pt-1 pb-1" style={{ color: colors.textMuted }}>SERVICIOS</div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} className="flex items-center gap-1.5 text-left px-2 py-1.5 rounded text-[10px]"
              style={section === n.id ? { background: colors.primary, color: '#fff' } : { color: colors.text }}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="text-[8px] px-2 py-1 rounded" style={{ background: `${colors.warning}18`, color: colors.warning }}>
            Estimado mes actual: <b>{fmtMXN(COSTS.Jul)}</b> USD
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-3">
          {section === 'dashboard' && (
            innerDashboard(colors, header, cell)
          )}

          {section === 's3' && (
            <div>
              {header('Amazon S3 · Buckets', 'Almacenamiento del pipeline ELT (raw → staging → marts)')}
              <div className="flex gap-2 mb-2">
                {Object.keys(BUCKETS).map(b => (
                  <button key={b} onClick={() => setBucket(b)} className="text-[9px] px-2 py-1 rounded"
                    style={bucket === b ? { background: colors.primary, color: '#fff' } : { background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
                    {b}
                  </button>
                ))}
              </div>
              <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="px-3 py-1.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                  <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>s3://{bucket}/</span>
                  <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>· {BUCKET_REGION[bucket]}</span>
                  <div className="flex-1" />
                  <span className="text-[9px]" style={{ color: colors.success }}>{BUCKETS[bucket].length} objetos</span>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Key</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Tamaño</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Última modificación</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Storage class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BUCKETS[bucket].map((o, i) => (
                      <tr key={o.key} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td className="px-3 py-1.5"><span className="text-[9px] font-mono" style={{ color: colors.text }}>{o.key}</span></td>
                        <td className="px-3 py-1.5">{cell(o.size)}</td>
                        <td className="px-3 py-1.5">{cell(o.modified)}</td>
                        <td className="px-3 py-1.5">{cell(o.storage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'redshift' && (
            <div>
              {header('Amazon Redshift · Cluster lno-dw', 'RA3.xlplus · 2 nodos · us-east-1')}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[['Estado', 'available', colors.success], ['Nodos', '2 / 2', colors.text], ['Storage', '320 GB', colors.text], ['Workload', '42 %', colors.info]].map(([l, v, c]: any) => (
                  <div key={l} className="rounded-md px-3 py-2" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <div className="text-[8px]" style={{ color: colors.textMuted }}>{l}</div>
                    <div className="text-[10px] font-bold" style={{ color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                  Tablas del warehouse (compile dbt real)
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Tabla</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Esquema</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Filas</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Columnas</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Tamaño</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Sort key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REDSHIFT_TABLES(rows).map(t => (
                      <tr key={t.name} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td className="px-3 py-1.5"><span className="text-[9px] font-mono" style={{ color: colors.text }}>{t.name}</span></td>
                        <td className="px-3 py-1.5">{cell(t.schema)}</td>
                        <td className="px-3 py-1.5"><span className="text-[9px] font-mono" style={{ color: colors.text }}>{fmtMXN(t.rows)}</span></td>
                        <td className="px-3 py-1.5">{cell(String(t.cols))}</td>
                        <td className="px-3 py-1.5">{cell(t.size)}</td>
                        <td className="px-3 py-1.5">{cell(t.sortkey)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'iam' && (
            <div>
              {header('IAM · Usuarios', 'Control de acceso del equipo Data Engineering')}
              <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Usuario</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Grupo</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Políticas</th>
                      <th className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {IAM_USERS.map(u => (
                      <tr key={u.name} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td className="px-3 py-2">
                          <div className="text-[9px] font-mono font-bold" style={{ color: colors.text }}>{u.name}</div>
                          <div className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{u.arn}</div>
                        </td>
                        <td className="px-3 py-2">{cell(u.group)}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-0.5">
                            {u.policies.map(p => (
                              <span key={p} className="text-[8px] px-1 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>{p}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={u.isActive ? { background: `${colors.success}18`, color: colors.success } : { background: `${colors.warning}18`, color: colors.warning }}>
                            {u.isActive ? 'activo' : 'inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'billing' && (
            <div>
              {header('AWS Billing · Cost Explorer', 'Consumo mensual estimado del entorno DataFlow (USD)')}
              <div className="rounded-md p-3 mb-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="flex items-end gap-2 h-28 mb-2">
                  {MONTHS.map((m, i) => {
                    const c = COSTS[m];
                    const h = Math.round((c / Math.max(...Object.values(COSTS))) * 88) + 8;
                    return (
                      <div key={m} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{c} USD</span>
                        <div style={{ height: h, width: '100%', background: i === MONTHS.length - 1 ? colors.primary : colors.info, borderRadius: 3, opacity: i === MONTHS.length - 1 ? 1 : 0.7 }} />
                        <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{m}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                  Desglose por servicio · julio
                </div>
                {COST_BREAKDOWN.map(s => (
                  <div key={s.service} className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <div className="w-40 text-[9px]" style={{ color: colors.text }}>{s.service}</div>
                    <div className="flex-1 h-2 rounded-full" style={{ background: colors.bg }}>
                      <div className="h-2 rounded-full" style={{ width: `${s.pct}%`, background: colors.primary }} />
                    </div>
                    <div className="w-20 text-[9px] font-mono" style={{ color: colors.text }}>{s.cost.toFixed(1)} <span className="text-[8px]" style={{ color: colors.textMuted }}>USD</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard (extraído del componente principal) ─────────────

function innerDashboard(colors: any, header: (t: string, s: string) => React.ReactElement, cell: (s: string) => React.ReactElement) {
  const cards = [
    { label: 'Buckets S3', value: '3', icon: '🗂️', color: colors.info },
    { label: 'Tablas Redshift', value: '4', icon: '🛢️', color: colors.secondary },
    { label: 'Usuarios IAM', value: '4', icon: '🔐', color: colors.warning },
    { label: 'Costo jul (USD)', value: '381.9', icon: '💳', color: colors.success },
  ];
  return (
    <div>
      {header('Resumen del entorno', 'Cloud de DataFlow Analytics · pipeline lno_sales_pipeline en producción')}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-md px-3 py-2" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-base">{c.icon}</div>
            <div className="text-sm font-extrabold" style={{ color: c.color }}>{c.value}</div>
            <div className="text-[8px]" style={{ color: colors.textMuted }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-md overflow-hidden mb-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
          Eventos recientes · CloudTrail
        </div>
        {RECENT_EVENTS.map((e, i) => (
          <div key={i} className="px-3 py-1.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{e.time}</span>
            <span className="text-[8px] px-1 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>{e.service}</span>
            <span className="text-[9px]" style={{ color: colors.text }}>{e.event}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md px-3 py-2" style={{ background: `${colors.success}18`, border: `1px solid ${colors.success}40` }}>
          <div className="text-[9px] font-bold" style={{ color: colors.success }}>Pipelines sanos</div>
          <div className="text-[9px]" style={{ color: colors.textMuted }}>lno_sales_pipeline: última ejecución OK (hoy 08:00). dbt tests 5/5.</div>
        </div>
        <div className="rounded-md px-3 py-2" style={{ background: `${colors.warning}18`, border: `1px solid ${colors.warning}40` }}>
          <div className="text-[9px] font-bold" style={{ color: colors.warning }}>Recomendación</div>
          <div className="text-[9px]" style={{ color: colors.textMuted }}>Clúster Redshift al 42%: considere warehouse sizing o XS para ahorrar ~18%.</div>
        </div>
      </div>
    </div>
  );
}