import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface SQLSimProps {
  theme: Theme;
  onBack: () => void;
}

const SAMPLE_TABLES = {
  ventas: {
    columns: ['id', 'fecha', 'cliente_id', 'producto', 'cantidad', 'precio_unitario', 'total'],
    rows: [
      [1, '2026-07-01', 1, 'Flete express', 2, 8500, 17000],
      [2, '2026-07-01', 2, 'Almacenaje', 10, 320, 3200],
      [3, '2026-07-02', 1, 'Carga especializada', 1, 12500, 12500],
      [4, '2026-07-03', 3, 'Flete express', 3, 8500, 25500],
      [5, '2026-07-03', 2, 'Seguro de carga', 5, 250, 1250],
      [6, '2026-07-04', 4, 'Transporte internacional', 1, 28500, 28500],
      [7, '2026-07-05', 1, 'Almacenaje', 20, 320, 6400],
      [8, '2026-07-05', 5, 'Flete express', 4, 8500, 34000],
    ],
  },
  clientes: {
    columns: ['id', 'nombre', 'ciudad', 'sector'],
    rows: [
      [1, 'TechCorp SA', 'CDMX', 'Tecnología'],
      [2, 'Distribuidora Luna', 'Guadalajara', 'Retail'],
      [3, 'Constructora del Norte', 'Monterrey', 'Construcción'],
      [4, 'Comercializadora Valle', 'Puebla', 'Comercio'],
      [5, 'Inversiones Trust', 'CDMX', 'Finanzas'],
    ],
  },
  productos: {
    columns: ['id', 'nombre', 'categoria', 'precio', 'stock'],
    rows: [
      [1, 'Flete express', 'Transporte', 8500, 100],
      [2, 'Almacenaje', 'Almacenamiento', 320, 500],
      [3, 'Carga especializada', 'Transporte', 12500, 50],
      [4, 'Seguro de carga', 'Servicios', 250, 1000],
      [5, 'Transporte internacional', 'Transporte', 28500, 20],
    ],
  },
};

const SQL_TEMPLATES = [
  { name: 'SELECT básico', query: 'SELECT * FROM ventas' },
  { name: 'WHERE', query: "SELECT * FROM ventas WHERE total > 10000" },
  { name: 'GROUP BY', query: 'SELECT producto, SUM(total) as total_ventas\nFROM ventas\nGROUP BY producto' },
  { name: 'JOIN', query: 'SELECT v.fecha, c.nombre, v.total\nFROM ventas v\nJOIN clientes c ON v.cliente_id = c.id' },
  { name: 'ORDER BY', query: 'SELECT * FROM ventas\nORDER BY total DESC\nLIMIT 5' },
  { name: 'COUNT', query: 'SELECT cliente_id, COUNT(*) as num_ventas\nFROM ventas\nGROUP BY cliente_id' },
];

function executeSQL(query: string): { columns: string[]; rows: any[][]; error?: string } {
  try {
    const upperQuery = query.toUpperCase().trim();
    const fromMatch = upperQuery.match(/FROM\s+(\w+)/);
    if (!fromMatch) return { columns: [], rows: [], error: 'Falta-clause FROM' };

    const tableName = fromMatch[1].toLowerCase();
    const table = (SAMPLE_TABLES as any)[tableName];
    if (!table) return { columns: [], rows: [], error: `Tabla "${tableName}" no encontrada` };

    let result = { columns: [...table.columns], rows: [...table.rows] };

    // Simple WHERE
    const whereMatch = query.match(/WHERE\s+(\w+)\s*(=|>|<|>=|<=|!=)\s*'?([^']*)'?/i);
    if (whereMatch) {
      const [, col, op, val] = whereMatch;
      const colIdx = table.columns.indexOf(col.toLowerCase());
      if (colIdx >= 0) {
        result.rows = result.rows.filter(row => {
          const cellVal = row[colIdx];
          const compareVal = isNaN(Number(val)) ? val : Number(cellVal);
          switch (op) {
            case '=': return String(cellVal) === val;
            case '>': return Number(cellVal) > Number(val);
            case '<': return Number(cellVal) < Number(val);
            case '>=': return Number(cellVal) >= Number(val);
            case '<=': return Number(cellVal) <= Number(val);
            case '!=': return String(cellVal) !== val;
            default: return true;
          }
        });
      }
    }

    // Simple LIMIT
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      result.rows = result.rows.slice(0, Number(limitMatch[1]));
    }

    // Simple COUNT
    if (upperQuery.includes('COUNT(*)')) {
      const groupMatch = query.match(/GROUP\s+BY\s+(\w+)/i);
      if (groupMatch) {
        const groupCol = groupMatch[1].toLowerCase();
        const colIdx = table.columns.indexOf(groupCol);
        if (colIdx >= 0) {
          const groups: Record<string, number> = {};
          table.rows.forEach((row: any[]) => { groups[row[colIdx]] = (groups[row[colIdx]] || 0) + 1; });
          result = { columns: [groupCol, 'count'], rows: Object.entries(groups) };
        }
      } else {
        result = { columns: ['count'], rows: [[table.rows.length]] };
      }
    }

    // Simple SUM with GROUP BY
    const sumMatch = upperQuery.match(/SUM\s*\(\s*(\w+)\s*\)/i);
    if (sumMatch && upperQuery.includes('GROUP BY')) {
      const sumCol = sumMatch[1].toLowerCase();
      const groupMatch = query.match(/GROUP\s+BY\s+(\w+)/i);
      if (groupMatch) {
        const groupCol = groupMatch[1].toLowerCase();
        const groupIdx = table.columns.indexOf(groupCol);
        const sumIdx = table.columns.indexOf(sumCol);
        if (groupIdx >= 0 && sumIdx >= 0) {
          const groups: Record<string, number> = {};
          table.rows.forEach((row: any[]) => { groups[row[groupIdx]] = (groups[row[groupIdx]] || 0) + Number(row[sumIdx]); });
          result = { columns: [groupCol, `sum_${sumCol}`], rows: Object.entries(groups) };
        }
      }
    }

    return result;
  } catch (e: any) {
    return { columns: [], rows: [], error: e.message };
  }
}

export default function SQLSim({ theme, onBack }: SQLSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('SELECT * FROM ventas WHERE total > 10000');
  const [result, setResult] = useState<{ columns: string[]; rows: any[][]; error?: string } | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);

  function runQuery() {
    const res = executeSQL(query);
    setResult(res);
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🗃️</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Editor SQL</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: colors.textMuted }}>Entorno de prueba</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Tables */}
        <div className="w-44 shrink-0 border-r-2 overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>Tablas</span>
          </div>
          {Object.keys(SAMPLE_TABLES).map(tableName => (
            <button key={tableName} onClick={() => setActiveTable(tableName)}
              className="w-full text-left px-3 py-2 text-[11px] font-mono cursor-pointer hover:opacity-80 transition border-b"
              style={{ borderColor: colors.border + '30', background: tableName === activeTable ? colors.primary + '15' : 'transparent', color: tableName === activeTable ? colors.primary : colors.text }}>
              📋 {tableName}
            </button>
          ))}
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>Plantillas</span>
          </div>
          {SQL_TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => setQuery(t.query)}
              className="w-full text-left px-3 py-2 text-[10px] cursor-pointer hover:opacity-80 transition border-b"
              style={{ borderColor: colors.border + '30', color: colors.textMuted }}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {/* Table preview */}
          {activeTable && (
            <div className="border-b-2 overflow-auto max-h-40" style={{ borderColor: colors.border }}>
              <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: colors.cardBg }}>
                <span className="text-[10px] font-bold font-mono" style={{ color: colors.text }}>📋 {activeTable}</span>
                <button onClick={() => setActiveTable(null)} className="text-[10px] cursor-pointer" style={{ color: colors.textMuted }}>✕</button>
              </div>
              <table className="w-full text-[9px] font-mono">
                <thead>
                  <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                    {(SAMPLE_TABLES as any)[activeTable].columns.map((col: string) => (
                      <th key={col} className="px-2 py-1 text-left" style={{ color: colors.textMuted }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(SAMPLE_TABLES as any)[activeTable].rows.slice(0, 5).map((row: any[], i: number) => (
                    <tr key={i} className="border-b" style={{ borderColor: colors.border + '30' }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1" style={{ color: colors.text }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SQL Editor */}
          <div className="border-b-2" style={{ borderColor: colors.border }}>
            <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: colors.cardBg }}>
              <span className="text-[10px] font-bold" style={{ color: colors.text }}>📝 Editor SQL</span>
              <div className="flex-1" />
              <button onClick={runQuery} className="text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer"
                style={{ background: '#22c55e', color: '#fff' }}>▶ Ejecutar</button>
            </div>
            <textarea value={query} onChange={e => setQuery(e.target.value)}
              className="w-full h-32 p-3 font-mono text-[11px] outline-none resize-none"
              style={{ background: isDark ? '#0a0f1a' : '#1e293b', color: '#e2e8f0', border: 'none' }}
              placeholder="Escribe tu consulta SQL aquí..." />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto">
            {result && (
              <div className="p-3">
                {result.error ? (
                  <div className="p-3 rounded-lg text-[11px] font-mono" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
                    ❌ Error: {result.error}
                  </div>
                ) : (
                  <>
                    <div className="text-[9px] font-mono mb-2" style={{ color: colors.textMuted }}>
                      {result.rows.length} fila{result.rows.length !== 1 ? 's' : ''} devuelta{result.rows.length !== 1 ? 's' : ''}
                    </div>
                    <table className="w-full text-[10px] font-mono border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
                      <thead>
                        <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                          {result.columns.map(col => (
                            <th key={col} className="px-3 py-2 text-left" style={{ color: colors.textMuted }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i} className="border-b" style={{ borderColor: colors.border + '30' }}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-1.5" style={{ color: colors.text }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
