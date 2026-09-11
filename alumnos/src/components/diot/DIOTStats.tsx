// 4 cards de métricas calculadas de las operaciones visibles.
import type { OperacionDIOT } from '../../lib/diot/types';

interface Props {
  operaciones: OperacionDIOT[];
}

function k(n: number): string {
  return `$${(n / 1000).toFixed(0)}k`;
}

export default function DIOTStats({ operaciones }: Props) {
  const totalMonto = operaciones.reduce((s, o) => s + Math.abs(o.monto), 0);
  const totalIva = operaciones.reduce((s, o) => s + o.iva, 0);
  const cards = [
    { label: 'Operaciones', value: String(operaciones.length) },
    { label: 'Base gravable', value: k(totalMonto) },
    { label: 'IVA acreditable', value: k(totalIva) },
    { label: 'Para revisar', value: 'Listo' },
  ];
  return (
    <div id="spot-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="stat-card bg-white rounded-xl p-5 border border-slate-200">
          <div className="text-2xl font-bold text-slate-800">{c.value}</div>
          <div className="text-xs text-slate-500 mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
