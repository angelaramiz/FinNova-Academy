import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface SQLSimProps { theme: Theme; onBack: () => void; }

// ─── Base de datos en memoria ─────────────────────────────────
const DATABASE: Record<string, { columns: string[]; rows: any[][] }> = {
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
      [9, '2026-07-06', 2, 'Carga especializada', 1, 12500, 12500],
      [10, '2026-07-07', 3, 'Transporte internacional', 1, 28500, 28500],
      [11, '2026-07-08', 4, 'Consolidación', 5, 1800, 9000],
      [12, '2026-07-09', 5, 'Flete express', 3, 8500, 25500],
      [13, '2026-07-10', 1, 'Distribución local', 2, 4500, 9000],
      [14, '2026-07-12', 2, 'Cross-docking', 1, 6500, 6500],
      [15, '2026-07-15', 3, 'Flete express', 1, 8500, 8500],
    ],
  },
  clientes: {
    columns: ['id', 'nombre', 'rfc', 'ciudad', 'sector', 'credit_limit'],
    rows: [
      [1, 'TechCorp SA', 'TCS-990101-ABC', 'CDMX', 'Tecnología', 500000],
      [2, 'Distribuidora Luna', 'DLU-880202-DEF', 'Guadalajara', 'Retail', 300000],
      [3, 'Constructora Norte', 'CNO-770303-GHI', 'Monterrey', 'Construcción', 200000],
      [4, 'Comercial Valle', 'CVA-660404-JKL', 'Puebla', 'Comercio', 750000],
      [5, 'Inversiones Trust', 'ITR-550505-MNO', 'CDMX', 'Finanzas', 1000000],
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
      [6, 'Consolidación', 'Almacenamiento', 1800, 200],
      [7, 'Distribución local', 'Transporte', 4500, 80],
      [8, 'Cross-docking', 'Almacenamiento', 6500, 30],
    ],
  },
};

// ─── Motor SQL en memoria ─────────────────────────────────────

interface SQLResult { columns: string[]; rows: any[][]; error?: string; rowCount?: number; executionTime?: number; }

function executeSQL(query: string): SQLResult {
  const startTime = performance.now();
  try {
    const trimmed = query.trim().replace(/;$/, '');
    if (!trimmed) return { columns: [], rows: [], error: 'Query vacío' };

    const upper = trimmed.toUpperCase();

    // ─── SELECT ──────────────────────────────────────────────
    if (upper.startsWith('SELECT')) {
      // Parse: SELECT cols FROM table [JOIN ...] [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT n]
      const selectMatch = trimmed.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(.*)/is);
      if (!selectMatch) return { columns: [], rows: [], error: 'Sintaxis: SELECT cols FROM tabla' };

      const selectClause = selectMatch[1].trim();
      const tableName = selectMatch[2].toLowerCase();
      const restClause = selectMatch[3] || '';

      let workingRows: any[][] = [];
      let workingColumns: string[] = [];
      const tableMap: Record<string, { columns: string[]; rows: any[][]; alias?: string }> = {};

      // Cargar tabla principal
      const mainTable = DATABASE[tableName];
      if (!mainTable) return { columns: [], rows: [], error: `Tabla "${tableName}" no existe` };
      workingColumns = [...mainTable.columns];
      workingRows = mainTable.rows.map(r => [...r]);
      tableMap[tableName] = { columns: [...mainTable.columns], rows: mainTable.rows.map(r => [...r]) };

      // ─── JOIN ──────────────────────────────────────────────
      const joinMatches = [...restClause.matchAll(/JOIN\s+(\w+)\s+(?:AS\s+)?(\w+)?\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi)];
      for (const jm of joinMatches) {
        const joinTableName = jm[1].toLowerCase();
        const joinAlias = (jm[2] || joinTableName).toLowerCase();
        const leftTable = jm[3].toLowerCase();
        const leftCol = jm[4].toLowerCase();
        const rightTable = jm[5].toLowerCase();
        const rightCol = jm[6].toLowerCase();
        const joinTable = DATABASE[joinTableName];
        if (!joinTable) return { columns: [], rows: [], error: `Tabla "${joinTableName}" no existe` };

        const leftTableData = tableMap[leftTable];
        const rightTableData = { columns: joinTable.columns, rows: joinTable.rows.map(r => [...r]) };
        tableMap[joinAlias] = rightTableData;

        // Realizar JOIN
        const newColumns = [...workingColumns, ...rightTableData.columns.map(c => `${joinAlias}.${c}`)];
        const newRows: any[][] = [];
        const leftColIdx = leftTableData.columns.indexOf(leftCol);
        const rightColIdx = rightTableData.columns.indexOf(rightCol);

        if (leftColIdx < 0 || rightColIdx < 0) return { columns: [], rows: [], error: `Columna de JOIN no encontrada` };

        for (const leftRow of workingRows) {
          for (const rightRow of rightTableData.rows) {
            if (leftRow[leftColIdx] === rightRow[rightColIdx]) {
              newRows.push([...leftRow, ...rightRow]);
            }
          }
        }
        workingColumns = newColumns;
        workingRows = newRows;
      }

      // ─── WHERE ─────────────────────────────────────────────
      const whereMatch = restClause.match(/WHERE\s+(.+?)(?:\s+(?:GROUP|ORDER|LIMIT)|$)/is);
      if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        // Resolver nombres de columna con alias
        const resolvedWhere = whereClause.replace(/(\w+)\.(\w+)/g, (match, table, col) => {
          const td = tableMap[table.toLowerCase()];
          if (!td) return match;
          const idx = td.columns.indexOf(col.toLowerCase());
          if (idx < 0) return match;
          // Encontrar el índice en workingColumns
          const fullColName = `${table.toLowerCase()}.${col.toLowerCase()}`;
          const workingIdx = workingColumns.indexOf(fullColName);
          if (workingIdx >= 0) return `col_${workingIdx}`;
          return match;
        });
        workingRows = workingRows.filter(row => evaluateWhere(resolvedWhere, row, workingColumns));
      }

      // ─── GROUP BY + Agregaciones ──────────────────────────
      const groupMatch = restClause.match(/GROUP\s+BY\s+(.+?)(?:\s+(?:ORDER|LIMIT|HAVING)|$)/is);
      const hasAggregate = /COUNT|SUM|AVG|MIN|MAX/i.test(selectClause);

      if (groupMatch || hasAggregate) {
        const groupCols = groupMatch ? groupMatch[1].split(',').map(s => s.trim().toLowerCase()) : [];

        // Parsear columnas del SELECT
        const selectParts = selectClause.split(',').map(s => s.trim());
        const aggColumns: string[] = [];
        const aggFunctions: { func: string; col: string; alias: string }[] = [];

        for (const part of selectParts) {
          const aggMatch = part.match(/(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|\w+)\s*\)\s*(?:AS\s+)?(\w+)?/i);
          if (aggMatch) {
            aggFunctions.push({ func: aggMatch[1].toUpperCase(), col: aggMatch[2], alias: (aggMatch[3] || `${aggMatch[1].toLowerCase()}_${aggMatch[2]}`).toLowerCase() });
          } else {
            aggColumns.push(part.toLowerCase());
          }
        }

        if (groupMatch) {
          // Agrupar rows
          const groups: Record<string, any[][]> = {};
          for (const row of workingRows) {
            const groupKey = groupCols.map(gc => {
              const gcIdx = workingColumns.indexOf(gc);
              return gcIdx >= 0 ? row[gcIdx] : gc;
            }).join('||');
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
          }

          const resultColumns: string[] = [];
          const resultRows: any[][] = [];

          // Determinar columnas resultado
          for (const gc of groupCols) {
            const gcIdx = workingColumns.indexOf(gc);
            resultColumns.push(gc.includes('.') ? gc.split('.')[1] : gc);
          }
          for (const af of aggFunctions) {
            resultColumns.push(af.alias);
          }

          // Generar rows agrupados
          for (const [key, rows] of Object.entries(groups)) {
            const resultRow: any[] = [];
            for (const gc of groupCols) {
              const gcIdx = workingColumns.indexOf(gc);
              resultRow.push(gcIdx >= 0 ? rows[0][gcIdx] : gc);
            }
            for (const af of aggFunctions) {
              if (af.func === 'COUNT') {
                resultRow.push(af.col === '*' ? rows.length : rows.filter(r => r[workingColumns.indexOf(af.col.toLowerCase())] != null).length);
              } else {
                const colIdx = workingColumns.indexOf(af.col.toLowerCase());
                const values = colIdx >= 0 ? rows.map(r => Number(r[colIdx])).filter(v => !isNaN(v)) : [];
                if (af.func === 'SUM') resultRow.push(values.reduce((s, v) => s + v, 0));
                else if (af.func === 'AVG') resultRow.push(values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length * 100) / 100 : 0);
                else if (af.func === 'MIN') resultRow.push(values.length ? Math.min(...values) : 0);
                else if (af.func === 'MAX') resultRow.push(values.length ? Math.max(...values) : 0);
              }
            }
            resultRows.push(resultRow);
          }
          workingColumns = resultColumns;
          workingRows = resultRows;
        } else if (hasAggregate) {
          // Agregación sin GROUP BY (una sola fila)
          const resultColumns: string[] = [];
          const resultRow: any[] = [];
          for (const af of aggFunctions) {
            resultColumns.push(af.alias);
            if (af.func === 'COUNT') {
              resultRow.push(af.col === '*' ? workingRows.length : workingRows.filter(r => r[workingColumns.indexOf(af.col.toLowerCase())] != null).length);
            } else {
              const colIdx = workingColumns.indexOf(af.col.toLowerCase());
              const values = colIdx >= 0 ? workingRows.map(r => Number(r[colIdx])).filter(v => !isNaN(v)) : [];
              if (af.func === 'SUM') resultRow.push(values.reduce((s, v) => s + v, 0));
              else if (af.func === 'AVG') resultRow.push(values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length * 100) / 100 : 0);
              else if (af.func === 'MIN') resultRow.push(values.length ? Math.min(...values) : 0);
              else if (af.func === 'MAX') resultRow.push(values.length ? Math.max(...values) : 0);
            }
          }
          workingColumns = resultColumns;
          workingRows = [resultRow];
        }
      } else {
        // ─── SELECT con columnas específicas ─────────────────
        if (selectClause.trim() !== '*') {
          const selectParts = selectClause.split(',').map(s => s.trim());
          const colIndices: number[] = [];
          const resultColNames: string[] = [];

          for (const part of selectParts) {
            // manejar alias: columna AS alias
            const aliasMatch = part.match(/^(\w+)\s+AS\s+(\w+)$/i);
            const colName = (aliasMatch ? aliasMatch[1] : part).toLowerCase();
            const alias = aliasMatch ? aliasMatch[2] : part;

            // Buscar en workingColumns (puede tener prefijo de tabla)
            let idx = workingColumns.indexOf(colName);
            if (idx < 0) {
              // Buscar con prefijo
              idx = workingColumns.findIndex(c => c.endsWith('.' + colName));
            }
            if (idx >= 0) {
              colIndices.push(idx);
              resultColNames.push(alias.includes('.') ? alias.split('.')[1] : alias);
            }
          }

          if (colIndices.length > 0) {
            workingColumns = resultColNames;
            workingRows = workingRows.map(row => colIndices.map(i => row[i]));
          }
        }
      }

      // ─── ORDER BY ─────────────────────────────────────────
      const orderMatch = restClause.match(/ORDER\s+BY\s+(\w+)(\s+(ASC|DESC))?/i);
      if (orderMatch) {
        const orderCol = orderMatch[1].toLowerCase();
        const orderDir = (orderMatch[3] || 'ASC').toUpperCase();
        const orderIdx = workingColumns.indexOf(orderCol);
        if (orderIdx >= 0) {
          workingRows.sort((a, b) => {
            const va = a[orderIdx], vb = b[orderIdx];
            if (typeof va === 'number' && typeof vb === 'number') {
              return orderDir === 'ASC' ? va - vb : vb - va;
            }
            return orderDir === 'ASC' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
          });
        }
      }

      // ─── LIMIT ────────────────────────────────────────────
      const limitMatch = restClause.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        workingRows = workingRows.slice(0, Number(limitMatch[1]));
      }

      const executionTime = (performance.now() - startTime).toFixed(2);
      return { columns: workingColumns, rows: workingRows, rowCount: workingRows.length, executionTime: Number(executionTime) };
    }

    // ─── INSERT ─────────────────────────────────────────────
    if (upper.startsWith('INSERT')) {
      const insertMatch = trimmed.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (!insertMatch) return { columns: [], rows: [], error: 'Sintaxis: INSERT INTO tabla (cols) VALUES (vals)' };
      const tableName = insertMatch[1].toLowerCase();
      const table = DATABASE[tableName];
      if (!table) return { columns: [], rows: [], error: `Tabla "${tableName}" no existe` };
      const cols = insertMatch[2].split(',').map(s => s.trim());
      const vals = insertMatch[3].split(',').map(s => {
        const v = s.trim().replace(/^'|'$/g, '');
        return isNaN(Number(v)) ? v : Number(v);
      });
      const newRow = new Array(table.columns.length).fill(null);
      cols.forEach((c, i) => {
        const colIdx = table.columns.indexOf(c.toLowerCase());
        if (colIdx >= 0) newRow[colIdx] = vals[i];
      });
      table.rows.push(newRow);
      return { columns: [], rows: [], rowCount: 1, executionTime: Number((performance.now() - startTime).toFixed(2)) };
    }

    // ─── UPDATE ─────────────────────────────────────────────
    if (upper.startsWith('UPDATE')) {
      const updateMatch = trimmed.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/is);
      if (!updateMatch) return { columns: [], rows: [], error: 'Sintaxis: UPDATE tabla SET col=val WHERE ...' };
      const tableName = updateMatch[1].toLowerCase();
      const table = DATABASE[tableName];
      if (!table) return { columns: [], rows: [], error: `Tabla "${tableName}" no existe` };
      const setClause = updateMatch[2].trim();
      const whereClause = updateMatch[3];
      const setParts = setClause.split(',').map(s => {
        const m = s.match(/(\w+)\s*=\s*(.+)/);
        return m ? { col: m[1].toLowerCase(), val: m[2].trim().replace(/^'|'$/g, '') } : null;
      }).filter(Boolean) as { col: string; val: string }[];

      let affected = 0;
      table.rows = table.rows.map(row => {
        if (!whereClause || evaluateWhere(whereClause, row, table.columns)) {
          for (const sp of setParts) {
            const idx = table.columns.indexOf(sp.col);
            if (idx >= 0) {
              const val = isNaN(Number(sp.val)) ? sp.val : Number(sp.val);
              row[idx] = val;
            }
          }
          affected++;
        }
        return row;
      });
      return { columns: [], rows: [], rowCount: affected, executionTime: Number((performance.now() - startTime).toFixed(2)) };
    }

    // ─── DELETE ─────────────────────────────────────────────
    if (upper.startsWith('DELETE')) {
      const deleteMatch = trimmed.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/is);
      if (!deleteMatch) return { columns: [], rows: [], error: 'Sintaxis: DELETE FROM tabla WHERE ...' };
      const tableName = deleteMatch[1].toLowerCase();
      const table = DATABASE[tableName];
      if (!table) return { columns: [], rows: [], error: `Tabla "${tableName}" no existe` };
      const whereClause = deleteMatch[2];
      let affected = 0;
      if (!whereClause) {
        affected = table.rows.length;
        table.rows = [];
      } else {
        const before = table.rows.length;
        table.rows = table.rows.filter(row => !evaluateWhere(whereClause, row, table.columns));
        affected = before - table.rows.length;
      }
      return { columns: [], rows: [], rowCount: affected, executionTime: Number((performance.now() - startTime).toFixed(2)) };
    }

    // ─── CREATE TABLE ───────────────────────────────────────
    if (upper.startsWith('CREATE')) {
      return { columns: [], rows: [], error: 'CREATE TABLE no soportado en este simulador' };
    }

    return { columns: [], rows: [], error: 'Comando no reconocido. Soportados: SELECT, INSERT, UPDATE, DELETE' };
  } catch (e: any) {
    return { columns: [], rows: [], error: e.message || 'Error al ejecutar query' };
  }
}

function evaluateWhere(whereClause: string, row: any[], columns: string[]): boolean {
  // Resolver AND/OR
  const conditions = whereClause.split(/\s+AND\s+/i).map(c => c.trim());
  return conditions.every(cond => {
    // Resolver OR dentro de cada condición AND
    const orConditions = cond.split(/\s+OR\s+/i).map(c => c.trim());
    return orConditions.some(orCond => {
      // Comparaciones: col op val
      const match = orCond.match(/(\w+)\s*(=|!=|<>|>=|<=|>|<|LIKE)\s*'?([^']*)'?/i);
      if (!match) return true;
      const [, col, op, val] = match;
      const colIdx = columns.indexOf(col.toLowerCase());
      if (colIdx < 0) return true;
      const cellVal = row[colIdx];
      const compareVal = val.replace(/^'|'$/g, '');

      switch (op.toUpperCase()) {
        case '=': return String(cellVal) === compareVal || Number(cellVal) === Number(compareVal);
        case '!=': case '<>': return String(cellVal) !== compareVal && Number(cellVal) !== Number(compareVal);
        case '>': return Number(cellVal) > Number(compareVal);
        case '<': return Number(cellVal) < Number(compareVal);
        case '>=': return Number(cellVal) >= Number(compareVal);
        case '<=': return Number(cellVal) <= Number(compareVal);
        case 'LIKE': return String(cellVal).includes(compareVal.replace(/%/g, ''));
        default: return true;
      }
    });
  });
}

// ─── Templates ───────────────────────────────────────────────

const SQL_TEMPLATES = [
  { name: 'SELECT *', query: 'SELECT * FROM ventas' },
  { name: 'SELECT columnas', query: 'SELECT nombre, ciudad FROM clientes' },
  { name: 'WHERE', query: 'SELECT * FROM ventas WHERE total > 10000' },
  { name: 'JOIN', query: 'SELECT ventas.fecha, clientes.nombre, ventas.total\nFROM ventas\nJOIN clientes ON ventas.cliente_id = clientes.id' },
  { name: 'GROUP BY + SUM', query: 'SELECT producto, SUM(total) as suma_total\nFROM ventas\nGROUP BY producto' },
  { name: 'ORDER BY DESC', query: 'SELECT nombre, total FROM ventas\nORDER BY total DESC\nLIMIT 5' },
  { name: 'COUNT + GROUP BY', query: 'SELECT cliente_id, COUNT(*) as num_ventas\nFROM ventas\nGROUP BY cliente_id' },
  { name: 'AVG', query: 'SELECT producto, AVG(total) as promedio\nFROM ventas\nGROUP BY producto' },
  { name: 'INSERT', query: "INSERT INTO clientes (id, nombre, rfc, ciudad, sector, credit_limit)\nVALUES (6, 'Nuevo Cliente', 'NUE-010101-PQR', 'Querétaro', 'Retail', 250000)" },
  { name: 'UPDATE', query: 'UPDATE productos SET stock = stock - 10 WHERE categoria = \'Transporte\'' },
  { name: 'DELETE', query: "DELETE FROM ventas WHERE total < 5000" },
];

export default function SQLSim({ theme, onBack }: SQLSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('SELECT * FROM ventas WHERE total > 10000');
  const [result, setResult] = useState<SQLResult | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  function runQuery() {
    setResult(executeSQL(query));
    setHistory(prev => [query, ...prev.slice(0, 9)]);
  }

  function formatCell(val: any): string {
    if (val === null) return 'NULL';
    if (typeof val === 'number') return val.toLocaleString('es-MX');
    return String(val);
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🗃️</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Editor SQL</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: colors.textMuted }}>{Object.keys(DATABASE).length} tablas · 3 aojas</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r-2 overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>📊 Tablas</span>
          </div>
          {Object.entries(DATABASE).map(([tableName, table]) => (
            <button key={tableName} onClick={() => setActiveTable(tableName === activeTable ? null : tableName)}
              className="w-full text-left px-3 py-2 text-[11px] font-mono cursor-pointer hover:opacity-80 transition border-b"
              style={{ borderColor: colors.border + '30', background: tableName === activeTable ? colors.primary + '15' : 'transparent', color: tableName === activeTable ? colors.primary : colors.text }}>
              📋 {tableName} <span className="text-[8px]" style={{ color: colors.textMuted }}>({table.rows.length})</span>
            </button>
          ))}
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>📝 Plantillas</span>
          </div>
          {SQL_TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => setQuery(t.query)}
              className="w-full text-left px-3 py-2 text-[10px] cursor-pointer hover:opacity-80 transition border-b"
              style={{ borderColor: colors.border + '30', color: colors.textMuted }}>
              {t.name}
            </button>
          ))}
          {history.length > 0 && (
            <>
              <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                <span className="text-[10px] font-bold" style={{ color: colors.text }}>🕐 Historial</span>
              </div>
              {history.map((h, i) => (
                <button key={i} onClick={() => setQuery(h)}
                  className="w-full text-left px-3 py-1.5 text-[8px] font-mono cursor-pointer hover:opacity-80 transition border-b truncate"
                  style={{ borderColor: colors.border + '20', color: colors.textMuted }}>
                  {h.substring(0, 40)}...
                </button>
              ))}
            </>
          )}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {/* Table preview */}
          {activeTable && DATABASE[activeTable] && (
            <div className="border-b-2 overflow-auto max-h-40" style={{ borderColor: colors.border }}>
              <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: colors.cardBg }}>
                <span className="text-[10px] font-bold font-mono" style={{ color: colors.text }}>📋 {activeTable} ({DATABASE[activeTable].rows.length} filas)</span>
                <button onClick={() => setActiveTable(null)} className="text-[10px] cursor-pointer" style={{ color: colors.textMuted }}>✕</button>
              </div>
              <table className="w-full text-[9px] font-mono">
                <thead>
                  <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                    {DATABASE[activeTable].columns.map(col => (
                      <th key={col} className="px-2 py-1 text-left" style={{ color: colors.textMuted }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DATABASE[activeTable].rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: colors.border + '30' }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1" style={{ color: colors.text }}>{formatCell(cell)}</td>
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
              <button onClick={runQuery} className="text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer" style={{ background: '#22c55e', color: '#fff' }}>▶ Ejecutar (F5)</button>
            </div>
            <textarea value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'F5' || (e.ctrlKey && e.key === 'Enter')) { e.preventDefault(); runQuery(); } }}
              className="w-full h-32 p-3 font-mono text-[11px] outline-none resize-none"
              style={{ background: isDark ? '#0a0f1a' : '#1e293b', color: '#e2e8f0', border: 'none' }}
              placeholder="Escribe tu consulta SQL aquí... (F5 o Ctrl+Enter para ejecutar)" />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto">
            {result && (
              <div className="p-3">
                {result.error ? (
                  <div className="p-3 rounded-lg text-[11px] font-mono" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
                    ❌ Error: {result.error}
                  </div>
                ) : result.columns.length === 0 ? (
                  <div className="p-3 rounded-lg text-[11px] font-mono" style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}>
                    ✅ Query ejecutado — {result.rowCount} fila(s) afectada(s) · {result.executionTime}ms
                  </div>
                ) : (
                  <>
                    <div className="text-[9px] font-mono mb-2 flex items-center gap-3" style={{ color: colors.textMuted }}>
                      <span>{result.rowCount} fila(s)</span>
                      <span>{result.columns.length} columna(s)</span>
                      <span>{result.executionTime}ms</span>
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
                          <tr key={i} className="border-b hover:opacity-80 transition" style={{ borderColor: colors.border + '30', background: i % 2 === 0 ? 'transparent' : (isDark ? '#ffffff05' : '#00000003') }}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-1.5" style={{ color: colors.text }}>
                                {typeof cell === 'number' && !isNaN(cell) ? cell.toLocaleString('es-MX') : formatCell(cell)}
                              </td>
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