import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';
import { SOURCES, MODELS } from './DBTSim';

interface CatalogSimProps { theme: Theme; onBack: () => void; }

interface CatalogDataset {
  name: string;
  type: 'source' | 'model' | 'fact' | 'dim';
  domain: 'Bronze' | 'Silver' | 'Gold';
  description: string;
  owner: string;
  rows: number;
  updatedAt: string;
  quality: number;
  completeness: number;
  validity: number;
  tags: string[];
  certified: boolean;
}

const CATALOG: CatalogDataset[] = [
  { name: 'raw_ventas', type: 'source', domain: 'Bronze', description: 'Registros crudos de ventas del ERP, ingestados por API cada hora.', owner: 'Ing. Sandra Mora', updatedAt: 'hace 1h', rows: 8, quality: 88, completeness: 95, validity: 81, tags: ['ERP', 'ventas', 'ingesta'], certified: false },
  { name: 'raw_clientes', type: 'source', domain: 'Bronze', description: 'Catálogo de clientes sincronizado desde el CRM de ventas.', owner: 'Ing. Sandra Mora', updatedAt: 'hace 2h', rows: 5, quality: 96, completeness: 98, validity: 94, tags: ['CRM', 'clientes', 'catalogo'], certified: true },
  { name: 'stg_ventas', type: 'model', domain: 'Silver', description: 'Staging dbt: limpia raw_ventas y calcula el total por línea.', owner: 'Tu (Ing. Datos Jr)', updatedAt: 'hace 1h', rows: 8, quality: 92, completeness: 98, validity: 86, tags: ['staging', 'dbt', 'ventas'], certified: true },
  { name: 'stg_clientes', type: 'model', domain: 'Silver', description: 'Staging dbt: catálogo de clientes normalizado.', owner: 'Tu (Ing. Datos Jr)', updatedAt: 'hace 1h', rows: 5, quality: 94, completeness: 100, validity: 88, tags: ['staging', 'dbt', 'clientes'], certified: true },
  { name: 'int_ventas_cliente', type: 'model', domain: 'Silver', description: 'Modelo intermedio: JOIN ventas-clientes usando ref().', owner: 'Tu (Ing. Datos Jr)', updatedAt: 'hace 45m', rows: 8, quality: 85, completeness: 92, validity: 78, tags: ['intermediate', 'join', 'dbt'], certified: false },
  { name: 'mrt_ventas_por_cliente', type: 'model', domain: 'Gold', description: 'Mart de ventas por cliente. Fuente oficial para reportes ejecutivos.', owner: 'Ing. Sandra Mora', updatedAt: 'hace 30m', rows: 5, quality: 97, completeness: 99, validity: 95, tags: ['mart', 'gold', 'reporte', 'sla'], certified: true },
  { name: 'fact_cobranza', type: 'fact', domain: 'Gold', description: 'Hechos de cobranza: pagos aplicados por factura.', owner: 'Dirección de Finanzas', updatedAt: 'hace 3h', rows: 12, quality: 72, completeness: 80, validity: 62, tags: ['fact', 'cobranza', 'pagos'], certified: false },
  { name: 'dim_productos', type: 'dim', domain: 'Silver', description: 'Dimensión de productos y servicios de logística.', owner: 'Ing. Sandra Mora', updatedAt: 'hace 1d', rows: 8, quality: 90, completeness: 98, validity: 82, tags: ['dimension', 'productos'], certified: false },
  { name: 'dim_fechas', type: 'dim', domain: 'Silver', description: 'Dimensión de calendario para segmentar series de tiempo.', owner: 'Ing. Sandra Herr', updatedAt: 'hace 3d', rows: 365, quality: 95, completeness: 100, validity: 90, tags: ['dimension', 'calendario'], certified: false },
  { name: 'mrt_resumen_diario', type: 'model', domain: 'Gold', description: 'Mart diario de ingresos por sucursal (en desarrollo).', owner: 'Tu (Ing. Datos Jr)', updatedAt: 'hace 4h', rows: 6, quality: 64, completeness: 70, validity: 55, tags: ['mart', 'alpha', 'en desarrollo'], certified: false },
];

function refsOf(model: (typeof MODELS)[number]): string[] {
  return [...model.sql.matchAll(/\{\{\s*ref\('([^']+)'\)\s*\}\}/g)].map(m => m[1]);
}

function buildLineage(): { up: Record<string, string[]>; down: Record<string, string[]> } {
  const up: Record<string, string[]> = {};
  const down: Record<string, string[]> = {};
  for (const m of MODELS) {
    up[m.name] = refsOf(m);
    for (const d of up[m.name]) { (down[d] = down[d] || []).push(m.name); }
  }
  return { up, down };
}

function qualityColor(q: number): string { return q >= 90 ? '#22c55e' : q >= 75 ? '#f59e0b' : '#ef4444'; }

const DOMAIN_COLORS: Record<string, string> = { Bronze: '#f59e0b', Silver: '#94a3b8', Gold: '#eab308' };
const TYPE_ICON: Record<string, string> = { source: '🗄️', fact: '📊', dim: '🥫', model: '📐' };

export default function CatalogSim({ theme, onBack }: CatalogSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<'Todos' | 'Bronze' | 'Silver' | 'Gold'>('Todos');
  const [onlyCertified, setOnlyCertified] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [selected, setSelected] = useState<string>(CATALOG[3].name);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set(['raw_clientes']));

  const lin = buildLineage();
  const selectedDs = CATALOG.find(d => d.name === selected) || CATALOG[0];

  function toggleBookmark(name: string) {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  const filtered = CATALOG.filter(d => {
    if (domain !== 'Todos' && d.domain !== domain) return false;
    if (onlyCertified && !d.certified) return false;
    if (onlyMine && !d.owner.includes('Datos Jr')) return false;
    if (onlyBookmarks && !bookmarks.has(d.name)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [d.name, d.description, d.owner, d.tags.join(' '), d.type].join(' ').toLowerCase().includes(q);
  });

  const avgQuality = Math.round(CATALOG.reduce((a, d) => a + d.quality, 0) / CATALOG.length);
  const certifiedCount = CATALOG.filter(d => d.certified).length;
  const rowsTotal = CATALOG.reduce((a, d) => a + d.rows, 0).toLocaleString('es-MX');

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📚</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Data Catalog</span>
        <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: '#a855f720', color: '#a855f7' }}>Descubrimiento</span>
        <div className="flex-1" />
        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>{CATALOG.length} datasets · {rowsTotal} rows · {avgQuality}% cal. media · {certifiedCount} certificados</span>
      </div>

      {/* Búsqueda y filtros */}
      <div className="px-4 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="🔍 Buscar datasets, owners, tags..."
          className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-mono outline-none"
          style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }} />
        <div className="flex items-center gap-1.5 text-[9px] font-mono">
          {(['Todos', 'Bronze', 'Silver', 'Gold'] as const).map(di => (
            <button key={di} onClick={() => setDomain(di)}
              className="px-2 py-1 rounded-lg cursor-pointer font-bold transition"
              style={{ background: domain === di ? colors.primary : colors.bg, color: domain === di ? '#1B2632' : colors.textMuted, border: `1px solid ${domain === di ? colors.primary : colors.border}` }}>
              {di}
            </button>
          ))}
          <button onClick={() => setOnlyCertified(!onlyCertified)}
            className="px-2 py-1 rounded-lg cursor-pointer font-bold transition"
            style={{ background: onlyCertified ? '#eab308' : colors.bg, color: onlyCertified ? '#1B2632' : colors.textMuted, border: `1px solid ${onlyCertified ? '#eab308' : colors.border}` }}>
            ⭐ Certificados
          </button>
          <button onClick={() => setOnlyMine(!onlyMine)}
            className="px-2 py-1 rounded-lg cursor-pointer font-bold transition"
            style={{ background: onlyMine ? '#3b82f6' : colors.bg, color: onlyMine ? '#fff' : colors.textMuted, border: `1px solid ${onlyMine ? '#3b82f6' : colors.border}` }}>
            👤 Míos
          </button>
          <button onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            className="px-2 py-1 rounded-lg cursor-pointer font-bold transition"
            style={{ background: onlyBookmarks ? '#22c55e' : colors.bg, color: onlyBookmarks ? '#1B2632' : colors.textMuted, border: `1px solid ${onlyBookmarks ? '#22c55e' : colors.border}` }}>
            ★ Favoritos ({bookmarks.size})
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Grid de datasets */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            {filtered.map(d => (
              <div key={d.name} onClick={() => setSelected(d.name)}
                className="rounded-xl border-2 p-3 cursor-pointer transition hover:opacity-85"
                style={{ borderColor: selectedDs.name === d.name ? '#a855f7' : colors.border, background: colors.cardBg }}>
                <div className="flex items-center justify-between mb-1.5 gap-1">
                  <span className="text-[11px] font-bold font-mono truncate" style={{ color: colors.text }}>
                    {TYPE_ICON[d.type]} {d.name}
                  </span>
                  <button onClick={e => { e.stopPropagation(); toggleBookmark(d.name); }}
                    className="text-[11px] cursor-pointer shrink-0" style={{ color: bookmarks.has(d.name) ? '#eab308' : colors.textMuted }}>
                    {bookmarks.has(d.name) ? '★' : '☆'}
                  </button>
                </div>
                <p className="text-[9px] leading-snug mb-2 line-clamp-2" style={{ color: colors.textMuted }}>{d.description}</p>
                <div className="flex items-center gap-1 flex-wrap mb-1.5">
                  <span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{ background: DOMAIN_COLORS[d.domain] + '25', color: DOMAIN_COLORS[d.domain] }}>{d.domain}</span>
                  {d.certified && <span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#eab30825', color: '#eab308' }}>✓ certificado</span>}
                  {d.quality < 75 && <span className="text-[7px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#ef444410', color: '#ef4444' }}>⚠ baja calidad</span>}
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono" style={{ color: colors.textMuted }}>
                  <span>{d.rows.toLocaleString('es-MX')} rows</span>
                  <span>{d.updatedAt}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex-1 h-1 rounded-full" style={{ background: colors.bg }}>
                    <div className="h-full rounded-full" style={{ width: `${d.quality}%`, background: qualityColor(d.quality) }} />
                  </div>
                  <span className="text-[8px] font-bold" style={{ color: qualityColor(d.quality) }}>{d.quality}%</span>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: colors.textMuted }}>
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-xs">Sin resultados para "{query}"</div>
            </div>
          )}
        </div>

        {/* Panel de detalle */}
        <div className="w-72 shrink-0 border-l-2 overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
            <span className="text-[11px] font-bold font-mono" style={{ color: colors.text }}>{TYPE_ICON[selectedDs.type]} {selectedDs.name}</span>
            <button onClick={() => toggleBookmark(selectedDs.name)} className="text-[13px] cursor-pointer" style={{ color: bookmarks.has(selectedDs.name) ? '#eab308' : colors.textMuted }}>
              {bookmarks.has(selectedDs.name) ? '★' : '☆'}
            </button>
          </div>

          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { label: 'Calidad', value: `${selectedDs.quality}%`, color: qualityColor(selectedDs.quality) },
                { label: 'Completitud', value: `${selectedDs.completeness}%`, color: '#3b82f6' },
                { label: 'Validez', value: `${selectedDs.validity}%`, color: '#a855f7' },
              ].map(mm => (
                <div key={mm.label} className="rounded-lg border p-1.5 text-center" style={{ borderColor: colors.border, background: colors.bg }}>
                  <div className="text-[11px] font-bold" style={{ color: mm.color }}>{mm.value}</div>
                  <div className="text-[7px] font-mono mt-0.5" style={{ color: colors.textMuted }}>{mm.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: DOMAIN_COLORS[selectedDs.domain] + '25', color: DOMAIN_COLORS[selectedDs.domain] }}>{selectedDs.domain}</span>
              {selectedDs.certified && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#eab30825', color: '#eab308' }}>✓ certificado</span>}
              {selectedDs.quality < 75 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#ef444410', color: '#ef4444' }}>⚠</span>}
            </div>
            <div className="text-[8px] font-mono space-y-0.5" style={{ color: colors.textMuted }}>
              <div>👤 {selectedDs.owner}</div>
              <div>🕒 Actualizado {selectedDs.updatedAt}</div>
              <div>📦 {selectedDs.rows.toLocaleString('es-MX')} rows</div>
              <div>🏷️ {selectedDs.tags.map(t => '#' + t).join(' ')}</div>
            </div>
          </div>

          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>🧬 LINEAGE</div>
            <div className="text-[9px] font-mono space-y-1">
              {(lin.up[selectedDs.name] || []).map(u => (
                <div key={u} className="flex items-center gap-1" style={{ color: '#3b82f6' }}>
                  <span className="text-[8px]">↑</span> {u}
                </div>
              ))}
              {(lin.down[selectedDs.name] || []).map(dd => (
                <div key={dd} className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                  <span className="text-[8px]">↓</span> {dd}
                </div>
              ))}
              {!lin.up[selectedDs.name] && !lin.down[selectedDs.name] && (
                <div style={{ color: colors.textMuted }}>Sin refs de dbt (externo)</div>
              )}
              {!lin.up[selectedDs.name] && lin.down[selectedDs.name] && (
                <div className="text-[8px]" style={{ color: colors.textMuted }}>origina de un source</div>
              )}
            </div>
          </div>

          <div className="p-3">
            <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>⚙️ PROPIEDADES</div>
            <div className="text-[8px] font-mono space-y-0.5" style={{ color: colors.textMuted }}>
              <div>db: warehouse_dev</div>
              <div>path: datasets/{selectedDs.name}</div>
              <div>tier: {selectedDs.domain.toLowerCase()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>Data Catalog · DataFlow Analytics · motor: warehouse_dev</span>
        <span style={{ color: colors.textMuted }}>{filtered.length}/{CATALOG.length} datasets visibles</span>
      </div>
    </div>
  );
}