import { useMemo, useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS, compileModelSql } from './DBTSim';

interface BiSimProps { theme: Theme; onBack: () => void; }

type PageId = 'exec' | 'detail';

// ─── Warehouse real del pipeline (compile dbt) ─────────────────

function buildWh() {
  const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
  for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente', 'mrt_ventas_por_cliente']) {
    const model = MODELS.find(m => m.name === name);
    if (!model) continue;
    tables[name] = compileModelSql(model.sql, { ...SOURCES, ...tables });
  }
  return tables;
}

const fmtMXN = (v: number) => v.toLocaleString('es-MX', { maximumFractionDigits: 0 });

const PALETTE = ['#FFB162', '#A35139', '#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B'];

// ─── Componente ────────────────────────────────────────────────

export default function BiSim({ theme, onBack }: BiSimProps) {
  const colors = themeColors[theme];
  const wh = useMemo(buildWh, []);
  const [page, setPage] = useState<PageId>('exec');
  const [sector, setSector] = useState<string>('todos');

  const ventas = wh.stg_ventas.rows;
  const mrt = wh.mrt_ventas_por_cliente.rows;

  const sectores = useMemo(() => Array.from(new Set(mrt.map(r => String(r.sector)))), [mrt]);
  const filtrados = useMemo(
    () => (sector === 'todos' ? mrt : mrt.filter(r => String(r.sector) === sector)),
    [mrt, sector]
  );

  const totalVentas = ventas.reduce((a, r) => a + Number(r.total), 0);
  const totalFiltrado = filtrados.reduce((a, r) => a + Number(r.total_ventas), 0);
  const numClientes = filtrados.length;
  const ticket = numClientes ? totalFiltrado / numClientes : 0;
  const maxCliente = Math.max(...filtrados.map(r => Number(r.total_ventas)), 1);

  // Serie diaria (stg_ventas por fecha)
  const porDia = useMemo(() => {
    const map = new Map<string, number>();
    ventas.forEach(r => {
      const k = String(r.fecha);
      map.set(k, (map.get(k) || 0) + Number(r.total));
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [ventas]);

  const maxDia = Math.max(...porDia.map(([, v]) => v), 1);
  const linePoints = porDia.map(([, v], i) => {
    const x = 30 + (i * 190) / Math.max(porDia.length - 1, 1);
    const y = 96 - (v / maxDia) * 76;
    return `${x},${y}`;
  });

  const cards: Array<{ label: string; value: string; sub: string; color: string }> = [
    { label: 'Ventas totales', value: `$${fmtMXN(totalFiltrado)}`, sub: sector === 'todos' ? 'mes de julio · MXN' : `sector: ${sector}`, color: colors.primary },
    { label: 'Clientes con venta', value: String(numClientes), sub: 'de 5 en cartera', color: colors.success },
    { label: 'Ticket promedio', value: `$${fmtMXN(ticket)}`, sub: 'por cliente del filtro', color: colors.info },
    { label: 'Líneas facturadas', value: String(ventas.length), sub: '8 transacciones del mes', color: colors.secondary },
  ];

  const pages: Array<{ id: PageId; label: string }> = [
    { id: 'exec', label: '📊 Ejecutivo' },
    { id: 'detail', label: '🔍 Detalle' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: colors.bg }}>
      {/* Barra */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <span className="text-sm">📊</span>
        <span className="text-xs font-bold" style={{ color: colors.text }}>BI · DataFlow Looker</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.success}18`, color: colors.success }}>● conectado a Redshift</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.info}18`, color: colors.info }}>fuente: marts mrt_ventas_por_cliente</span>
        <div className="flex-1" />
        <button onClick={onBack} className="text-[9px] px-2 py-1 rounded" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted }}>← Escritorio</button>
      </div>

      {/* Tabs + filtros */}
      <div className="flex items-center gap-2 px-3 pt-2 shrink-0 flex-wrap">
        {pages.map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} className="text-[10px] px-3 py-1 rounded" style={page === p.id ? { background: colors.primary, color: '#fff' } : { background: colors.cardBg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px]" style={{ color: colors.textMuted }}>Sector:</span>
          <select value={sector} onChange={e => setSector(e.target.value)} className="text-[9px] px-2 py-1 rounded outline-none" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.text }}>
            <option value="todos">Todos</option>
            {sectores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {cards.map(c => (
            <div key={c.label} className="rounded-md px-3 py-2.5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="text-[8px]" style={{ color: colors.textMuted }}>{c.label}</div>
              <div className="text-[15px] font-extrabold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-[8px]" style={{ color: colors.textMuted }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {page === 'exec' ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Barras por cliente */}
            <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="text-[9px] font-bold mb-1" style={{ color: colors.text }}>Ventas por cliente · julio</div>
              <div className="text-[8px] mb-2" style={{ color: colors.textMuted }}>fuente: mrt_ventas_por_cliente (dbt)</div>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {filtrados.sort((a, b) => Number(b.total_ventas) - Number(a.total_ventas)).map((r, i) => {
                  const v = Number(r.total_ventas);
                  const h = Math.round((v / maxCliente) * 100);
                  return (
                    <div key={String(r.cliente)} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[7px] font-mono" style={{ color: colors.text }}>{fmtMXN(v)}</span>
                      <div className="w-full rounded-t-sm" style={{ height: h, background: PALETTE[i % PALETTE.length], minHeight: h > 0 ? 4 : 2 }} />
                      <span className="text-[7px] text-center leading-tight" style={{ color: colors.textMuted }}>{String(r.cliente).split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donut por sector */}
            <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="text-[9px] font-bold mb-1" style={{ color: colors.text }}>Distribución por sector</div>
              <div className="text-[8px] mb-2" style={{ color: colors.textMuted }}>participación en monto facturado</div>
              <div className="flex items-center gap-4">
                <Donut data={mrt.map(r => ({ label: String(r.sector), value: Number(r.total_ventas) }))} colors={colors} />
                <div className="flex-1 space-y-1">
                  {mrt.map((r, i) => {
                    const pct = totalVentas ? (Number(r.total_ventas) / totalVentas) * 100 : 0;
                    return (
                      <div key={String(r.sector)} className="flex items-center gap-1.5 text-[8px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span style={{ color: colors.text }}>{String(r.sector)}</span>
                        <span className="ml-auto font-mono" style={{ color: colors.textMuted }}>{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Serie diaria */}
            <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="text-[9px] font-bold mb-1" style={{ color: colors.text }}>Facturación diaria (MXN)</div>
              <div className="text-[8px] mb-2" style={{ color: colors.textMuted }}>fuente: stg_ventas · 08–12 jul 2026</div>
              <svg viewBox="0 0 200 110" className="w-full">
                <line x1={30} y1={96} x2={190} y2={96} stroke={colors.border} strokeWidth={1} />
                {porDia.map(([d], i) => {
                  const x = 30 + (i * 190) / Math.max(porDia.length - 1, 1);
                  return (
                    <line key={d} x1={x} y1={96} x2={x} y2={98} stroke={colors.textMuted} strokeWidth={1} />
                  );
                })}
                <polyline points={linePoints.join(' ')} fill="none" stroke={colors.primary} strokeWidth={2} />
                <circle cx={(linePoints[linePoints.length - 1] || '30,96').split(',')[0]} cy={(linePoints[linePoints.length - 1] || '30,20').split(',')[1]} r={3} fill={colors.primary} />
                {porDia.map(([d], i) => {
                  const x = 30 + (i * 190) / Math.max(porDia.length - 1, 1);
                  return (
                    <text key={d} x={x} y={108} textAnchor="middle" fontSize={7} fill={colors.textMuted}>{d.slice(5)}</text>
                  );
                })}
              </svg>
            </div>

            {/* Tabla top clientes */}
            <div className="rounded-md overflow-hidden" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="px-3 py-2 text-[9px] font-bold" style={{ color: colors.text, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>Top clientes · ranking</div>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>#</th>
                    <th className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Cliente</th>
                    <th className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Sector</th>
                    <th className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Ventas</th>
                    <th className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filtrados].sort((a, b) => Number(b.total_ventas) - Number(a.total_ventas)).map((r, i) => {
                    const pct = totalFiltrado ? (Number(r.total_ventas) / totalFiltrado) * 100 : 0;
                    return (
                      <tr key={String(r.cliente)}>
                        <td className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted }}>{i + 1}</td>
                        <td className="px-3 py-1.5 text-[9px]" style={{ color: colors.text }}>{String(r.cliente)}</td>
                        <td className="px-3 py-1.5"><span className="text-[8px] px-1 py-0.5 rounded-full" style={{ background: `${PALETTE[(sectores.indexOf(String(r.sector)) + 1) % PALETTE.length]}22`, color: colors.textMuted }}>{String(r.sector)}</span></td>
                        <td className="px-3 py-1.5 text-[9px] font-mono" style={{ color: colors.text }}>${fmtMXN(Number(r.total_ventas))}</td>
                        <td className="px-3 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted }}>{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-md p-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-[9px] font-bold mb-2" style={{ color: colors.text }}>Detalle por transacción · stg_ventas</div>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>ID</th>
                  <th className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Fecha</th>
                  <th className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Cliente</th>
                  <th className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Producto</th>
                  <th className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Cant.</th>
                  <th className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>P. unit</th>
                  <th className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(r => (
                  <tr key={String(r.id)}>
                    <td className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted }}>{String(r.id)}</td>
                    <td className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.textMuted }}>{String(r.fecha)}</td>
                    <td className="px-2 py-1.5 text-[9px]" style={{ color: colors.text }}>{String(r.cliente)}</td>
                    <td className="px-2 py-1.5 text-[8px]" style={{ color: colors.textMuted }}>{String(r.producto)}</td>
                    <td className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.text }}>{String(r.cantidad)}</td>
                    <td className="px-2 py-1.5 text-[8px] font-mono" style={{ color: colors.text }}>{fmtMXN(Number(r.precio_unit))}</td>
                    <td className="px-2 py-1.5 text-[8px] font-mono font-bold" style={{ color: colors.primary }}>{fmtMXN(Number(r.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Donut (conic-gradient con agujero central) ───────────────

function Donut({ data, colors }: { data: Array<{ label: string; value: number }>; colors: any }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  let acc = 0;
  const stops = data.map((d, i) => {
    const p0 = (acc / total) * 100;
    acc += d.value;
    const p1 = (acc / total) * 100;
    return `${PALETTE[i % PALETTE.length]} ${p0}% ${p1}%`;
  });
  return (
    <div className="relative shrink-0" style={{ width: 110, height: 110 }}>
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops.join(', ')}` }} />
      <div className="absolute rounded-full" style={{ inset: 26, background: colors.cardBg }} />
    </div>
  );
}