// Ruta Piloto: tour guiado de 8 pasos sobre el reporte.
import { useState } from 'react';
import { DiotProvider } from '../../contexts/DiotContext';
import { useDiotScenario } from '../../hooks/diot/useDiotScenario';
import { useDiotTutorial } from '../../hooks/diot/useDiotTutorial';
import { PILOT_STEPS } from '../../lib/diot/constants';
import DIOTDashboard from '../../components/diot/DIOTDashboard';
import TutorialOverlay from '../../components/diot/TutorialOverlay';
import StartModal from '../../components/diot/StartModal';

export default function PilotRoute() {
  const { scenario } = useDiotScenario('piloto', 1);
  const tut = useDiotTutorial(PILOT_STEPS);
  const [iniciado, setIniciado] = useState(false);
  return (
    <DiotProvider inicial="piloto">
      {!iniciado && <StartModal mode="piloto" scenario={scenario} onIniciar={() => { setIniciado(true); tut.iniciar(); }} />}
      <DIOTDashboard mode="piloto" scenario={scenario} eliminadas={[]} onEliminar={() => undefined} onPresentar={() => undefined} headerTitle="DIOT · Modo Piloto" />
      {iniciado && <TutorialOverlay paso={tut.paso} indice={tut.indice} total={tut.total} onSiguiente={tut.siguiente} onSaltar={tut.saltar} />}
    </DiotProvider>
  );
}
