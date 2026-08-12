import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface DataOpsSimProps { theme: Theme; onBack: () => void; }

// ─── Datos coherentes con el pipeline (Airflow + dbt + Redshift) ──

const SLOT_HOURS: Array<{ h: string; usage: number }> = [
  { h: '07', usage: 12 }, { h: '08', usage: 22 }, { h: '09', usage: 38 }, { h: '10', usage: 52 },
  { h: '11', usage: 48 }, { h: '12', usage: 41 }, { h: '13', usage: 26 }, { h: '14', usage: 34 },
  { h: '15', usage: 47 }, { h: '16', usage: 85 }, { h: '17', usage: 62 }, { h: '18', usage: 44 },
  { h: '19', usage: 30 }, { h: '20', usage: 18 }, { h: '21', usage: 10 }, { h: '22', usage: 6 },
];

const ALERTS: Array<{ sev: 'ok' | 'warn' | 'err'; title: string; detail: string; time: string }> = [
  { sev: 'err', title: 'Uso de slots > 80%', detail: 'Query pesada en int_ventas_cliente (16:40, 4.2 min) — 17 nodos-slot ocupados', time: '04-jul 16:40' },
  { sev: 'warn', title: 'Costo proyectado 93% del presupuesto', detail: 'Presupuesto mensual $180.00 · proyectado $168.40 (reserved 3-yr)', time: 'últimas 24h' },
  { sev: 'warn', title: 'Cola de queries 6 min', detail: '3 queries en espera detrás del snapshot diario (17:30)', time: 'hace 3h' },
  { sev: 'ok', title: 'Run diario completado', detail: 'lno_sales_pipeline success · 7/7 tareas · 8:55', time: 'hoy 08:55' },
];

interface DatasetSla { name: string; layer: string; owner: string; freshness: string; slaTime: string; ok: boolean; tests: string; }

const DATASETS: DatasetSla[] = [
  { name: 'raw_ventas', layer: 'bronze', owner: 'Data Ingestion', freshness: '08:25', slaTime: '08:30', ok: true, tests: '—' },
  { name: 'raw_clientes', layer: 'bronze', owner: 'Data Ingestion', freshness: '08:25', slaTime: '08:30', ok: true, tests: '—' },
  { name: 'stg_ventas', layer: 'silver', owner: 'Karla Ruiz', freshness: '08:50', slaTime: '09:00', ok: true, tests: '2/2' },
  { name: 'stg_clientes', layer: 'silver', owner: 'Karla Ruiz', freshness: '08:50', slaTime: '09:00', ok: true, tests: '1/1' },
  { name: 'int_ventas_cliente', layer: 'silver', owner: 'Tú', freshness: '08:55', slaTime: '09:00', ok: true, tests: '1/1' },
  { name: 'mrt_ventas_por_cliente', layer: 'gold', owner: 'Sandra Mora', freshness: '08:55', slaTime: '09:00', ok: true, tests: '1/1' },
  { name: 'logs_airflow_dbt', layer: 'ops', owner: 'Observability', freshness: '09:00', slaTime: '09:05', ok: true, tests: '—' },
];

const DAYS = ['03-jul', '04-jul', '05-jul', '06-jul', '07-jul', '08-jul', 'hoy'];
// La corrida del 05-jul falló en dbt_test (ver AirflowSim) → mrt no cumplió SLA
const MATRIX: Record<string, boolean[]> = {
  raw_ventas: [true, true, true, true, true, true, true],
  raw_clientes: [true, true, true, true, true, true, true],
  stg_ventas: [true, true, true, true, true, true, true],
  stg_clientes: [true, true, true, true, true, true, true],
  int_ventas_cliente: [true, true, true, true, true, true, true],
  mrt_ventas_por_cliente: [true, true, false, true, true, true, true],
  logs_airflow_dbt: [true, true, true, true, true, true, true],
};

const TESTS_LABELS = ['not_null(id)', 'positive(total)', 'unique(cliente_id)', 'not_null(venta_id)', 'positive(total_ventas)'];

export default function DataOpsSim({ theme, onBack }: DataOpsSimProps) {
  const colors = themeColors[theme];
  const [tab, setTab] = useState<'redshift' | 'sla'>('redshift');

  const slotNow = 42;
  const slotColor = slotNow > 80 ? colors.error : slotNow > 60 ? colors.warning : colors.success;
  const slaPct = Math.round((Object.values(MATRIX).flat().filter(Boolean).length / (Object.values(MATRIX).flat().length)) * 100);

  const tabs = [
    { id: 'redshift' as const, label: 'Cómputo & Costo', icon: '💸' },
    { id: 'sla' as const, label: 'SLAs de Calidad', icon: '🛡️' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {/* Barra */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <span className="text-sm">🧠</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>DataOps Console · warehouse lno-dw</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.success}18`, color: colors.success }}>● operativo</span>
        <div className="flex-1" />
        <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>SLA 30d: {slaPct}%</div>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>← Escritorio</button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 shrink-0">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className="text-[10px] px-3 py-1 rounded" style={tab === tb.id ? { background: colors.primary, color: '#fff' } : { background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {tab === 'redshift' && <RedshiftTab colors={colors} />}
        {tab === 'sla' && <SlaTab colors={colors} />}
      </div>
    </div>
  );
}

// ─── Tab Cómputo & Costo ────────────────────────────────────────

function RedshiftTab({ colors }: { colors: any }) {
  const gaugeW = 42;
  return (
    <div className="space-y-3">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <KpiCard colors={colors} label="Slots en uso" value={`${gaugeW}%`} sub="de 32 nodos-slot (2×RA3.xlplus)" tone={gaugeW > 80 ? colors.error : gaugeW > 60 ? colors.warning : colors.success} />
        <KpiCard colors={colors} label="Costo / hora" value="$0.24" sub="reserved capacity 3-yr" tone={colors.info} />
        <KpiCard colors={colors} label="Costo mes (proyectado)" value="$168.40" sub="presupuesto $180.00 · 93%" tone={colors.warning} />
        <KpiCard colors={colors} label="Cumplimiento run diario" value="100%" sub="7/7 días · lno_sales_pipeline" tone={colors.success} />
      </div>

      {/* Gauge + bars */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="text-[8px] font-bold mb-2" style={{ color: colors.textMuted }}>SEMÁFORO DE CÓMPUTO — uso actual de slots</div>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-24">
              <div className="absolute inset-0 flex items-end justify-center">
                <div className="w-8 rounded-full" style={{ background: `${gaugeW > 80 ? colors.error : gaugeW > 60 ? colors.warning : colors.success}20`, height: '100%', border: `1px solid ${colors.border}` }}>
                  <div className="w-full rounded-full" style={{ background: slotLevelColor(gaugeW, colors), height: `${gaugeW}%`, transition: 'height .4s' }} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full text-center text-[9px] font-mono font-bold" style={{ color: slotLevelColor(gaugeW, colors) }}>{gaugeW}%</div>
            </div>
            <div className="text-[9px] leading-relaxed" style={{ color: colors.textMuted }}>
              {gaugeW < 60 ? (
                <>Cluster <b style={{ color: colors.text }}>saludable</b> — hay capacidad ociosa.<br />Evaluar <b style={{ color: colors.text }}>downsize → RA3.xs (1 nodo)</b> para ahorrar ~$1,200/año.</>
              ) : gaugeW < 80 ? (
                <>Uso <b style={{ color: colors.text }}>moderado</b> — monitorear queries pesadas en horas pico (16-17h).</>
              ) : (
                <>Uso <b style={{ color: colors.error }}>crítico</b> — considerar escala a RA3.4xlarge o <b style={{ color: colors.text }}>workload management</b> con queues.</>
              )}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[8px] font-mono" style={{ color: colors.textMuted }}>
            <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span>
          </div>
          <div className="flex items-end gap-0.5 h-10 mt-1">
            {SLOT_HOURS.map(x => (
              <div key={x.h} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-sm" style={{ background: x.usage > 80 ? colors.error : x.usage > 60 ? colors.warning : colors.success, height: `${x.usage}%`, minHeight: 2 }} title={`${x.h}:00 · ${x.usage}%`} />
              </div>
            ))}
          </div>
          <div className="mt-1 text-[8px] font-mono" style={{ color: colors.textMuted }}>uso de nodos-slot por hora · hoy (pico 16:00 = 85%)</div>
        </div>

        <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="text-[8px] font-bold mb-2" style={{ color: colors.textMuted }}>ALERTAS Y SEMÁFOROS</div>
          <div className="space-y-1.5">
            {ALERTS.map(a => (
              <div key={a.title} className="flex items-start gap-2 px-2 py-1.5 rounded" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                <span className="mt-0.5 text-[10px]">{a.sev === 'err' ? '🔴' : a.sev === 'warn' ? '🟡' : '🟢'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold" style={{ color: a.sev === 'err' ? colors.error : a.sev === 'warn' ? colors.warning : colors.success }}>{a.title}</div>
                  <div className="text-[8px]" style={{ color: colors.textMuted }}>{a.detail}</div>
                </div>
                <div className="text-[8px] font-mono shrink-0" style={{ color: colors.textMuted }}>{a.time}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 px-2 py-1.5 rounded" style={{ background: `${colors.info}14`, border: `1px solid ${colors.border}` }}>
            <div className="text-[8px] font-bold" style={{ color: colors.info }}>💡 RECOMENDACIÓN DE ROL</div>
            <div className="text-[8px]" style={{ color: colors.textMuted }}>El run diario usa ~40% de capacidad. Bajar a RA3.xs ahorra ~$1,200/año, pero perderías concurrencia para el snapshot semanal. Discutir con Sandra.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab SLAs de Calidad ────────────────────────────────────────

function SlaTab({ colors }: { colors: any }) {
  const totals = Object.values(MATRIX).flat();
  const slaPct = Math.round((totals.filter(Boolean).length / totals.length) * 100);
  const late = Object.entries(MATRIX).filter(([, v]) => v.some(x => !x)).map(([k]) => k);
  return (
    <div className="space-y-3">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <KpiCard colors={colors} label="SLA 7 días" value={`${slaPct}%`} sub={`${totals.filter(Boolean).length}/${totals.length} dataset-días`} tone={slaPct >= 95 ? colors.success : slaPct >= 80 ? colors.warning : colors.error} />
        <KpiCard colors={colors} label="Datasets en SLA" value={`${DATASETS.length - late.length}/${DATASETS.length}`} sub={late.length ? `fuera: ${late.join(', ')}` : 'todos al día'} tone={late.length ? colors.warning : colors.success} />
        <KpiCard colors={colors} label="Tests dbt" value="5/5" sub="pass · 1 fallo histórico (05-jul)" tone={colors.success} />
        <KpiCard colors={colors} label="Freshness promedio" value="08:46" sub="objetivo 09:00 (reporte 09:15)" tone={colors.success} />
      </div>

      {/* Tests */}
      <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="text-[8px] font-bold mb-2" style={{ color: colors.textMuted }}>TESTS DE CALIDAD (dbt test · hoy 08:55)</div>
        <div className="grid grid-cols-5 gap-1.5">
          {TESTS_LABELS.map(t => (
            <div key={t} className="px-2 py-1.5 rounded text-center" style={{ background: `${colors.success}14`, border: `1px solid ${colors.success}40` }}>
              <div className="text-[9px]">✅</div>
              <div className="text-[8px] font-mono" style={{ color: colors.success }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Matriz */}
      <div className="rounded-md p-3 overflow-x-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <div className="text-[8px] font-bold mb-2" style={{ color: colors.textMuted }}>MATRIZ DE CUMPLIMIENTO · últimos 7 días (● = SLA cumplido)</div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-2 py-1 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Dataset</th>
              {DAYS.map(d => <th key={d} className="px-2 py-1 text-[8px] font-mono text-center" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{d}</th>)}
              <th className="px-2 py-1 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>estado</th>
            </tr>
          </thead>
          <tbody>
            {DATASETS.map(ds => {
              const okDays = MATRIX[ds.name].filter(Boolean).length;
              return (
                <tr key={ds.name} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: layerBg(ds.layer, colors), color: '#fff' }}>{ds.layer}</span>
                      <span className="text-[9px] font-mono" style={{ color: colors.text }}>{ds.name}</span>
                    </div>
                  </td>
                  {MATRIX[ds.name].map((ok, i) => (
                    <td key={i} className="px-2 py-1 text-center">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background: ok ? colors.success : colors.error }} title={ok ? 'SLA cumplido' : 'SLA incumplido'} />
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${okDays === 7 ? colors.success : colors.warning}18`, color: okDays === 7 ? colors.success : colors.warning }}>
                      {okDays === 7 ? '✅ en SLA' : `⚠️ ${7 - okDays} incumplimiento`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-2 px-2 py-1.5 rounded" style={{ background: `${colors.error}12`, border: `1px solid ${colors.border}` }}>
          <div className="text-[8px] font-bold" style={{ color: colors.error }}>INCIDENTE 05-JUL · mrt_ventas_por_cliente fuera de SLA</div>
          <div className="text-[8px]" style={{ color: colors.textMuted }}>El run del 05-jul falló en la tarea dbt_test (ver Airflow → Ejecuciones) y export_redshift no se ejecutó. El mart quedó sin fresca hasta el run siguiente. Retry manual a las 11:20 resolvió el caso.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function KpiCard({ colors, label, value, sub, tone }: { colors: any; label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-md p-2.5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
      <div className="text-[8px] font-bold" style={{ color: colors.textMuted }}>{label}</div>
      <div className="text-base font-bold font-mono mt-0.5" style={{ color: tone }}>{value}</div>
      <div className="text-[8px]" style={{ color: colors.textMuted }}>{sub}</div>
    </div>
  );
}

function slotLevelColor(usage: number, colors: any): string {
  if (usage > 80) return colors.error;
  if (usage > 60) return colors.warning;
  return colors.success;
}

function layerBg(layer: string, colors: any): string {
  switch (layer) {
    case 'bronze': return colors.primary;
    case 'silver': return '#64748b';
    case 'gold': return colors.warning;
    default: return colors.info;
  }
}