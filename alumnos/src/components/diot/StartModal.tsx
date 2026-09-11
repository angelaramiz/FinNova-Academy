// Modal de inicio por modo (piloto/práctica/examen) con escenario.
import type { DiotMode, ScenarioDIOT } from '../../lib/diot/types';

interface Props {
  mode: DiotMode;
  scenario: ScenarioDIOT | null;
  onIniciar: () => void;
}

const COPY: Record<DiotMode, { fase: string; titulo: string; desc: string; btn: string }> = {
  piloto: { fase: 'Fase 1 de 3', titulo: 'Modo Piloto Automático', desc: 'El sistema ejecuta el flujo; tú observas (~5 min, 8 pasos).', btn: 'Iniciar Modo Piloto' },
  practica: { fase: 'Fase 2 de 3', titulo: 'Modo Práctica', desc: 'Encuentra y elimina los 2 errores intencionales.', btn: 'Iniciar Modo Práctica' },
  examen: { fase: 'Fase 3 de 3', titulo: 'Modo Examen', desc: '4 errores sutiles, 5 minutos, sin pistas.', btn: 'Iniciar Modo Examen' },
};

export default function StartModal({ mode, scenario, onIniciar }: Props) {
  const cfg = COPY[mode];
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 text-white">
          <div className="text-xs text-blue-200 uppercase tracking-wider">{cfg.fase}</div>
          <h2 className="text-xl font-bold">{cfg.titulo}</h2>
          <p className="text-sm text-blue-100 mt-1">{cfg.desc}</p>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs font-mono text-slate-600 space-y-0.5">
            <div>Empresa: {scenario?.empresa.nombre ?? '…'}</div>
            <div>Operaciones: {scenario?.operaciones.length ?? 0} | Errores: {scenario?.cantErrores ?? 0}</div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button onClick={onIniciar} className="px-6 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium">
            {cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}
