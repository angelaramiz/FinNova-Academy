import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { MODELS } from './DBTSim';

interface GitSimProps { theme: Theme; onBack: () => void; }

type Tab = 'repo' | 'mine' | 'inbox';
type PrStatus = 'open' | 'needs_changes' | 'approved' | 'merged' | 'closed';

// ─── NPCs ─────────────────────────────────────────────────────

interface Npc { id: string; name: string; role: string; initials: string; color: string; }

export const NPCS: Npc[] = [
  { id: 'sandra', name: 'Sandra Mora', role: 'Lead Data Engineer', initials: 'SM', color: '#FFB162' },
  { id: 'karla', name: 'Karla Ruiz', role: 'DE Jr · staging', initials: 'KR', color: '#A35139' },
  { id: 'dan', name: 'Dan Ortega', role: 'DE · marts', initials: 'DO', color: '#3B82F6' },
  { id: 'yo', name: 'Tú (DE Jr)', role: 'de-sim-alumno', initials: 'YO', color: '#22C55E' },
];

const npc = (id: string): Npc => NPCS.find(n => n.id === id)!;

// ─── Repo lno-dbt (archivos reales del pipeline) ──────────────

interface RepoFile { path: string; content: string; }

const DBT_PROJECT = `name: 'lno_dbt'
version: '1.7.0'
config-version: 2
profile: 'lno'
model-paths: ["models"]
test-paths: ["tests"]
target-path: "target"
vars:
  start_date: '2026-07-01'
on-run-end:
  - "{{ dbt_utils.log_info('pipeline listo') }}"`;

const README_MD = `# lno_dbt · modelo de datos Logística del Norte
Repositorio de transforms de DataFlow Analytics para LNO.

## Convenciones
- Staging: modelos 1:1 con fuentes (prefijo stg_)
- Intermediate: joins y lógica de negocio (prefijo int_)
- Marts: agregaciones para reportes (prefijo mrt_)
- Prohibido SELECT * fuera de staging
- Tests obligatorios: not_null / unique en PKs

## Deploy
dbt run && dbt test (CI + Airflow)`;

const REPO_FILES: RepoFile[] = [
  { path: 'dbt_project.yml', content: DBT_PROJECT },
  { path: 'README.md', content: README_MD },
  ...MODELS.map(m => ({ path: m.path + m.name + '.sql', content: m.sql })),
  { path: 'tests/schema.yml', content: `version: 2

models:
  - name: stg_ventas
    tests:
      - not_null: { column_name: id }
      - positive: { column_name: total }
  - name: mrt_ventas_por_cliente
    tests:
      - positive: { column_name: total_ventas }` },
];

const COLUMN_MAP: Record<string, string[]> = {
  'models/staging/stg_ventas.sql': ['id', 'fecha', 'cliente', 'producto', 'cantidad', 'precio_unit', 'total'],
  'models/staging/stg_clientes.sql': ['cliente_id', 'nombre', 'rfc', 'ciudad', 'sector'],
  'models/intermediate/int_ventas_cliente.sql': ['venta_id', 'fecha', 'cliente', 'producto', 'cantidad', 'total', 'cliente_id', 'ciudad', 'sector'],
  'models/marts/mrt_ventas_por_cliente.sql': ['cliente', 'ciudad', 'sector', 'num_ventas', 'total_ventas'],
};

const KNOWN_MODELS = MODELS.map(m => m.name);

// ─── Motor de análisis de diffs (reglas del repo) ─────────────

interface DiffFragment { file: string; startLine: number; head: number; lines: string[]; }

interface ReviewComment { line: number; msg: string; }

export function analyzeDiff(f: DiffFragment): ReviewComment[] {
  const out: ReviewComment[] = [];
  const base = f.startLine - f.head;
  f.lines.forEach((raw, i) => {
    const line = raw.trim();
    const ln = base + i;
    if (/^select\s*\*\s*$/i.test(line) || /^select\s*\*/i.test(line)) {
      out.push({ line: ln, msg: 'Evita SELECT * en modelos de producción: enumera columnas y usa prefijos de alias. Rompe la trazabilidad del catálogo.' });
      return;
    }
    line.replace(/ref\('([\w.]+)'\)/g, (_, name: string) => {
      const bare = name.split('.').pop() || name;
      if (!KNOWN_MODELS.includes(bare)) {
        out.push({ line: ln, msg: `ref() apunta a '${name}', que no existe en el DAG (los models conocidos: ${KNOWN_MODELS.join(', ')}). dbt build fallará.` });
      }
      return '';
    });
    line.replace(/(not_null|unique)\('(\w+)'\)/g, (_, kind: string, col: string) => {
      const cols = COLUMN_MAP[f.file] || [];
      if (!cols.includes(col)) {
        out.push({ line: ln, msg: `El test ${kind} sobre '${col}' fallará: esa columna no existe en ${f.file.split('/').pop()}. Columnas: ${cols.join(', ')}.` });
      }
      return '';
    });
    if (f.file.includes('marts') && /'TechCorp SA'|'Distribuidora Luna'|'Comercial Valle'/.test(line)) {
      out.push({ line: ln, msg: 'Hardcodeaste un cliente en el mart: usa JOIN a la dimensión stg_clientes. Un cambio de datos rompería el modelo.' });
    }
    if (/group by/i.test(line) && !/group by\s+\S/i.test(line)) {
      out.push({ line: ln, msg: 'GROUP BY vacío; las agregaciones necesitan al menos una columna.' });
    }
  });
  return out;
}

// ─── Tareas de PR propuestas (patch buena vs mala) ─────────────

interface PrTask {
  id: string;
  title: string;
  desc: string;
  branch: string;
  options: Array<{ label: string; patch: DiffFragment }>;
}

export function task1(): PrTask {
  return {
    id: 't1',
    title: 'Agregar tests de calidad a stg_clientes',
    desc: 'El team lead pidió tests obligatorios en staging: not_null en la PK.',
    branch: 'feature/tests-stg-clientes',
    options: [
      {
        label: 'Test not_null(id) dentro de stg_clientes.sql',
        patch: { file: 'models/staging/stg_clientes.sql', startLine: 9, head: 0, lines: [
          "      - not_null('id')",
        ] },
      },
      {
        label: 'Agregar test en schema.yml (not_null cliente_id)',
        patch: { file: 'tests/schema.yml', startLine: 10, head: 0, lines: [
          '  - name: stg_clientes',
          '    tests:',
          '      - not_null: { column_name: cliente_id }',
        ] },
      },
    ],
  };
}

export function task2(): PrTask {
  return {
    id: 't2',
    title: 'Dar orden al mart de clientes',
    desc: 'Solicitud de analytics: mrt_ventas_por_cliente debe ordenarse por total_ventas DESC.',
    branch: 'feature/order-mart',
    options: [
      {
        label: 'ORDER BY total_ventas DESC al final del SQL',
        patch: { file: 'models/marts/mrt_ventas_por_cliente.sql', startLine: 17, head: 0, lines: [
          'ORDER BY total_ventas DESC',
        ] },
      },
      {
        label: 'Filtrar solo TechCorp SA (cliente top)',
        patch: { file: 'models/marts/mrt_ventas_por_cliente.sql', startLine: 14, head: 0, lines: [
          "WHERE cliente = 'TechCorp SA'",
        ] },
      },
    ],
  };
}

// ─── PRs del equipo para code review (inbox) ───────────────────

interface TeamPr { id: string; author: string; title: string; desc: string; fragment: DiffFragment; isGood: boolean; }

const TEAM_PRS: TeamPr[] = [
  {
    id: 'p1',
    author: 'karla',
    title: 'feat: agrega sector completo a int_ventas_cliente',
    desc: 'Carlos y yo necesitamos el sector para el tablero de ventas.',
    fragment: { file: 'models/intermediate/int_ventas_cliente.sql', startLine: 12, head: 1, lines: [
      '    c.sector,',
    ] },
    isGood: true,
  },
  {
    id: 'p2',
    author: 'dan',
    title: 'perf: simplifica int_ventas_cliente',
    desc: 'Menos código = menos bugs. Uso SELECT * para ahorrar mantenimiento.',
    fragment: { file: 'models/intermediate/int_ventas_cliente.sql', startLine: 6, head: 1, lines: [
      'SELECT *',
    ] },
    isGood: false,
  },
];

// ─── Estilo ├─ helpers ─────────────────────────────────────────

const AV = (n: Npc, colors: any, size = 20) => (
  <span className="inline-flex items-center justify-center rounded-full font-bold shrink-0" style={{ width: size, height: size, background: n.color, color: '#fff', fontSize: size * 0.42 }}>{n.initials}</span>
);

// ─── Componente principal ─────────────────────────────────────

export default function GitSim({ theme, onBack }: GitSimProps) {
  const colors = themeColors[theme];
  const [tab, setTab] = useState<Tab>('repo');
  const [selFile, setSelFile] = useState<string>('models/staging/stg_ventas.sql');
  const [myTask, setMyTask] = useState<PrTask>(task1);
  const [optionIdx, setOptionIdx] = useState<number>(0);
  const [myPr, setMyPr] = useState<null | { status: PrStatus; comments: ReviewComment[]; merged: boolean }>(null);
  const [commits, setCommits] = useState<string[]>([
    'chore: bump dbt a 1.7',
    'feat: mart mrt_ventas_por_cliente',
    'feat: int_ventas_cliente (join clientes)',
    'refactor: stg_ventas con total',
  ]);
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected' | null>>({ p1: null, p2: null });

  const sandra = npc('sandra');

  const openPr = (): void => {
    const patch = myTask.options[optionIdx].patch;
    const comments = analyzeDiff(patch);
    setMyPr({
      status: comments.length ? 'needs_changes' : 'approved',
      comments,
      merged: comments.length === 0,
    });
    setCommits(c => [`feat: ${myTask.title} (${myTask.branch})`, ...c]);
  };

  const reReview = (): void => {
    if (!myPr) return;
    const patch = myTask.options[optionIdx].patch;
    const comments = analyzeDiff(patch);
    setMyPr({ status: comments.length ? 'needs_changes' : 'approved', comments, merged: comments.length === 0 });
  };

  const decide = (prId: string, verdict: 'approved' | 'rejected'): void => {
    setDecisions(d => ({ ...d, [prId]: verdict }));
  };

  const reviewVerdict = (t: TeamPr): { good: boolean; note: string } => {
    const v = decisions[t.id];
    if (!v) return { good: true, note: '' };
    if (t.isGood && v === 'approved') return { good: true, note: 'Nada que objetar. Sandra: buen ojo ✅' };
    if (!t.isGood && v === 'rejected') return { good: true, note: 'Sandra: detectaste el SELECT * a tiempo ✅' };
    if (t.isGood && v === 'rejected') return { good: false, note: 'Sandra: rechazaste un cambio correcto, pide justificación antes de bloquear.' };
    if (!t.isGood && v === 'approved') return { good: false, note: 'Sandra: aprobaste un SELECT * que rompe el catálogo. Revisión pendiente en tu historial.' };
    return { good: true, note: '' };
  };

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'repo', label: 'Repo', icon: '📁' },
    { id: 'mine', label: 'Mis PRs', icon: '🌿' },
    { id: 'inbox', label: 'Reviews', icon: '👥' },
  ];

  const currentFile = REPO_FILES.find(f => f.path === selFile);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {/* Barra */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <span className="text-sm">🌿</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>Git · lno-dbt</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.success}18`, color: colors.success }}>branch: develop</span>
        {commits.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>{commits.length} commits</span>}
        <div className="flex-1" />
        <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>origin · dataflow/lno_dbt</span>
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>← Escritorio</button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="text-[10px] px-3 py-1 rounded" style={tab === t.id ? { background: colors.primary, color: '#fff' } : { background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── REPO ── */}
        {tab === 'repo' && (
          <>
            <div className="w-52 shrink-0 border-r overflow-y-auto p-2" style={{ background: colors.cardSecondary, borderColor: colors.border }}>
              <div className="text-[8px] font-bold px-2 py-1" style={{ color: colors.textMuted }}>EXPLORADOR</div>
              {REPO_FILES.map(f => (
                <button key={f.path} onClick={() => setSelFile(f.path)} className="w-full text-left px-2 py-1 rounded text-[9px] font-mono truncate"
                  style={selFile === f.path ? { background: colors.primary, color: '#fff' } : { color: colors.text }}>
                  {f.path}
                </button>
              ))}
              <div className="text-[8px] font-bold px-2 py-1 mt-3" style={{ color: colors.textMuted }}>HISTORIAL (git log --oneline)</div>
              {commits.map((c, i) => (
                <div key={i} className="px-2 py-0.5 text-[8px] font-mono" style={{ color: i === 0 ? colors.success : colors.textMuted }}>
                  {i === 0 ? '● ' : '○ '}{c}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {currentFile && (
                <div className="h-full flex flex-col">
                  <div className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, background: colors.cardBg }}>{currentFile.path}</div>
                  <pre className="flex-1 overflow-auto p-3 text-[9px] font-mono leading-relaxed" style={{ color: colors.text, whiteSpace: 'pre' }}>{currentFile.content}</pre>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── MIS PRS ── */}
        {tab === 'mine' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center gap-2 mb-1">
                {AV(npc('sandra'), colors)}
                <div>
                  <div className="text-[9px] font-bold" style={{ color: colors.text }}>{sandra.name} · {sandra.role}</div>
                  <div className="text-[8px]" style={{ color: colors.textMuted }}>Hoy 09:12</div>
                </div>
              </div>
              <div className="text-[10px]" style={{ color: colors.textMuted }}>
                Hoy toca el ticket <b style={{ color: colors.text }}>{myTask.title}</b>. Cuando tengas el cambio, abre un PR desde <span className="font-mono text-[9px]" style={{ color: colors.primary }}>{myTask.branch}</span>.
              </div>
              <div className="mt-2 rounded-md px-2 py-1.5 text-[9px]" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>{myTask.desc}</div>
            </div>

            {/* Selector de cambio */}
            <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="text-[9px] font-bold mb-2" style={{ color: colors.text }}>Tu cambio (qué vas a commitear)</div>
              {myTask.options.map((o, i) => (
                <label key={i} className="flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer" style={{ background: optionIdx === i ? `${colors.info}14` : 'transparent' }}>
                  <input type="radio" name="opt" checked={optionIdx === i} onChange={() => setOptionIdx(i)} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[9px] font-semibold" style={{ color: colors.text }}>{o.label}</div>
                    <div className="text-[8px] font-mono mt-0.5" style={{ color: colors.textMuted }}>
                      {o.patch.file} · L{o.patch.startLine}
                    </div>
                  </div>
                </label>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={openPr} className="text-[9px] px-3 py-1.5 rounded font-bold" style={{ background: colors.primary, color: '#fff' }}>🌿 Commit + abrir PR</button>
                {myPr && myPr.status === 'needs_changes' && (
                  <button onClick={reReview} className="text-[9px] px-3 py-1.5 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.text }}>↻ Corregir y push (re-review)</button>
                )}
              </div>
            </div>

            {/* Thread del PR */}
            {myPr && (
              <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                  <span className="text-[9px] font-mono font-bold" style={{ color: colors.text }}>PR #10</span>
                  <span className="text-[9px]" style={{ color: colors.text }}>{myTask.title}</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full" style={statusStyle(myPr.status, colors)}>{statusLabel(myPr.status)}</span>
                </div>
                <div className="p-3">
                  {myPr.comments.length === 0 ? (
                    <div className="flex items-start gap-2">
                      {AV(sandra, colors)}
                      <div className="flex-1">
                        <div className="text-[9px] font-bold" style={{ color: colors.text }}>{sandra.name} <span className="text-[8px] font-normal" style={{ color: colors.textMuted }}>revisó {myPr.status === 'approved' ? 'tu PR' : ''} · hace 1 min</span></div>
                        <div className="mt-1 rounded-md px-2 py-1.5 text-[9px] inline-block" style={{ background: `${colors.success}18`, color: colors.success }}>LGTM ✅ — mergeado a develop. Buen trabajo.</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        {AV(sandra, colors)}
                        <div className="flex-1">
                          <div className="text-[9px] font-bold" style={{ color: colors.text }}>{sandra.name} <span className="text-[8px] font-normal" style={{ color: colors.textMuted }}>revisó · hace 1 min</span></div>
                          <div className="mt-1 rounded-md px-2 py-1.5 text-[9px] inline-block" style={{ background: `${colors.error}18`, color: colors.error }}>
                            Rechazado: hay {myPr.comments.length} observación{myPr.comments.length > 1 ? 'es' : ''} en el diff. Necesita cambios.
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {myPr.comments.map((c, i) => (
                          <div key={i} className="rounded-md px-2 py-1.5 border-l-2" style={{ background: colors.bg, borderLeftColor: colors.error }}>
                            <div className="text-[8px] font-mono" style={{ color: colors.textMuted }}>L{c.line} · {myTask.options[optionIdx].patch.file.split('/').pop()}</div>
                            <div className="text-[9px]" style={{ color: colors.text }}>{c.msg}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab === 'inbox' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {TEAM_PRS.map(t => {
              const v = decisions[t.id];
              const vr = reviewVerdict(t);
              const author = npc(t.author);
              return (
                <div key={t.id} className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
                    {AV(author, colors)}
                    <div className="flex-1">
                      <div className="text-[9px] font-bold" style={{ color: colors.text }}>{author.name} · {author.role}</div>
                      <div className="text-[9px]" style={{ color: colors.textMuted }}>{t.title}</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>PR #{t.id === 'p1' ? '8' : '9'}</span>
                  </div>
                  <div className="px-3 py-2">
                    <div className="text-[8px] font-mono mb-1" style={{ color: colors.textMuted }}>{t.fragment.file} · L{t.fragment.startLine}</div>
                    <div className="rounded-md px-2 py-1.5" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                      {t.fragment.lines.map((l, i) => (
                        <div key={i} className="text-[9px] font-mono" style={{ color: colors.success }}>+ {l}</div>
                      ))}
                      <div className="text-[9px]" style={{ color: colors.textMuted }}>{t.desc}</div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => decide(t.id, 'approved')} className="text-[9px] px-3 py-1 rounded font-bold" style={{ background: colors.success, color: '#fff', opacity: v === 'approved' ? 1 : v ? 0.4 : 1 }}>✓ Approve</button>
                      <button onClick={() => decide(t.id, 'rejected')} className="text-[9px] px-3 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${v === 'rejected' ? colors.error : colors.border}`, color: v === 'rejected' ? colors.error : colors.text }}>✗ Request changes</button>
                      {v && (
                        <span className="ml-auto text-[9px] px-2 py-1 rounded-full" style={vr.good ? { background: `${colors.success}18`, color: colors.success } : { background: `${colors.error}18`, color: colors.error }}>
                          {vr.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="rounded-md px-3 py-2 text-[9px]" style={{ background: `${colors.info}10`, border: `1px dashed ${colors.border}`, color: colors.textMuted }}>
              💡 Regla del equipo: nada pasa a develop sin review aprobado. Los reviews quedan en tu histórico (Sandra los audita).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers de visual ─────────────────────────────────────────

function statusLabel(s: PrStatus): string {
  switch (s) {
    case 'approved': return 'approved ✅';
    case 'needs_changes': return 'needs_changes ✗';
    case 'merged': return 'merged';
    case 'closed': return 'closed';
    default: return 'open';
  }
}

function statusStyle(s: PrStatus, colors: any) {
  switch (s) {
    case 'approved': case 'merged': return { background: `${colors.success}18`, color: colors.success };
    case 'needs_changes': return { background: `${colors.error}18`, color: colors.error };
    default: return { background: `${colors.info}18`, color: colors.info };
  }
}