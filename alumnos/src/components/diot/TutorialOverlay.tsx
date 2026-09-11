// Overlay del tutorial: spotlight + tooltip + cursor virtual.
// Recibe el paso actual y callbacks; el posicionamiento fino vive en useDiotTutorial.
import type { PasoTutorial } from '../../lib/diot/types';

interface Props {
  paso: PasoTutorial | null;
  indice: number;
  total: number;
  onSiguiente: () => void;
  onSaltar: () => void;
}

export default function TutorialOverlay({ paso, indice, total, onSiguiente, onSaltar }: Props) {
  if (!paso) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/80" />
      <div className="absolute left-4 bottom-24 max-w-[420px] bg-white rounded-2xl p-5 shadow-2xl pointer-events-auto">
        <div className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 inline-block px-2.5 py-1 rounded-lg">
          PASO {indice + 1} / {total}
        </div>
        <h3 className="font-bold text-slate-800 mt-2">{paso.titulo}</h3>
        <p className="text-sm text-slate-600 mt-1">{paso.descripcion}</p>
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded p-3 mt-2 text-xs text-amber-900">{paso.teoria}</div>
        <div className="text-[10px] text-blue-900 mt-2">{paso.referencia}</div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-500">{Math.round((indice / total) * 100)}% completado</span>
          <div className="flex gap-2">
            <button onClick={onSaltar} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Saltar</button>
            <button onClick={onSiguiente} className="px-4 py-1.5 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium">
              {indice === total - 1 ? 'Finalizar ✓' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
