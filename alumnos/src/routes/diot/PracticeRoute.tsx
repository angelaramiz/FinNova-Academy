// Ruta Práctica: 2 errores intencionales, eliminar + pistas + puntaje.
import { useState } from 'react';
import { DiotProvider } from '../../contexts/DiotContext';
import { useDiotScenario } from '../../hooks/diot/useDiotScenario';
import { useDiotPractice } from '../../hooks/diot/useDiotPractice';
import { useDiotTutorial } from '../../hooks/diot/useDiotTutorial';
import { PRACTICE_STEPS } from '../../lib/diot/constants';
import DIOTDashboard from '../../components/diot/DIOTDashboard';
import TutorialOverlay from '../../components/diot/TutorialOverlay';
import FeedbackToast from '../../components/diot/FeedbackToast';
import HintBubble from '../../components/diot/HintBubble';
import StartModal from '../../components/diot/StartModal';
import CompletionModal from '../../components/diot/CompletionModal';

export default function PracticeRoute() {
  const { scenario } = useDiotScenario('practica', 1);
  const prac = useDiotPractice(scenario);
  const tut = useDiotTutorial(PRACTICE_STEPS);
  const [iniciado, setIniciado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  return (
    <DiotProvider inicial="practica">
      {!iniciado && <StartModal mode="practica" scenario={scenario} onIniciar={() => { setIniciado(true); tut.iniciar(); }} />}
      <DIOTDashboard mode="practica" scenario={scenario} eliminadas={prac.eliminadas} onEliminar={prac.eliminar} onPresentar={() => setFinalizado(true)} headerTitle="DIOT · Modo Práctica" />
      {iniciado && !finalizado && <TutorialOverlay paso={tut.paso} indice={tut.indice} total={tut.total} onSiguiente={tut.siguiente} onSaltar={tut.saltar} />}
      <FeedbackToast mensaje={prac.feedback} tipo="info" />
      <HintBubble pista={null} />
      {finalizado && (
        <CompletionModal titulo="Modo Práctica Completado" pasos={`${prac.encontrados}/${prac.totales}`} tiempo="—" puntaje="—" certificado={false} siguiente="Ir a Examen" onRepetir={() => setFinalizado(false)} onSiguiente={() => undefined} />
      )}
    </DiotProvider>
  );
}
