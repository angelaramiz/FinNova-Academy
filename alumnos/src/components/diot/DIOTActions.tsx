// Botones de descarga + presentar declaración.
interface Props {
  onPresentar: () => void;
}

export default function DIOTActions({ onPresentar }: Props) {
  return (
    <div id="spot-actions" className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {['Excel agrupado', 'Excel detalle', 'Descargar TXT'].map((label) => (
          <button key={label} className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
            {label}
          </button>
        ))}
      </div>
      <button id="btn-presentar" onClick={onPresentar} className="px-4 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm font-medium">
        Presentar declaración
      </button>
    </div>
  );
}
