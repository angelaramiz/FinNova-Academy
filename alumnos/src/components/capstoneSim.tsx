import { useMemo, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';

interface CapstoneSimProps { theme: Theme; onBack: () => void; }

// ─── Datos reales para el entregable ───────────────────────────

function pipelineStats() {
  const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
  for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente']) {
    const model = MODELS.find(m => m.name === name);
    if (!model) continue;
    tables[name] = compileModelSql(model.sql, { ...SOURCES, ...tables });
  }
  const mrt = tables.mrt_ventas_por_cliente.rows;
  const total = mrt.reduce((a, r) => a + Number(r.total_ventas), 0);
  const top = [...mrt].sort((a, b) => Number(b.total_ventas) - Number(a.total_ventas))[0];
  return {
    stgRows: tables.stg_ventas.rows.length + tables.stg_clientes.rows.length,
    intRows: tables.int_ventas_cliente.rows.length,
    mrtRows: mrt.length,
    total,
    topCliente: String(top.cliente),
    topMonto: Number(top.total_ventas),
  };
}

// ─── Fases del proyecto ────────────────────────────────────────

interface Checkpoint { prompt: string; options: string[]; correct: number; explain: string; }

interface Phase {
  id: string;
  num: number;
  title: string;
  app: string;
  icon: string;
  desc: string;
  check: Checkpoint;
}

export const PHASES: Phase[] = [
  {
    id: 'ingesta',
    num: 1,
    title: 'Ingesta de fuentes',
    app: 'CloudSim · S3 + Foundry',
    icon: '🗂️',
    desc: 'Las ventas llegan diario vía API y se guardan en S3. Identifica la fuente primaria del pipeline.',
    check: {
      prompt: '¿Cuál es el dato fuente (raw) del que parte todo el pipeline?',
      options: ['raw_ventas (8 registros, vía API → S3)', 'mrt_ventas_por_cliente (ya agregado)', 'stg_ventas (modelo de staging)', 'Un CSV que pega Dan en Slack'],
      correct: 0,
      explain: 'raw_ventas es la fuente: 8 ventas que llegan de la API a lno-raw-ventas. Todo transform empieza en un source().',
    },
  },
  {
    id: 'transform',
    num: 2,
    title: 'Transform (dbt)',
    app: 'DBTSim · dbt Transform',
    icon: '🧱',
    desc: 'Construye el modelo intermedio que une ventas con clientes.',
    check: {
      prompt: '¿Qué pieza completa el modelo int_ventas_cliente?',
      options: ['LEFT JOIN stg_clientes c ON c.nombre = v.cliente', 'FULL JOIN con el catálogo de productos', 'CROSS JOIN con todas las tablas', 'No se necesita JOIN: los datos ya vienen juntos'],
      correct: 0,
      explain: 'int_ventas_cliente hace LEFT JOIN stg_clientes por nombre para heredar ciudad y sector — verificable en DBTSim y en el DAG de Airflow.',
    },
  },
  {
    id: 'calidad',
    num: 3,
    title: 'Calidad y tests',
    app: 'DBTSim · Tests + GitSim',
    icon: '🛡️',
    desc: 'Los tests protegen el contrato de datos antes de llegar al mart.',
    check: {
      prompt: 'Elige los tests obligatorios para stg_ventas (PK y monto):',
      options: ['not_null(id) y positive(total)', 'unique(producto) y not_null(fecha)', 'solo un test de formato', 'Los tests son opcionales si el mart está bien'],
      correct: 0,
      explain: 'not_null(id) protege la PK y positive(total) evita montos negativos. Son los tests t1 y t2 del proyecto dbt.',
    },
  },
  {
    id: 'catalogo',
    num: 4,
    title: 'Catálogo y metadata',
    app: 'CatalogSim · Data Catalog',
    icon: '📚',
    desc: 'Documentar datasets es parte del rol: dueños, dominios y freshness.',
    check: {
      prompt: '¿En qué dominio debe vivir mrt_ventas_por_cliente?',
      options: ['Gold (curated, para reportes)', 'Bronze (raw sin procesar)', 'Silver (staging ligero)', 'Ninguno: el catálogo solo documenta S3'],
      correct: 0,
      explain: 'marts = capa Gold: curada, con tests y lista para BI. Bronze es raw y Silver es staging.',
    },
  },
  {
    id: 'orquestacion',
    num: 5,
    title: 'Orquestación',
    app: 'AirflowSim · Airflow',
    icon: '🛫',
    desc: 'El pipeline corre a las 08:00 todos los días. El orden importa.',
    check: {
      prompt: '¿Cuál es el orden correcto del DAG lno_sales_pipeline?',
      options: ['ingesta → dbt_stg → dbt_int → dbt_mart → dbt_test → export', 'dbt_mart → ingesta → export → dbt_test', 'export → dbt_test → dbt_mart → ingesta', 'Da igual el orden si todos corren el mismo día'],
      correct: 0,
      explain: 'Primero ingesta, luego staging→int→mart (dependencias de dbt), tests al final del run y export a Redshift.',
    },
  },
  {
    id: 'cloud',
    num: 6,
    title: 'Deploy en cloud',
    app: 'CloudSim · AWS',
    icon: '☁️',
    desc: 'El mart se publica para que los analistas lo consuman.',
    check: {
      prompt: '¿A dónde se exporta el mart final mrt_ventas_por_cliente?',
      options: ['S3 staging → Redshift (esquema marts)', 'Directo a un Excel del escritorio', 'A un bucket público de logos', 'Se guarda solo en la máquina de Sandra'],
      correct: 0,
      explain: 'El export_redshift escribe marts.mrt_ventas_por_cliente: parquet en lno-staging-dbt y tabla en Redshift (2 nodos RA3).',
    },
  },
  {
    id: 'bi',
    num: 7,
    title: 'Entrega a negocio',
    app: 'BiSim · Looker',
    icon: '📊',
    desc: 'El tablero ejecutivo se alimenta del mart. Interpreta los datos.',
    check: {
      prompt: 'Según mrt_ventas_por_cliente, ¿quién es el cliente top y cuánto facturó?',
      options: ['TechCorp SA con $35,900', 'Distribuidora Luna con $4,450', 'Comercial Valle con $28,500', 'Inversiones Trust con $34,000'],
      correct: 0,
      explain: 'TechCorp SA lidera con $35,900 (3 ventas). El ranking es verificable en BiSim y en el mart.',
    },
  },
];

const SCORE_FIRST = 100;
const SCORE_RETRY = 50;

// ─── Componente ────────────────────────────────────────────────

export default function CapstoneSim({ theme, onBack }: CapstoneSimProps) {
  const colors = themeColors[theme];
  const stats = useMemo(pipelineStats, []);
  const [done, setDone] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const current = PHASES.find(p => !done[p.id]) || null;
  const progress = Object.keys(done).length / PHASES.length;
  const totalScore = PHASES.reduce((a, p) => a + (done[p.id] || 0), 0);

  const answer = (p: Phase, idx: number): void => {
    if (done[p.id]) return;
    setSel(s => ({ ...s, [p.id]: idx }));
    const att = (attempts[p.id] || 0) + 1;
    setAttempts(a => ({ ...a, [p.id]: att }));
    if (idx === p.check.correct) {
      const pts = att === 1 ? SCORE_FIRST : SCORE_RETRY;
      setDone(d => ({ ...d, [p.id]: pts }));
    }
  };

  const chip = (ok: boolean, text: string) => (
    <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={ok ? { background: `${colors.success}18`, color: colors.success } : { background: `${colors.error}18`, color: colors.error }}>{text}</span>
  );

  const header = (
    <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
      <span className="text-sm">🎓</span>
      <span className="text-xs font-bold" style={{ color: colors.text }}>Proyecto Integrador · Pipeline de Ventas LNO</span>
      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>semanas 10-12</span>
      <div className="flex-1" />
      <div className="text-[9px] font-mono" style={{ color: colors.textMuted }}>puntaje: {totalScore} / {PHASES.length * SCORE_FIRST}</div>
      <button onClick={onBack} className="text-[9px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>← Escritorio</button>
    </div>
  );

  const progressBar = (
    <div className="px-3 pt-2 shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full" style={{ background: colors.cardSecondary }}>
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress * 100}%`, background: colors.primary }} />
        </div>
        <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {header}
      {progressBar}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar fases */}
        <div className="w-48 shrink-0 border-r p-2 flex flex-col gap-1 overflow-y-auto" style={{ background: colors.cardSecondary, borderColor: colors.border }}>
          <div className="text-[8px] font-bold px-2 pt-1 pb-1" style={{ color: colors.textMuted }}>FASES DEL PROYECTO</div>
          {PHASES.map(p => {
            const isDone = !!done[p.id];
            const isCurrent = current?.id === p.id;
            return (
              <div key={p.id} className={`px-2 py-1.5 rounded text-[9px] ${isCurrent ? 'font-bold' : ''}`} style={{ background: isCurrent ? colors.primary : 'transparent', color: isCurrent ? '#fff' : colors.text, opacity: isDone ? 0.75 : 1 }}>
                <span className="mr-1">{isDone ? '✅' : p.icon}</span>
                <span className="font-mono">{p.num}.</span> {p.title}
              </div>
            );
          })}
          <div className="flex-1" />
          <div className="text-[8px] px-2 py-1.5 rounded" style={{ background: `${colors.info}18`, color: colors.info }}>
            Entregable: pipeline ELT documentado + tablero + repo con PRs aprobados.
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-3">
          {finished ? (
            <div className="max-w-xl mx-auto mt-4">
              <div className="rounded-md p-4 text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.success}50` }}>
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-sm font-extrabold" style={{ color: colors.success }}>¡Proyecto integrador completado!</div>
                <div className="text-[9px] mt-1" style={{ color: colors.textMuted }}>Puntaje: {totalScore}/{PHASES.length * SCORE_FIRST} · Entregable listo para presentación al equipo de Sandra.</div>
              </div>
              <div className="mt-3 rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="px-3 py-2 text-[9px] font-bold" style={{ color: colors.text, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>📄 README de arquitectura (entregable)</div>
                <div className="p-3 font-mono text-[9px] leading-relaxed" style={{ color: colors.text }}>
                  {'# Pipeline de Ventas LNO — Arquitectura\n'}
                  {'\n'}
                  {'1. Fuentes:   raw_ventas (API) y raw_clientes (S3)\n'}
                  {`2. Staging:   stg_ventas + stg_clientes (${stats.stgRows} filas)\n`}
                  {`3. Int:       int_ventas_cliente — JOIN por nombre (${stats.intRows} filas)\n`}
                  {`4. Mart:      mrt_ventas_por_cliente (${stats.mrtRows} clientes)\n`}
                  {`5. Calidad:   5 tests dbt (not_null, unique, positive)\n`}
                  {`6. Orquest:   Airflow DAG diario 08:00 → export Redshift\n`}
                  {`7. Reporte:   BI Looker sobre marts (total $${stats.total.toLocaleString('es-MX')})\n`}
                  {`\nTop cliente del mes: ${stats.topCliente} con $${stats.topMonto.toLocaleString('es-MX')}`}
                </div>
              </div>
              <button onClick={() => { setFinished(false); setDone({}); setSel({}); setAttempts({}); }} className="mt-3 text-[9px] px-3 py-1.5 rounded font-bold" style={{ background: colors.primary, color: '#fff' }}>↻ Reiniciar proyecto</button>
            </div>
          ) : current ? (
            <div className="max-w-xl mx-auto mt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{current.icon}</span>
                <div>
                  <div className="text-[10px] font-extrabold" style={{ color: colors.text }}>Fase {current.num}/7 · {current.title}</div>
                  <div className="text-[8px]" style={{ color: colors.textMuted }}>herramienta: {current.app}</div>
                </div>
              </div>
              <div className="rounded-md p-3 mb-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="text-[9px]" style={{ color: colors.text }}>{current.desc}</div>
                <div className="mt-3 text-[9px] font-bold" style={{ color: colors.primary }}>{current.check.prompt}</div>
                <div className="mt-2 space-y-1.5">
                  {current.check.options.map((o, i) => {
                    const picked = sel[current.id] === i;
                    const isCorrect = done[current.id] && i === current.check.correct;
                    const isWrong = picked && !done[current.id];
                    return (
                      <button key={i} onClick={() => answer(current, i)} className="w-full text-left px-3 py-2 rounded text-[9px] flex items-center gap-2"
                        style={{ background: isCorrect ? `${colors.success}18` : isWrong ? `${colors.error}18` : colors.bg, border: `1px solid ${picked ? (done[current.id] ? colors.success : colors.error) : colors.border}`, color: colors.text, cursor: done[current.id] ? 'default' : 'pointer' }}>
                        <span className="font-mono text-[8px]" style={{ color: colors.textMuted }}>{String.fromCharCode(97 + i)})</span>
                        {o}
                        {isCorrect && <span className="ml-auto">✅</span>}
                      </button>
                    );
                  })}
                </div>
                {done[current.id] ? (
                  <div className="mt-3 rounded-md px-3 py-2 text-[9px]" style={{ background: `${colors.success}18`, color: colors.success }}>
                    ✅ Correcto — {current.check.explain}
                    <div className="mt-2">
                      <button onClick={() => setFinished(true)} className="text-[9px] px-3 py-1.5 rounded font-bold" style={{ background: colors.primary, color: '#fff' }}>
                        {current.num === 7 ? '🎉 Finalizar proyecto' : 'Siguiente fase →'}
                      </button>
                    </div>
                  </div>
                ) : attempts[current.id] ? (
                  <div className="mt-3 rounded-md px-3 py-2 text-[9px]" style={{ background: `${colors.error}18`, color: colors.error }}>
                    ❌ Intenta de nuevo. Pista: repasa {current.app}.
                  </div>
                ) : null}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {PHASES.map(p => (done[p.id] ? chip(true, `F${p.num} ✅`) : chip(false, `F${p.num} · pendiente`)))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}