// Modal final: pasos, tiempo, puntaje + certificado (>=90 en examen).
interface Props {
  titulo: string;
  pasos: string;
  tiempo: string;
  puntaje: string;
  certificado: boolean;
  siguiente: string;
  onRepetir: () => void;
  onSiguiente: () => void;
}

export default function CompletionModal({ titulo, pasos, tiempo, puntaje, certificado, siguiente, onRepetir, onSiguiente }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white">
          <div className="text-xs text-green-200 uppercase tracking-wider">¡Completado!</div>
          <h2 className="text-xl font-bold">{titulo}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[{ v: pasos, l: 'Pasos' }, { v: tiempo, l: 'Tiempo' }, { v: puntaje, l: 'Puntaje' }].map((s) => (
              <div key={s.l} className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-slate-800">{s.v}</div>
                <div className="text-xs text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>
          {certificado && (
            <div className="rounded-lg p-4 text-center bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm">
              ¡CERTIFICADO DIOT BÁSICO! Competencia demostrada.
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={onRepetir} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Repetir</button>
            <button onClick={onSiguiente} className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm font-medium">{siguiente}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
