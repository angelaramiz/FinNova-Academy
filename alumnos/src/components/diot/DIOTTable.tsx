// Tabla de operaciones con botón eliminar opcional (práctica/examen).
import { TIPOS_OP } from '../../lib/diot/constants';
import type { OperacionDIOT } from '../../lib/diot/types';

interface Props {
  operaciones: OperacionDIOT[];
  conEliminar?: boolean;
  onEliminar?: (opId: number) => void;
}

export default function DIOTTable({ operaciones, conEliminar, onEliminar }: Props) {
  const totalMonto = operaciones.reduce((s, o) => s + Math.abs(o.monto), 0);
  const totalIva = operaciones.reduce((s, o) => s + o.iva, 0);
  return (
    <div id="spot-table" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">Operaciones con terceros</h3>
        <p className="text-xs text-slate-500 mt-0.5">Datos generados automáticamente. Revisa antes de enviar.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Fecha', 'RFC', 'Nombre', 'Tipo', 'Monto', 'IVA', 'Acción'].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-semibold text-slate-600 ${i >= 4 ? 'text-right' : i === 6 ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody id="operationsBody">
            {operaciones.map((op) => (
              <tr key={op.id} id={`row-${op.id}`} className={`border-b border-slate-100 ${op.monto < 0 ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3 text-xs text-slate-600">{op.fecha}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{op.rfc}</td>
                <td className="px-4 py-3 text-slate-800 truncate max-w-[220px]">{op.nombre}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-slate-100">{TIPOS_OP[op.tipo]}</span></td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-800">${Math.abs(op.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">${op.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-center">
                  {conEliminar ? (
                    <button onClick={() => onEliminar?.(op.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" aria-label="Eliminar">🗑</button>
                  ) : (<span className="text-xs text-slate-400">—</span>)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-300">
            <tr>
              <td colSpan={5} className="px-4 py-3 font-semibold text-slate-700 text-sm">TOTALES</td>
              <td className="px-4 py-3 text-right font-bold font-mono text-sm text-slate-800">${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3 text-right font-bold font-mono text-sm text-slate-800">${totalIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
