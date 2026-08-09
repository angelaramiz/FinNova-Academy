import { useState, useCallback } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface PipelineSimProps { theme: Theme; onBack: () => void; }

// ─── Datos de prueba ──────────────────────────────────────────
interface DataRow { [key: string]: any }

const SAMPLE_DATA: Record<string, DataRow[]> = {
  'CSV - Ventas': [
    { id: 1, cliente: 'TechCorp', producto: 'Flete', cantidad: 2, precio: 8500, fecha: '2026-07-01' },
    { id: 2, cliente: 'Luna', producto: 'Almacenaje', cantidad: 10, precio: 320, fecha: '2026-07-01' },
    { id: 3, cliente: 'TechCorp', producto: 'Carga', cantidad: 1, precio: 12500, fecha: '2026-07-02' },
    { id: 4, cliente: 'Norte', producto: 'Flete', cantidad: 3, precio: 8500, fecha: '2026-07-03' },
    { id: 5, cliente: 'Luna', producto: 'Seguro', cantidad: 5, precio: 250, fecha: '2026-07-03' },
    { id: 6, cliente: 'Valle', producto: 'Internacional', cantidad: 1, precio: 28500, fecha: '2026-07-04' },
    { id: 7, cliente: 'TechCorp', producto: 'Almacenaje', cantidad: 20, precio: 320, fecha: '2026-07-05' },
    { id: 8, cliente: 'Trust', producto: 'Flete', cantidad: 4, precio: 8500, fecha: '2026-07-05' },
  ],
  'API - Clientes': [
    { id: 1, nombre: 'TechCorp', ciudad: 'CDMX', sector: 'Tecnología' },
    { id: 2, nombre: 'Luna', ciudad: 'Guadalajara', sector: 'Retail' },
    { id: 3, nombre: 'Norte', ciudad: 'Monterrey', sector: 'Construcción' },
    { id: 4, nombre: 'Valle', ciudad: 'Puebla', sector: 'Comercio' },
    { id: 5, nombre: 'Trust', ciudad: 'CDMX', sector: 'Finanzas' },
  ],
};

type NodeType = 'source' | 'filter' | 'transform' | 'aggregate' | 'destination';
type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

interface PipelineNode {
  id: string;
  type: NodeType;
  label: string;
  status: NodeStatus;
  config: Record<string, any>;
  output?: DataRow[];
  input?: DataRow[];
  error?: string;
}

interface PipelineConnection {
  from: string;
  to: string;
}

const NODE_TYPES: Record<NodeType, { icon: string; color: string; label: string }> = {
  source: { icon: '📥', color: '#3b82f6', label: 'Fuente' },
  filter: { icon: '🔍', color: '#f59e0b', label: 'Filtro' },
  transform: { icon: '⚙️', color: '#8b5cf6', label: 'Transformar' },
  aggregate: { icon: '📊', color: '#ec4899', label: 'Agregar' },
  destination: { icon: '📤', color: '#22c55e', label: 'Destino' },
};

// ─── Ejecución de nodos ──────────────────────────────────────

function executeNode(node: PipelineNode, inputData: DataRow[]): DataRow[] {
  switch (node.type) {
    case 'source': {
      const sourceName = node.config.source;
      return SAMPLE_DATA[sourceName] ? [...SAMPLE_DATA[sourceName]] : [];
    }
    case 'filter': {
      const { column, operator, value } = node.config;
      if (!column || !operator || value === undefined) return inputData;
      return inputData.filter(row => {
        const cellVal = row[column];
        const numVal = Number(cellVal);
        const compareVal = Number(value);
        switch (operator) {
          case '=': return String(cellVal) === String(value);
          case '>': return numVal > compareVal;
          case '<': return numVal < compareVal;
          case '>=': return numVal >= compareVal;
          case '<=': return numVal <= compareVal;
          case 'contains': return String(cellVal).includes(String(value));
          default: return true;
        }
      });
    }
    case 'transform': {
      const { newColumn, expression } = node.config;
      if (!newColumn || !expression) return inputData;
      return inputData.map(row => {
        try {
          let expr = expression;
          for (const [key, val] of Object.entries(row)) {
            expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
          }
          const result = Function(`"use strict"; return (${expr})`)();
          return { ...row, [newColumn]: result };
        } catch {
          return { ...row, [newColumn]: '#ERR' };
        }
      });
    }
    case 'aggregate': {
      const { groupBy, aggFunc, aggCol } = node.config;
      if (!groupBy || !aggFunc || !aggCol) return inputData;
      const groups: Record<string, DataRow[]> = {};
      inputData.forEach(row => {
        const key = String(row[groupBy]);
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });
      return Object.entries(groups).map(([key, rows]) => {
        const values = rows.map(r => Number(r[aggCol])).filter(v => !isNaN(v));
        let aggValue = 0;
        switch (aggFunc) {
          case 'SUM': aggValue = values.reduce((s, v) => s + v, 0); break;
          case 'AVG': aggValue = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0; break;
          case 'COUNT': aggValue = rows.length; break;
          case 'MIN': aggValue = values.length ? Math.min(...values) : 0; break;
          case 'MAX': aggValue = values.length ? Math.max(...values) : 0; break;
        }
        return { [groupBy]: key, [`${aggFunc.toLowerCase()}_${aggCol}`]: Math.round(aggValue * 100) / 100 };
      });
    }
    case 'destination': {
      return inputData;
    }
    default:
      return inputData;
  }
}

// ─── Plantillas de pipeline ───────────────────────────────────

const PIPELINE_TEMPLATES: { name: string; nodes: PipelineNode[]; connections: PipelineConnection[] }[] = [
  {
    name: 'Ventas: Filtrar + Total',
    nodes: [
      { id: 'n1', type: 'source', label: 'CSV Ventas', status: 'idle', config: { source: 'CSV - Ventas' } },
      { id: 'n2', type: 'transform', label: 'Calcular Total', status: 'idle', config: { newColumn: 'total', expression: 'cantidad * precio' } },
      { id: 'n3', type: 'filter', label: 'Total > 5000', status: 'idle', config: { column: 'total', operator: '>', value: '5000' } },
      { id: 'n4', type: 'destination', label: 'Tabla Resultado', status: 'idle', config: {} },
    ],
    connections: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n3', to: 'n4' }],
  },
  {
    name: 'Ventas por Cliente',
    nodes: [
      { id: 'n1', type: 'source', label: 'CSV Ventas', status: 'idle', config: { source: 'CSV - Ventas' } },
      { id: 'n2', type: 'transform', label: 'Calcular Total', status: 'idle', config: { newColumn: 'total', expression: 'cantidad * precio' } },
      { id: 'n3', type: 'aggregate', label: 'SUM por Cliente', status: 'idle', config: { groupBy: 'cliente', aggFunc: 'SUM', aggCol: 'total' } },
      { id: 'n4', type: 'destination', label: 'Tabla Resultado', status: 'idle', config: {} },
    ],
    connections: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n3', to: 'n4' }],
  },
  {
    name: 'JOIN Clientes + Ventas',
    nodes: [
      { id: 'n1', type: 'source', label: 'CSV Ventas', status: 'idle', config: { source: 'CSV - Ventas' } },
      { id: 'n2', type: 'source', label: 'API Clientes', status: 'idle', config: { source: 'API - Clientes' } },
      { id: 'n3', type: 'aggregate', label: 'COUNT Ventas', status: 'idle', config: { groupBy: 'cliente', aggFunc: 'COUNT', aggCol: 'id' } },
      { id: 'n4', type: 'destination', label: 'Resumen', status: 'idle', config: {} },
    ],
    connections: [{ from: 'n1', to: 'n3' }, { from: 'n3', to: 'n4' }],
  },
];

// ─── Componente ───────────────────────────────────────────────

export default function PipelineSim({ theme, onBack }: PipelineSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [nodes, setNodes] = useState<PipelineNode[]>(PIPELINE_TEMPLATES[0].nodes);
  const [connections, setConnections] = useState<PipelineConnection[]>(PIPELINE_TEMPLATES[0].connections);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  function loadTemplate(idx: number) {
    setSelectedTemplate(idx);
    setNodes(PIPELINE_TEMPLATES[idx].nodes.map(n => ({ ...n, status: 'idle', output: undefined, input: undefined, error: undefined })));
    setConnections(PIPELINE_TEMPLATES[idx].connections);
    setSelectedNode(null);
    setLogs([]);
  }

  async function runPipeline() {
    setIsRunning(true);
    setLogs([]);
    // Reset
    const resetNodes = nodes.map(n => ({ ...n, status: 'idle' as NodeStatus, output: undefined, input: undefined, error: undefined }));
    setNodes(resetNodes);

    // Topological sort
    const nodeMap = new Map<string, PipelineNode>(resetNodes.map(n => [n.id, n as PipelineNode]));
    const inDegree = new Map(resetNodes.map(n => [n.id, 0]));
    for (const conn of connections) {
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
    }
    const queue = resetNodes.filter(n => (inDegree.get(n.id) || 0) === 0);
    const processed = new Set<string>();

    const newLogs: string[] = [];

    for (const startNode of queue) {
      await processNode(startNode.id);
    }

    async function processNode(nodeId: string) {
      if (processed.has(nodeId)) return;
      const node = nodeMap.get(nodeId);
      if (!node) return;

      // Check all inputs are ready
      const inputConnections = connections.filter(c => c.to === nodeId);
      for (const ic of inputConnections) {
        if (!processed.has(ic.from)) return; // Wait for upstream
      }

      // Set running
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'running' } : n));
      newLogs.push(`[${new Date().toLocaleTimeString('es-MX')}] ▶ Ejecutando: ${node.label}`);
      setLogs([...newLogs]);

      await new Promise(r => setTimeout(r, 300));

      // Get input data
      let inputData: DataRow[] = [];
      for (const ic of inputConnections) {
        const sourceNode = nodeMap.get(ic.from);
        if (sourceNode?.output) {
          inputData = [...inputData, ...sourceNode.output];
        }
      }

      try {
        // Execute node
        const outputData = executeNode({ ...node, input: inputData }, inputData);

        // Update node
        nodeMap.set(nodeId, { ...node, status: 'completed' as NodeStatus, input: inputData, output: outputData } as PipelineNode);
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'completed' as NodeStatus, input: inputData, output: outputData } as PipelineNode : n));
        newLogs.push(`[${new Date().toLocaleTimeString('es-MX')}] ✅ Completado: ${node.label} (${outputData.length} filas)`);
        setLogs([...newLogs]);

        processed.add(nodeId);

        // Process downstream nodes
        const downstream = connections.filter(c => c.from === nodeId).map(c => c.to);
        for (const ds of downstream) {
          await processNode(ds);
        }
      } catch (e: any) {
        nodeMap.set(nodeId, { ...node, status: 'error', error: e.message });
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'error', error: e.message } : n));
        newLogs.push(`[${new Date().toLocaleTimeString('es-MX')}] ❌ Error: ${node.label} - ${e.message}`);
        setLogs([...newLogs]);
      }
    }

    newLogs.push(`[${new Date().toLocaleTimeString('es-MX')}] 🏁 Pipeline completado`);
    setLogs([...newLogs]);
    setIsRunning(false);
  }

  function updateNodeConfig(nodeId: string, key: string, value: any) {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config: { ...n.config, [key]: value }, status: 'idle', output: undefined } : n));
  }

  function addNode(type: NodeType) {
    const id = `n${Date.now()}`;
    const defaultConfigs: Record<NodeType, Record<string, any>> = {
      source: { source: 'CSV - Ventas' },
      filter: { column: 'total', operator: '>', value: '0' },
      transform: { newColumn: 'nueva_col', expression: 'cantidad' },
      aggregate: { groupBy: 'cliente', aggFunc: 'SUM', aggCol: 'total' },
      destination: {},
    };
    const newNode: PipelineNode = {
      id, type, label: `${NODE_TYPES[type].label} ${nodes.length + 1}`,
      status: 'idle', config: defaultConfigs[type],
    };
    setNodes([...nodes, newNode]);
  }

  function removeNode(nodeId: string) {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  }

  function connectNodes(from: string, to: string) {
    if (from === to) return;
    if (connections.some(c => c.from === from && c.to === to)) return;
    setConnections([...connections, { from, to }]);
  }

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const nodePositions = nodes.map((n, i) => ({ ...n, x: 20 + (i % 3) * 220, y: 30 + Math.floor(i / 3) * 140 }));

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🔀</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Pipeline ETL</span>
        <button onClick={runPipeline} disabled={isRunning}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
          style={{ background: isRunning ? '#64748b' : '#22c55e', color: '#fff' }}>
          {isRunning ? '⏳ Ejecutando...' : '▶ Ejecutar'}
        </button>
        <div className="flex-1" />
        <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{nodes.length} nodos</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r-2 overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>📂 Plantillas</span>
          </div>
          {PIPELINE_TEMPLATES.map((p, i) => (
            <button key={i} onClick={() => loadTemplate(i)}
              className="w-full text-left px-3 py-2.5 text-[11px] cursor-pointer hover:opacity-80 transition border-b"
              style={{ borderColor: colors.border + '30', background: i === selectedTemplate ? colors.primary + '15' : 'transparent', color: i === selectedTemplate ? colors.primary : colors.text }}>
              {p.name}
            </button>
          ))}
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>➕ Agregar nodo</span>
          </div>
          {(Object.keys(NODE_TYPES) as NodeType[]).map(type => (
            <button key={type} onClick={() => addNode(type)}
              className="w-full text-left px-3 py-2 text-[10px] cursor-pointer hover:opacity-80 transition border-b"
              style={{ borderColor: colors.border + '30', color: colors.text }}>
              {NODE_TYPES[type].icon} {NODE_TYPES[type].label}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6 relative" style={{ background: isDark ? '#0a0f1a' : '#f0f4f8' }}>
            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {connections.map((conn, i) => {
                const fromPos = nodePositions.find(n => n.id === conn.from);
                const toPos = nodePositions.find(n => n.id === conn.to);
                if (!fromPos || !toPos) return null;
                return (
                  <g key={i}>
                    <line
                      x1={fromPos.x + 180} y1={fromPos.y + 35}
                      x2={toPos.x} y2={toPos.y + 35}
                      stroke={fromPos.status === 'completed' ? '#22c55e' : '#475569'}
                      strokeWidth="2"
                      strokeDasharray={fromPos.status === 'completed' ? '' : '5,5'}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodePositions.map(node => (
              <div key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className="absolute cursor-pointer transition-all"
                style={{ left: node.x, top: node.y, width: 180, zIndex: 2 }}>
                <div className="rounded-lg border-2 p-2 shadow-lg transition-all"
                  style={{
                    borderColor: node.status === 'running' ? '#3b82f6' : node.status === 'completed' ? '#22c55e' : node.status === 'error' ? '#ef4444' : colors.border,
                    background: isDark ? '#1e293b' : '#fff',
                    boxShadow: node.status === 'running' ? '0 0 12px #3b82f640' : undefined,
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{NODE_TYPES[node.type].icon}</span>
                    <span className="text-[11px] font-bold flex-1 truncate" style={{ color: colors.text }}>{node.label}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="text-[10px] cursor-pointer opacity-50 hover:opacity-100" style={{ color: '#ef4444' }}>✕</button>
                  </div>
                  <div className="text-[8px] font-mono flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded" style={{
                      background: node.status === 'idle' ? '#64748b20' : node.status === 'running' ? '#3b82f620' : node.status === 'completed' ? '#22c55e20' : '#ef444420',
                      color: node.status === 'idle' ? '#64748b' : node.status === 'running' ? '#3b82f6' : node.status === 'completed' ? '#22c55e' : '#ef4444',
                    }}>
                      {node.status === 'idle' ? '⏳' : node.status === 'running' ? '🔄' : node.status === 'completed' ? '✅' : '❌'} {node.status}
                    </span>
                    {node.output && <span style={{ color: colors.textMuted }}>{node.output.length} filas</span>}
                  </div>
                  {node.error && <div className="text-[8px] mt-1" style={{ color: '#ef4444' }}>{node.error}</div>}
                </div>
                {/* Input connector */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 cursor-pointer"
                  style={{ borderColor: colors.border, background: colors.cardBg }}
                  onClick={(e) => { e.stopPropagation(); const fromId = prompt('ID del nodo origen:'); if (fromId) connectNodes(fromId, node.id); }}
                  title="Conectar desde" />
                {/* Output connector */}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 cursor-pointer"
                  style={{ borderColor: colors.border, background: colors.cardBg }}
                  onClick={(e) => { e.stopPropagation(); const toId = prompt('ID del nodo destino:'); if (toId) connectNodes(node.id, toId); }}
                  title="Conectar hacia" />
              </div>
            ))}
          </div>

          {/* Config panel */}
          {selectedNodeData && (
            <div className="h-40 border-t-2 overflow-auto p-3" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold" style={{ color: colors.text }}>⚙️ Configuración: {selectedNodeData.label}</span>
                <button onClick={() => setSelectedNode(null)} className="text-[10px] cursor-pointer" style={{ color: colors.textMuted }}>✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedNodeData.type === 'source' && (
                  <>
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Fuente</label>
                    <select value={selectedNodeData.config.source || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'source', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}>
                      {Object.keys(SAMPLE_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                {selectedNodeData.type === 'filter' && (
                  <>
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Columna</label>
                    <input type="text" value={selectedNodeData.config.column || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'column', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }} />
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Operador</label>
                    <select value={selectedNodeData.config.operator || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'operator', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}>
                      <option value="=">=</option><option value=">">&gt;</option><option value="<">&lt;</option>
                      <option value=">=">&gt;=</option><option value="<=">&lt;=</option><option value="contains">contiene</option>
                    </select>
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Valor</label>
                    <input type="text" value={selectedNodeData.config.value || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'value', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }} />
                  </>
                )}
                {selectedNodeData.type === 'transform' && (
                  <>
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Nueva columna</label>
                    <input type="text" value={selectedNodeData.config.newColumn || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'newColumn', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }} />
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Expresión</label>
                    <input type="text" value={selectedNodeData.config.expression || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'expression', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }} placeholder="cantidad * precio" />
                  </>
                )}
                {selectedNodeData.type === 'aggregate' && (
                  <>
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Agrupar por</label>
                    <input type="text" value={selectedNodeData.config.groupBy || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'groupBy', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }} />
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Función</label>
                    <select value={selectedNodeData.config.aggFunc || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'aggFunc', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }}>
                      <option value="SUM">SUM</option><option value="AVG">AVG</option><option value="COUNT">COUNT</option>
                      <option value="MIN">MIN</option><option value="MAX">MAX</option>
                    </select>
                    <label className="text-[9px]" style={{ color: colors.textMuted }}>Columna</label>
                    <input type="text" value={selectedNodeData.config.aggCol || ''} onChange={e => updateNodeConfig(selectedNodeData.id, 'aggCol', e.target.value)}
                      className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: colors.border, background: colors.bg, color: colors.text }} />
                  </>
                )}
                {selectedNodeData.type === 'destination' && (
                  <div className="col-span-2 text-[9px]" style={{ color: colors.textMuted }}>Destino: almacena el resultado final del pipeline</div>
                )}
              </div>

              {/* Preview output */}
              {selectedNodeData.output && selectedNodeData.output.length > 0 && (
                <div className="mt-3">
                  <div className="text-[8px] font-bold mb-1" style={{ color: colors.textMuted }}>Vista previa ({selectedNodeData.output.length} filas):</div>
                  <div className="overflow-auto max-h-16 text-[8px] font-mono">
                    <table className="w-full">
                      <thead><tr>{Object.keys(selectedNodeData.output[0]).map(c => <th key={c} className="px-1 text-left" style={{ color: colors.textMuted }}>{c}</th>)}</tr></thead>
                      <tbody>
                        {selectedNodeData.output.slice(0, 5).map((row, i) => (
                          <tr key={i}>{Object.values(row).map((v: any, j: number) => <td key={j} className="px-1" style={{ color: colors.text }}>{String(v)}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Log panel */}
          <div className="h-24 border-t-2 overflow-auto p-2 font-mono text-[9px]" style={{ borderColor: colors.border, background: isDark ? '#0a0f1a' : '#1e293b', color: '#94a3b8' }}>
            <div className="text-[8px] font-bold mb-1" style={{ color: '#64748b' }}>📋 Log de ejecución</div>
            {logs.map((log, i) => <div key={i} className="mb-0.5">{log}</div>)}
            {!isRunning && logs.length === 0 && <div style={{ color: '#64748b' }}>Presiona "Ejecutar" para procesar el pipeline</div>}
          </div>
        </div>
      </div>
    </div>
  );
}