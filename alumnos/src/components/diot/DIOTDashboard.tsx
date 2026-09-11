// Contenedor principal del módulo DIOT — orquesta banner, stats, acciones,
// tabla, tutorial y modales según el modo. La lógica vive en hooks/diot.
import type { DiotMode, OperacionDIOT, ScenarioDIOT } from '../../lib/diot/types';
import DIOTBanner from './DIOTBanner';
import DIOTStats from './DIOTStats';
import DIOTActions from './DIOTActions';
import DIOTTable from './DIOTTable';
import DIOTInfoBox from './DIOTInfoBox';

interface Props {
  mode: DiotMode;
  scenario: ScenarioDIOT | null;
  eliminadas: number[];
  onEliminar: (opId: number) => void;
  onPresentar: () => void;
  headerTitle: string;
}

export default function DIOTDashboard({ scenario, eliminadas, onEliminar, onPresentar, headerTitle }: Props) {
  if (!scenario) return <div className="p-6 text-sm text-slate-500">Cargando escenario…</div>;
  const ops: OperacionDIOT[] = scenario.operaciones.filter((o) => !eliminadas.includes(o.id));
  return (
    <div className="space-y-6">
      <DIOTBanner empresa={scenario.empresa.nombre} headerTitle={headerTitle} />
      <DIOTStats operaciones={ops} />
      <DIOTActions onPresentar={onPresentar} />
      <DIOTTable operaciones={ops} conEliminar onEliminar={onEliminar} />
      <DIOTInfoBox />
    </div>
  );
}
