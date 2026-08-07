import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface PipelineNode {
  id: string;
  type: 'source' | 'transform' | 'destination' | 'validation';
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  x: number;
  y: number;
}

interface PipelineEdge {
  from: string;
  to: string;
}

interface PipelineSimProps {
  theme: Theme;
  onBack: () => void;
}

const NODE_COLORS: Record<string, string> = {
  source: '#3b82f6',
  transform: '#8b5cf6',
  destination: '#22c55e',
  validation: '#f59e0b',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#64748b',
  running: '#3b82f6',
  completed: '#22c55e',
  error: '#ef4444',
};

const PIPELINE_TEMPLATES: { name: string; nodes: PipelineNode[]; edges: PipelineEdge[] }[] = [
  {
    name: 'Ingesta de CSV',
    nodes: [
      { id: '1', type: 'source', label: 'CSV File', status: 'completed', x: 50, y: 80 },
      { id: '2', type: 'transform', label: 'Clean Data', status: 'completed', x: 200, y: 80 },
      { id: '3', type: 'transform', label: 'Validate', status: 'running', x: 350, y: 80 },
      { id: '4', type: 'destination', label: 'PostgreSQL', status: 'pending', x: 500, y: 80 },
    ],
    edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }, { from: '3', to: '4' }],
  },
  {
    name: 'API to Warehouse',
    nodes: [
      { id: '1', type: 'source', label: 'REST API', status: 'completed', x: 50, y: 80 },
      { id: '2', type: 'transform', label: 'Parse JSON', status: 'completed', x: 180, y: 80 },
      { id: '3', type: 'validation', label: 'Schema Check', status: 'completed', x: 310, y: 80 },
      { id: '4', type: 'transform', label: 'Aggregate', status: 'running', x: 440, y: 80 },
      { id: '5', type: 'destination', label: 'Redshift', status: 'pending', x: 570, y: 80 },
    ],
    edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }, { from: '3', to: '4' }, { from: '4', to: '5' }],
  },
  {
    name: 'Streaming Pipeline',
    nodes: [
      { id: '1', type: 'source', label: 'Kafka', status: 'completed', x: 50, y: 80 },
      { id: '2', type: 'transform', label: 'Spark Stream', status: 'completed', x: 200, y: 80 },
      { id: '3', type: 'validation', label: 'Quality Gate', status: 'completed', x: 350, y: 80 },
      { id: '4', type: 'destination', label: 'S3 Lake', status: 'completed', x: 500, y: 80 },
      { id: '5', type: 'transform', label: 'ETL to DW', status: 'running', x: 350, y: 180 },
      { id: '6', type: 'destination', label: 'BigQuery', status: 'pending', x: 500, y: 180 },
    ],
    edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }, { from: '3', to: '4' }, { from: '4', to: '5' }, { from: '5', to: '6' }],
  },
];

function NodeIcon({ type }: { type: string }) {
  switch (type) {
    case 'source': return '📥';
    case 'transform': return '⚙️';
    case 'destination': return '📤';
    case 'validation': return '✅';
    default: return '❓';
  }
}

export default function PipelineSim({ theme, onBack }: PipelineSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedPipeline, setSelectedPipeline] = useState(0);
  const [nodes, setNodes] = useState<PipelineNode[]>(PIPELINE_TEMPLATES[0].nodes);
  const [edges] = useState<PipelineEdge[]>(PIPELINE_TEMPLATES[0].edges);
  const [isRunning, setIsRunning] = useState(false);

  function selectPipeline(idx: number) {
    setSelectedPipeline(idx);
    setNodes(PIPELINE_TEMPLATES[idx].nodes);
    setIsRunning(false);
  }

  async function runPipeline() {
    setIsRunning(true);
    for (let i = 0; i < nodes.length; i++) {
      setNodes(prev => prev.map((n, idx) => ({ ...n, status: idx === i ? 'running' : idx < i ? 'completed' : 'pending' })));
      await new Promise(r => setTimeout(r, 800));
    }
    setNodes(prev => prev.map(n => ({ ...n, status: 'completed' })));
    setIsRunning(false);
  }

  function resetPipeline() {
    setNodes(PIPELINE_TEMPLATES[selectedPipeline].nodes);
    setIsRunning(false);
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🔀</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Pipeline ETL</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: colors.textMuted }}>Simulador visual</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Pipeline list */}
        <div className="w-48 shrink-0 border-r-2 overflow-auto" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>Pipelines</span>
          </div>
          {PIPELINE_TEMPLATES.map((p, i) => (
            <button key={i} onClick={() => selectPipeline(i)}
              className="w-full text-left px-3 py-2.5 text-[11px] cursor-pointer hover:opacity-80 transition border-b"
              style={{ borderColor: colors.border + '30', background: i === selectedPipeline ? colors.primary + '15' : 'transparent', color: i === selectedPipeline ? colors.primary : colors.text }}>
              {p.name}
            </button>
          ))}
        </div>

        {/* Main canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: colors.border }}>
            <button onClick={runPipeline} disabled={isRunning}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
              style={{ background: isRunning ? '#64748b' : '#22c55e', color: '#fff' }}>
              {isRunning ? '⏳ Ejecutando...' : '▶ Ejecutar'}
            </button>
            <button onClick={resetPipeline} className="text-[11px] px-3 py-1.5 rounded-lg border cursor-pointer"
              style={{ borderColor: colors.border, color: colors.textMuted }}>↻ Reset</button>
            <div className="flex-1" />
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{nodes.length} nodos · {edges.length} conexiones</span>
          </div>

          {/* Pipeline visualization */}
          <div className="flex-1 overflow-auto p-6 relative" style={{ background: isDark ? '#0a0f1a' : '#f0f4f8' }}>
            {/* Grid background */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke={colors.textMuted} strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge, i) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                return (
                  <line key={i}
                    x1={fromNode.x + 60} y1={fromNode.y + 25}
                    x2={toNode.x} y2={toNode.y + 25}
                    stroke={fromNode.status === 'completed' ? '#22c55e' : '#475569'}
                    strokeWidth="2" strokeDasharray={fromNode.status === 'completed' ? '' : '5,5'} />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <div key={node.id}
                className="absolute flex flex-col items-center gap-1 cursor-pointer transition-all"
                style={{ left: node.x, top: node.y, transform: 'translateY(-50%)' }}>
                <div className="w-[120px] h-[50px] rounded-xl flex items-center justify-center gap-2 border-2 shadow-lg"
                  style={{
                    background: isDark ? '#1e293b' : '#fff',
                    borderColor: STATUS_COLORS[node.status],
                    boxShadow: node.status === 'running' ? `0 0 12px ${STATUS_COLORS[node.status]}40` : undefined,
                  }}>
                  <span className="text-lg">{NodeIcon({ type: node.type })}</span>
                  <span className="text-[10px] font-bold" style={{ color: colors.text }}>{node.label}</span>
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: STATUS_COLORS[node.status] + '20', color: STATUS_COLORS[node.status] }}>
                  {node.status === 'pending' ? '⏳ Pendiente' : node.status === 'running' ? '🔄 Ejecutando' : node.status === 'completed' ? '✅ Listo' : '❌ Error'}
                </span>
              </div>
            ))}
          </div>

          {/* Log panel */}
          <div className="h-32 border-t-2 overflow-auto p-3 font-mono text-[10px]" style={{ borderColor: colors.border, background: isDark ? '#0a0f1a' : '#1e293b', color: '#94a3b8' }}>
            <div className="text-[9px] font-bold mb-2" style={{ color: '#64748b' }}>📋 Log de ejecución</div>
            {nodes.filter(n => n.status !== 'pending').map((n, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <span style={{ color: STATUS_COLORS[n.status] }}>{n.status === 'completed' ? '✓' : '⟳'}</span>
                <span>[{new Date().toLocaleTimeString('es-MX')}]</span>
                <span style={{ color: STATUS_COLORS[n.status] }}>{n.label}</span>
                <span>— {n.status === 'completed' ? 'Completado' : 'En progreso...'}</span>
              </div>
            ))}
            {!isRunning && nodes.every(n => n.status === 'completed') && (
              <div className="text-[11px] font-bold mt-2" style={{ color: '#22c55e' }}>✅ Pipeline ejecutado exitosamente</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
