// Banner azul superior del reporte DIOT.
interface Props {
  empresa: string;
  headerTitle: string;
}

export default function DIOTBanner({ empresa, headerTitle }: Props) {
  void headerTitle;
  return (
    <div id="spot-banner" className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">Reporte DIOT</span>
          <span className="px-2 py-1 bg-green-500/20 rounded text-xs font-medium">Enero 2026</span>
          <span className="px-2 py-1 bg-blue-500/20 rounded text-xs font-medium">54 columnas</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Declaración Informativa de Operaciones con Terceros</h1>
        <p className="text-blue-100 text-sm">{empresa}</p>
      </div>
    </div>
  );
}
