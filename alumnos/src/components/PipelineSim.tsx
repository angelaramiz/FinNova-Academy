import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface FoundrySimProps { theme: Theme; onBack: () => void; }

// â”€â”€â”€ Datos de prueba (datasets) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DATASETS: Record<string, { schema: string[]; rows: any[][]; description: string }> = {
  'raw_ventas': {
    schema: ['id', 'fecha', 'cliente', 'producto', 'cantidad', 'precio_unit'],
    rows: [
      [1, '2026-07-01', 'TechCorp SA', 'Flete express', 2, 8500],
      [2, '2026-07-01', 'Distribuidora Luna', 'Almacenaje', 10, 320],
      [3, '2026-07-02', 'TechCorp SA', 'Carga especializada', 1, 12500],
      [4, '2026-07-03', 'Constructora Norte', 'Flete express', 3, 8500],
      [5, '2026-07-03', 'Distribuidora Luna', 'Seguro de carga', 5, 250],
      [6, '2026-07-04', 'Comercial Valle', 'Transporte intl', 1, 28500],
      [7, '2026-07-05', 'TechCorp SA', 'Almacenaje', 20, 320],
      [8, '2026-07-05', 'Inversiones Trust', 'Flete express', 4, 8500],
    ],
    description: 'Registros de ventas del ERP en formato CSV',
  },
  'raw_clientes': {
    schema: ['id', 'nombre', 'rfc', 'ciudad', 'sector'],
    rows: [
      [1, 'TechCorp SA', 'TEC-990101', 'CDMX', 'Tecnología'],
      [2, 'Distribuidora Luna', 'DLU-880202', 'Guadalajara', 'Retail'],
      [3, 'Constructora Norte', 'CNO-770303', 'Monterrey', 'ConstrucciÃ³n'],
      [4, 'Comercial Valle', 'CVA-660404', 'Puebla', 'Comercio'],
      [5, 'Inversiones Trust', 'ITR-550505', 'CDMX', 'Finanzas'],
    ],
    description: 'CatÃ¡logo de clientes desde la API de CRM',
  },
};

// â”€â”€â”€ Transform files (como en Foundry) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TransformFile {
  id: string;
  name: string;
  path: string;
  type: 'python' | 'sql';
  inputDatasets: string[];
  outputDataset: string;
  code: string;
  description: string;
}

const TRANSFORMS: TransformFile[] = [
  {
    id: 't1', name: 'ventas_limpias', path: '/transforms-python/', type: 'python',
    inputDatasets: ['raw_ventas'], outputDataset: 'ventas_limpias',
    code: `from transforms.api import transform, Input, Output
from pyspark.sql import functions as F

@transform(
    output=Output("/datasets/ventas_limpias"),
    raw=Input("/datasets/raw_ventas")
)
def compute(raw, output):
    """Limpia y calcula el total de ventas."""
    df = raw.dataframe()
    
    # 1. Eliminar nulos
    df = df.dropna()
    
    # 2. Calcular columna total
    df = df.withColumn("total", F.col("cantidad") * F.col("precio_unit"))
    
    # 3. Agregar fecha de procesamiento
    df = df.withColumn("fecha_proc", F.current_date())
    
    # 4. Filtrar ventas mayores a $1000
    df = df.filter(F.col("total") > 1000)
    
    # 5. Ordenar por total descendente
    df = df.orderBy(F.col("total").desc())
    
    output.write_dataframe(df)`,
    description: 'Limpia datos crudos de ventas y calcula el total',
  },
  {
    id: 't2', name: 'resumen_ventas_cliente', path: '/transforms-python/',
    type: 'python', inputDatasets: ['ventas_limpias', 'raw_clientes'],
    outputDataset: 'resumen_ventas_cliente',
    code: `from transforms.api import transform, Input, Output
from pyspark.sql import functions as F

@transform(
    output=Output("/datasets/resumen_ventas_cliente"),
    ventas=Input("/datasets/ventas_limpias"),
    clientes=Input("/datasets/raw_clientes")
)
def compute(ventas, clientes, output):
    """Agrega ventas por cliente con JOIN."""
    df_v = ventas.dataframe()
    df_c = clientes.dataframe()
    
    # JOIN ventas con clientes
    df = df_v.join(df_c, df_v.cliente == df_c.nombre, "left")
    
    # Agrupar por cliente
    result = df.groupBy("cliente", "ciudad", "sector") \\
        .agg(
            F.sum("total").alias("total_ventas"),
            F.count("*").alias("num_ventas"),
            F.avg("total").alias("promedio_venta")
        ) \\
        .orderBy(F.col("total_ventas").desc())
    
    output.write_dataframe(result)`,
    description: 'Resumen de ventas totales por cliente con datos del CRM',
  },
  {
    id: 't3', name: 'clean_sql_view', path: '/transforms-sql/', type: 'sql',
    inputDatasets: ['ventas_limpias'], outputDataset: 'ventas_alta',
    code: `-- Transform SQL: Ventas de alto valor
-- Este transform filtra solo ventas > $10,000

SELECT
    id,
    fecha,
    cliente,
    producto,
    cantidad,
    precio_unit,
    total,
    fecha_proc
FROM /datasets/ventas_limpias
WHERE total > 10000
ORDER BY total DESC`,
    description: 'Filtra ventas de alto valor (> $10,000) para anÃ¡lisis ejecutivo',
  },
];

// â”€â”€â”€ EjecuciÃ³n de transforms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function executePythonTransform(code: string, datasets: Record<string, any>): { output: any[][]; schema: string[]; rowCount: number; log: string[] } {
  const log: string[] = [];
  const lines = code.split('\n');

  // Extraer inputs del decorador
  const inputs: Record<string, string> = {};
  let outputName = 'output';
  const decoratorContent = code.match(/@transform\(([\s\S]*?)\)\s*(?:def )?(\w+)?/);
  if (decoratorContent) {
    const decoratorBody = decoratorContent[1];
    const outputMatch = decoratorBody.match(/output\s*=\s*Output\(\s*["']\/datasets\/(\w+)['"]\)/);
    if (outputMatch) outputName = outputMatch[1];
    const inputMatches = [...decoratorBody.matchAll(/(\w+)\s*=\s*Input\(\s*["']\/datasets\/(\w+)['"]\)/g)];
    for (const m of inputMatches) inputs[m[1]] = m[2];
  }

  log.push(`[TRANSFORM] Detectado: Python â†’ ${outputName}`);
  log.push(`[TRANSFORM] Inputs: ${Object.values(inputs).join(', ')}`);

  // Parsear las operaciones del cÃ³digo
  let data: any[] = [];
  let schema: string[] = [];

  // Cargar primer input
  const firstInputName = Object.values(inputs)[0];
  if (firstInputName && datasets[firstInputName]) {
    const ds = datasets[firstInputName];
      data = ds.rows.map((r: any[], i: number) => {
        const obj: any = {};
        ds.schema.forEach((col: string, j: number) => { obj[col] = r[j]; });
      return obj;
    });
    schema = [...ds.schema];
    log.push(`[TRANSFORM] Cargado: ${firstInputName} (${data.length} filas)`);
  }

  // Parsear cÃ³digo para operaciones
  if (code.includes('.dropna()')) {
    const before = data.length;
    data = data.filter(row => !Object.values(row).some(v => v === null || v === undefined));
    log.push(`[TRANSFORM] âž¤ dropna(): ${before} â†’ ${data.length} filas`);
  }

  if (code.includes('total') && code.includes('withColumn')) {
    data = data.map(row => ({
      ...row,
      total: (Number(row.cantidad) || 0) * (Number(row.precio_unit) || 0),
    }));
    if (!schema.includes('total')) schema.push('total');
    log.push('[TRANSFORM] âž¤ Calculado: total = cantidad Ã— precio_unit');
  }

  if (code.includes('fecha_proc') || code.includes('current_date()')) {
    const today = new Date().toISOString().split('T')[0];
    data = data.map(row => ({ ...row, fecha_proc: today }));
    if (!schema.includes('fecha_proc')) schema.push('fecha_proc');
    log.push(`[TRANSFORM] âž¤ Agregado: fecha_proc = ${today}`);
  }

  if (code.includes('.filter(') || code.includes('.where(')) {
    const filterMatch = code.match(/["'](\w+)["']\s*>\s*(\d+)/);
    if (filterMatch) {
      const col = filterMatch[1];
      const val = Number(filterMatch[2]);
      const before = data.length;
      data = data.filter(row => (Number(row[col]) || 0) > val);
      log.push(`[TRANSFORM] âž¤ Filter: ${col} > ${val}: ${before} â†’ ${data.length} filas`);
    }
  }

  if (code.includes('.orderBy') || code.includes('.sort(')) {
    const orderMatch = code.match(/orderBy\(F\.col\(["'](\w+)["']\)\.(asc|desc)\(\)\)/);
    if (orderMatch) {
      const col = orderMatch[1];
      const dir = orderMatch[2];
      data.sort((a, b) => dir === 'desc' ? (Number(b[col] || 0) - Number(a[col] || 0)) : (Number(a[col] || 0) - Number(b[col] || 0)));
      log.push(`[TRANSFORM] âž¤ Ordenado: ${col} ${dir.toUpperCase()}`);
    }
  }

  // JOIN
  if (code.includes('.join(')) {
    const joinMatch = code.match(/\.join\(df_\w+,\s*df_\w+\[['"](\w+)['"]\s*==\s*df_\w+\[['"](\w+)['"]/);
    const secondInputName = Object.values(inputs).slice(-1)[0];
    if (secondInputName && datasets[secondInputName]) {
      const ds2 = datasets[secondInputName];
      const rightData = ds2.rows.map((r: any[]) => {
        const obj: any = {};
        ds2.schema.forEach((col: string, j: number) => { obj[col] = r[j]; });
        return obj;
      });
      log.push(`[TRANSFORM] âž¤ JOIN con: ${secondInputName} (${rightData.length} filas)`);
      // Simple merge by cliente==nombre
      data = data.map((row: any) => {
        const match = rightData.find((r: any) => r.nombre === row.cliente);
        return match ? { ...row, ...match, _joined: true } : row;
      }).filter((r: any) => r._joined).map(({ _joined, ...r }: any) => r);
      rightData[0] && Object.keys(rightData[0]).forEach(c => { if (!schema.includes(c)) schema.push(c); });
      log.push(`[TRANSFORM] âž¤ JOIN result: ${data.length} filas`);
    }
  }

  // AgregaciÃ³n GROUP BY
  if (code.includes('.agg(') || code.includes('groupBy')) {
    const groupColMatch = code.match(/groupBy\(["'](\w+)["']/);
    const aggCols = [...code.matchAll(/F\.(\w+)\(F\.col\(["'](\w+)["']\)\)\.alias\(["'](\w+)["']\)/g)];
    if (groupColMatch && aggCols.length > 0) {
      const groupCol = groupColMatch[1];
      const groups: Record<string, any[]> = {};
      data.forEach(row => {
        const key = String(row[groupCol]);
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });
      schema = [groupCol, ...aggCols.map(m => m[3])];
      data = Object.entries(groups).map(([key, rows]) => {
        const row: any = { [groupCol]: key };
        aggCols.forEach(m => {
          const func = m[1];
          const col = m[2];
          const alias = m[3];
          const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
          if (func === 'sum') row[alias] = vals.reduce((s, v) => s + v, 0);
          else if (func === 'avg') row[alias] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
          else if (func === 'count') row[alias] = vals.length;
        });
        return row;
      });
      log.push(`[TRANSFORM] âž¤ GROUP BY ${groupCol}: ${data.length} grupos`);
    }
  }

  log.push(`[TRANSFORM] âœ… Output: ${data.length} filas, ${schema.length} columnas`);
  return { output: data.map(r => schema.map(c => r[c])), schema, rowCount: data.length, log };
}

function executeSQLTransform(code: string, datasets: Record<string, any>): { output: any[][]; schema: string[]; rowCount: number; log: string[] } {
  const log: string[] = [];
  log.push('[TRANSFORM] Detectado: SQL');

  const fromMatch = code.match(/FROM\s+\/datasets\/(\w+)/i);
  if (!fromMatch) return { output: [], schema: [], rowCount: 0, log: [...log, 'âŒ Error: No se encontrÃ³ dataset en FROM'] };
  const datasetName = fromMatch[1];
  const ds = datasets[datasetName];
  if (!ds) return { output: [], schema: [], rowCount: 0, log: [...log, `âŒ Dataset "${datasetName}" no existe`] };

  let data = ds.rows.map((r: any[]) => {
    const obj: any = {};
    ds.schema.forEach((col: string, j: number) => { obj[col] = r[j]; });
    return obj;
  });
  log.push(`[TRANSFORM] Cargado: ${datasetName} (${data.length} filas)`);

  // WHERE
  const whereMatch = code.match(/WHERE\s+(\w+)\s*(=|>|<|>=|<=|!=)\s*(\d+)/i);
  if (whereMatch) {
    const col = whereMatch[1], op = whereMatch[2], val = Number(whereMatch[3]);
    const before = data.length;
    data = data.filter((row: any) => {
      switch (op) { case '=': return row[col] == val; case '>': return row[col] > val; case '<': return row[col] < val; default: return true; }
    });
    log.push(`[TRANSFORM] âž¤ WHERE ${col} ${op} ${val}: ${before} â†’ ${data.length} filas`);
  }

  // ORDER BY
  const orderMatch = code.match(/ORDER\s+BY\s+(\w+)\s*(DESC|ASC)?/i);
  if (orderMatch) {
    const col = orderMatch[1], dir = (orderMatch[2] || 'ASC').toUpperCase();
    data.sort((a: any, b: any) => dir === 'DESC' ? (Number(b[col] || 0) - Number(a[col] || 0)) : (Number(a[col] || 0) - Number(b[col] || 0)));
    log.push(`[TRANSFORM] âž¤ ORDER BY ${col} ${dir}`);
  }

  log.push(`[TRANSFORM] âœ… Output: ${data.length} filas, ${ds.schema.length} columnas`);
  return { output: data.map((r: any) => ds.schema.map((c: string) => r[c])), schema: ds.schema, rowCount: data.length, log };
}

export default function FoundrySim({ theme, onBack }: FoundrySimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedFile, setSelectedFile] = useState<string>(TRANSFORMS[0].id);
  const [code, setCode] = useState(TRANSFORMS[0].code);
  const [buildResults, setBuildResults] = useState<{ output: any[][]; schema: string[]; rowCount: number; log: string[] } | null>(null);
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');
  const [viewingDataset, setViewingDataset] = useState<string | null>(null);
  const [generatedDatasets, setGeneratedDatasets] = useState<Record<string, any>>({});

  const selectedTransform = TRANSFORMS.find(t => t.id === selectedFile);

  function selectFile(id: string) {
    const t = TRANSFORMS.find(t => t.id === id);
    if (t) { setSelectedFile(id); setCode(t.code); setBuildResults(null); setTab('editor'); }
  }

  function build() {
    // Cargar datasets
    const datasets: Record<string, any> = {};
    for (const [name, ds] of Object.entries(DATASETS)) datasets[name] = ds;
    // Cargar datasets generados anteriormente
    for (const [name, ds] of Object.entries(generatedDatasets)) datasets[name] = ds;

    let result;
    if (selectedTransform?.type === 'python') {
      result = executePythonTransform(code, datasets);
    } else {
      result = executeSQLTransform(code, datasets);
    }

    if (result.output.length > 0 && selectedTransform) {
      const newGenerated = { ...generatedDatasets, [selectedTransform.outputDataset]: result };
      setGeneratedDatasets(newGenerated);
    }
    setBuildResults(result);
    setTab('preview');
  }

  function openDataset(name: string) {
    setViewingDataset(name);
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header - Foundry-style */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>â†</button>
        <span className="text-base">ðŸ”€</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Palantir Foundry</span>
        <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: '#3b82f620', color: '#3b82f6' }}>Transforms</span>
        <div className="flex-1" />
        <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>{selectedTransform?.path}{selectedTransform?.name}.py</span>
        <button onClick={build}
          className="text-[11px] font-bold px-4 py-1.5 rounded-lg cursor-pointer transition hover:opacity-90"
          style={{ background: '#3b82f6', color: '#fff' }}>
          âš¡ Build
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Project files */}
        <div className="w-52 shrink-0 border-r-2 overflow-auto flex flex-col" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>ðŸ“ Project</span>
            <div className="text-[8px] ml-4 mt-0.5" style={{ color: colors.textMuted }}>DataFlow Analytics</div>
          </div>

          {/* Input Datasets */}
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: '#22c55e' }}>â¬‡ Raw Datasets</div>
            {Object.entries(DATASETS).map(([name, ds]) => (
              <div key={name} onClick={() => openDataset(name)}
                className="text-[9px] font-mono py-1 px-2 cursor-pointer rounded mb-0.5 flex justify-between"
                style={{ color: '#22c55e', background: viewingDataset === name ? '#22c55e15' : 'transparent' }}>
                <span>ðŸ“‹ {name}</span><span style={{ opacity: 0.5 }}>{ds.rows.length}</span>
              </div>
            ))}
          </div>

          {/* Transforms */}
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: '#3b82f6' }}>âš™ï¸ Transforms</div>
            {TRANSFORMS.map(t => (
              <div key={t.id} onClick={() => selectFile(t.id)}
                className="text-[9px] font-mono py-1 px-2 cursor-pointer rounded mb-0.5 flex justify-between items-center"
                style={{ color: selectedFile === t.id ? '#fff' : '#3b82f6', background: selectedFile === t.id ? '#3b82f6' : 'transparent' }}>
                <span>{t.type === 'python' ? 'ðŸ' : 'ðŸ—ƒï¸'} {t.name}</span>
                {t.type === 'python' && <span className="text-[7px]">.py</span>}
                {t.type === 'sql' && <span className="text-[7px]">.sql</span>}
              </div>
            ))}
          </div>

          {/* Output Datasets */}
          <div className="p-3 border-b flex-1" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: '#f59e0b' }}>â¬† Output Datasets</div>
            {TRANSFORMS.map(t => (
              <div key={t.id} onClick={() => openDataset(t.outputDataset)}
                className="text-[9px] font-mono py-1 px-2 cursor-pointer rounded mb-0.5 flex justify-between"
                style={{ color: '#f59e0b', background: viewingDataset === t.outputDataset ? '#f59e0b15' : 'transparent' }}>
                <span>ðŸ“Š {t.outputDataset}</span>
                {generatedDatasets[t.outputDataset] && <span style={{ opacity: 0.5 }}>{generatedDatasets[t.outputDataset].rowCount}</span>}
              </div>
            ))}
          </div>

          {/* pypi */}
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <div className="text-[9px] font-bold mb-1.5" style={{ color: colors.textMuted }}>ðŸ“¦ Dependencies</div>
            <div className="text-[8px] font-mono" style={{ color: colors.textMuted }}>pyspark==3.5.0</div>
            <div className="text-[8px] font-mono" style={{ color: colors.textMuted }}>transforms==2.1.0</div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b-2 shrink-0" style={{ borderColor: colors.border }}>
            <button onClick={() => setTab('editor')} className="px-4 py-2 text-[11px] font-bold cursor-pointer transition"
              style={{ color: tab === 'editor' ? colors.primary : colors.textMuted, borderBottom: tab === 'editor' ? `2px solid ${colors.primary}` : '2px solid transparent' }}>
              ðŸ {selectedTransform?.type === 'python' ? 'Python' : 'SQL'} Editor
            </button>
            <button onClick={() => setTab('preview')} className="px-4 py-2 text-[11px] font-bold cursor-pointer transition"
              style={{ color: tab === 'preview' ? colors.primary : colors.textMuted, borderBottom: tab === 'preview' ? `2px solid ${colors.primary}` : '2px solid transparent' }}>
              ðŸ“Š Dataset Preview
            </button>
          </div>

          {/* Editor */}
          {tab === 'editor' && (
            <div className="flex-1 overflow-hidden">
              {/* File info bar */}
              <div className="px-3 py-1 text-[9px] font-mono flex gap-4" style={{ background: colors.cardBg, color: colors.textMuted }}>
                <span>{selectedTransform?.path}{selectedTransform?.name}{selectedTransform?.type === 'python' ? '.py' : '.sql'}</span>
                <span>Inputs: {selectedTransform?.inputDatasets.join(', ')}</span>
                <span>â†’ Output: {selectedTransform?.outputDataset}</span>
              </div>
              {/* Code editor */}
              <textarea value={code} onChange={e => setCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-[11px] outline-none resize-none leading-relaxed"
                style={{ background: isDark ? '#0f172a' : '#1e293b', color: '#e2e8f0', border: 'none' }}
                placeholder="Escribe tu transform aquÃ­..."
                spellCheck={false} />
            </div>
          )}

          {/* Preview */}
          {tab === 'preview' && buildResults && (
            <div className="flex-1 overflow-auto p-4">
              <div className="text-[11px] font-bold mb-3" style={{ color: colors.text }}>
                ðŸ“Š Dataset: {selectedTransform?.outputDataset}
                <span className="text-[10px] font-mono ml-2" style={{ color: colors.textMuted }}>
                  {buildResults.rowCount} filas Â· {buildResults.schema.length} columnas
                </span>
              </div>
              <table className="w-full text-[10px] font-mono border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
                <thead>
                  <tr style={{ background: isDark ? '#1a1a2e' : '#e5e7eb' }}>
                    {buildResults.schema.map(col => (
                      <th key={col} className="px-3 py-2 text-left" style={{ color: colors.textMuted }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buildResults.output.map((row, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: colors.border + '30', background: i % 2 === 0 ? 'transparent' : (isDark ? '#ffffff05' : '#00000003') }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-1.5" style={{ color: colors.text }}>
                          {typeof cell === 'number' && !isNaN(cell) ? cell.toLocaleString('es-MX') : String(cell ?? 'NULL')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Build log */}
              <div className="mt-4">
                <div className="text-[10px] font-bold mb-2" style={{ color: colors.text }}>ðŸ“‹ Build Log</div>
                <div className="rounded-lg p-3 font-mono text-[9px] space-y-0.5" style={{ background: isDark ? '#0a0f1a' : '#1e293b' }}>
                  {buildResults.log.map((line, i) => (
                    <div key={i} style={{ color: line.includes('âœ…') ? '#22c55e' : line.includes('âŒ') ? '#ef4444' : line.includes('âž¤') ? '#f59e0b' : '#94a3b8' }}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === 'preview' && !buildResults && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center" style={{ color: colors.textMuted }}>
                <div className="text-3xl mb-2">âš¡</div>
                <div className="text-xs">Presiona "Build" para ejecutar el transform</div>
                <div className="text-[10px] mt-1">El dataset generado se mostrarÃ¡ aquÃ­</div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Dataset details */}
        <div className="w-52 shrink-0 border-l-2 overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          {viewingDataset && (
            <>
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
                <span className="text-[10px] font-bold" style={{ color: colors.text }}>ðŸ“‹ {viewingDataset}</span>
                <button onClick={() => setViewingDataset(null)} className="text-[10px] cursor-pointer" style={{ color: colors.textMuted }}>âœ•</button>
              </div>
              {(() => {
                const ds = DATASETS[viewingDataset] || generatedDatasets[viewingDataset];
                if (!ds) return <div className="p-3 text-[9px]" style={{ color: colors.textMuted }}>Dataset no disponible aÃºn</div>;
                return (
                  <>
                    <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                      <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>SCHEMA</div>
                      {(Array.isArray(ds.schema) ? ds.schema : ds.schema || []).map((col: string) => (
                        <div key={col} className="text-[9px] font-mono py-0.5" style={{ color: colors.text }}>ðŸ”¹ {col}</div>
                      ))}
                    </div>
                    <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                      <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>LINEAGE</div>
                      {Object.entries(DATASETS).find(([k]) => k === viewingDataset) && (
                        <div className="flex items-center gap-1 text-[9px]" style={{ color: '#22c55e' }}>
                          â¬‡ Raw source
                        </div>
                      )}
                      {TRANSFORMS.filter(t => t.outputDataset === viewingDataset).map(t => (
                        <div key={t.id} className="flex items-center gap-1 text-[9px]" style={{ color: '#3b82f6' }}>
                          âš™ï¸ {t.name}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          )}
          {!viewingDataset && (
            <div className="p-3">
              <div className="text-[9px] text-center py-8" style={{ color: colors.textMuted }}>
                ðŸ“‹ Haz clic en un<br/>dataset para ver<br/>detalles y lineage
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 border-t-2 flex items-center justify-between text-[8px] font-mono shrink-0" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg }}>
        <span style={{ color: colors.textMuted }}>Palantir Foundry Â· Transforms v2.1.0</span>
        <span style={{ color: buildResults ? '#22c55e' : colors.textMuted }}>
          {buildResults ? `Last build: ${buildResults.rowCount} rows` : 'No builds yet'}
        </span>
      </div>
    </div>
  );
}

