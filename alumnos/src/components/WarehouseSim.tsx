import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface WarehouseSimProps {
  theme: Theme;
  onBack: () => void;
}

const SCHEMA: Record<string, { type: string; columns: { name: string; type: string; pk?: boolean; fk?: string }[] }> = {
  dim_cliente: {
    type: 'dimensión',
    columns: [
      { name: 'cliente_key', type: 'INT', pk: true },
      { name: 'cliente_id', type: 'VARCHAR(50)' },
      { name: 'nombre', type: 'VARCHAR(100)' },
      { name: 'rfc', type: 'VARCHAR(13)' },
      { name: 'ciudad', type: 'VARCHAR(50)' },
      { name: 'sector', type: 'VARCHAR(50)' },
      { name: 'fecha_registro', type: 'DATE' },
    ],
  },
  dim_producto: {
    type: 'dimensión',
    columns: [
      { name: 'producto_key', type: 'INT', pk: true },
      { name: 'producto_id', type: 'VARCHAR(50)' },
      { name: 'nombre', type: 'VARCHAR(100)' },
      { name: 'categoria', type: 'VARCHAR(50)' },
      { name: 'precio_unitario', type: 'DECIMAL(10,2)' },
      { name: 'proveedor', type: 'VARCHAR(100)' },
    ],
  },
  dim_fecha: {
    type: 'dimensión',
    columns: [
      { name: 'fecha_key', type: 'INT', pk: true },
      { name: 'fecha', type: 'DATE' },
      { name: 'anio', type: 'INT' },
      { name: 'mes', type: 'INT' },
      { name: 'dia', type: 'INT' },
      { name: 'trimestre', type: 'INT' },
      { name: 'dia_semana', type: 'VARCHAR(10)' },
    ],
  },
  fact_ventas: {
    type: 'hecho',
    columns: [
      { name: 'venta_key', type: 'INT', pk: true },
      { name: 'cliente_key', type: 'INT', fk: 'dim_cliente' },
      { name: 'producto_key', type: 'INT', fk: 'dim_producto' },
      { name: 'fecha_key', type: 'INT', fk: 'dim_fecha' },
      { name: 'cantidad', type: 'INT' },
      { name: 'precio_unitario', type: 'DECIMAL(10,2)' },
      { name: 'subtotal', type: 'DECIMAL(10,2)' },
      { name: 'iva', type: 'DECIMAL(10,2)' },
      { name: 'total', type: 'DECIMAL(10,2)' },
    ],
  },
  fact_inventario: {
    type: 'hecho',
    columns: [
      { name: 'inventario_key', type: 'INT', pk: true },
      { name: 'producto_key', type: 'INT', fk: 'dim_producto' },
      { name: 'fecha_key', type: 'INT', fk: 'dim_fecha' },
      { name: 'stock_inicial', type: 'INT' },
      { name: 'stock_final', type: 'INT' },
      { name: 'unidades_vendidas', type: 'INT' },
      { name: 'rotacion', type: 'DECIMAL(10,2)' },
    ],
  },
};

const QUERIES = [
  { name: 'Ventas por cliente', sql: 'SELECT c.nombre, SUM(f.total) as total_ventas\nFROM fact_ventas f\nJOIN dim_cliente c ON f.cliente_key = c.cliente_key\nGROUP BY c.nombre\nORDER BY total_ventas DESC' },
  { name: 'Top productos', sql: 'SELECT p.nombre, SUM(f.cantidad) as unidades\nFROM fact_ventas f\nJOIN dim_producto p ON f.producto_key = p.producto_key\nGROUP BY p.nombre\nORDER BY unidades DESC\nLIMIT 5' },
  { name: 'Ventas por trimestre', sql: 'SELECT d.trimestre, SUM(f.total) as total\nFROM fact_ventas f\nJOIN dim_fecha d ON f.fecha_key = d.fecha_key\nGROUP BY d.trimestre\nORDER BY d.trimestre' },
];

export default function WarehouseSim({ theme, onBack }: WarehouseSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);

  const tableEntries = Object.entries(SCHEMA);
  const dimTables = tableEntries.filter(([_, t]) => t.type === 'dimensión');
  const factTables = tableEntries.filter(([_, t]) => t.type === 'hecho');

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="px-4 py-3 border-b-2 shrink-0 flex items-center gap-3" style={{ borderColor: colors.border, background: isDark ? '#0f172a' : '#f8fafc' }}>
        <button onClick={onBack} className="text-[13px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">🏗️</span>
        <span className="text-xs font-bold font-mono" style={{ color: colors.text }}>Data Warehouse</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: colors.textMuted }}>Esquema dimensional</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Schema visualization */}
        <div className="flex-1 overflow-auto p-6">
          {/* Dimension tables */}
          <div className="mb-6">
            <div className="text-[11px] font-bold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
              <span className="w-3 h-3 rounded" style={{ background: '#3b82f6' }} />
              Dimensiones
            </div>
            <div className="grid grid-cols-3 gap-4">
              {dimTables.map(([name, table]) => (
                <div key={name} onClick={() => setSelectedTable(name)}
                  className="rounded-xl border-2 p-3 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ borderColor: selectedTable === name ? '#3b82f6' : colors.border, background: colors.cardBg }}>
                  <div className="text-[11px] font-bold font-mono mb-2" style={{ color: '#3b82f6' }}>{name}</div>
                  <div className="space-y-1">
                    {table.columns.map(col => (
                      <div key={col.name} className="flex items-center gap-2 text-[9px] font-mono">
                        <span style={{ color: col.pk ? '#f59e0b' : col.fk ? '#8b5cf6' : colors.textMuted }}>
                          {col.pk ? '🔑' : col.fk ? '🔗' : '•'}
                        </span>
                        <span style={{ color: colors.text }}>{col.name}</span>
                        <span className="ml-auto" style={{ color: colors.textMuted }}>{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fact tables */}
          <div className="mb-6">
            <div className="text-[11px] font-bold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
              <span className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} />
              Hechos
            </div>
            <div className="grid grid-cols-2 gap-4">
              {factTables.map(([name, table]) => (
                <div key={name} onClick={() => setSelectedTable(name)}
                  className="rounded-xl border-2 p-3 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ borderColor: selectedTable === name ? '#f59e0b' : colors.border, background: colors.cardBg }}>
                  <div className="text-[11px] font-bold font-mono mb-2" style={{ color: '#f59e0b' }}>{name}</div>
                  <div className="space-y-1">
                    {table.columns.map(col => (
                      <div key={col.name} className="flex items-center gap-2 text-[9px] font-mono">
                        <span style={{ color: col.pk ? '#f59e0b' : col.fk ? '#8b5cf6' : colors.textMuted }}>
                          {col.pk ? '🔑' : col.fk ? '🔗' : '•'}
                        </span>
                        <span style={{ color: colors.text }}>{col.name}</span>
                        <span className="ml-auto" style={{ color: colors.textMuted }}>{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relationships diagram */}
          <div className="rounded-xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="text-[11px] font-bold mb-3" style={{ color: colors.text }}>📊 Relaciones</div>
            <div className="space-y-2 text-[9px] font-mono">
              <div className="flex items-center gap-2">
                <span style={{ color: '#3b82f6' }}>dim_cliente</span>
                <span style={{ color: colors.textMuted }}>←──</span>
                <span style={{ color: '#f59e0b' }}>fact_ventas</span>
                <span style={{ color: '#8b5cf6' }}>(cliente_key)</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#3b82f6' }}>dim_producto</span>
                <span style={{ color: colors.textMuted }}>←──</span>
                <span style={{ color: '#f59e0b' }}>fact_ventas</span>
                <span style={{ color: '#8b5cf6' }}>(producto_key)</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#3b82f6' }}>dim_fecha</span>
                <span style={{ color: colors.textMuted }}>←──</span>
                <span style={{ color: '#f59e0b' }}>fact_ventas</span>
                <span style={{ color: '#8b5cf6' }}>(fecha_key)</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#3b82f6' }}>dim_producto</span>
                <span style={{ color: colors.textMuted }}>←──</span>
                <span style={{ color: '#f59e0b' }}>fact_inventario</span>
                <span style={{ color: '#8b5cf6' }}>(producto_key)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Query panel */}
        <div className="w-72 shrink-0 border-l-2 flex flex-col" style={{ borderColor: colors.border }}>
          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <span className="text-[10px] font-bold" style={{ color: colors.text }}>📝 Consultas de ejemplo</span>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {QUERIES.map((q, i) => (
              <button key={i} onClick={() => setQueryResult({ sql: q.sql, name: q.name })}
                className="w-full text-left p-2 rounded-lg text-[9px] font-mono cursor-pointer hover:opacity-80 transition"
                style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.text }}>
                {q.name}
              </button>
            ))}
          </div>
          {queryResult && (
            <div className="p-3 border-t" style={{ borderColor: colors.border }}>
              <div className="text-[9px] font-bold mb-2" style={{ color: colors.text }}>{queryResult.name}</div>
              <pre className="text-[8px] font-mono p-2 rounded-lg overflow-auto max-h-40" style={{ background: isDark ? '#0a0f1a' : '#1e293b', color: '#94a3b8' }}>
                {queryResult.sql}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
