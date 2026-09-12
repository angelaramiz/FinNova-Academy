// Ruta Examen: 4 errores, cronómetro 5:00, certificado >= 90.
import { useState } from 'react';
import { DiotProvider } from '../../contexts/DiotContext';
import { useDiotScenario } from '../../hooks/diot/useDiotScenario';
import { useDiotPractice } from '../../hooks/diot/useDiotPractice';
import { useDiotExam } from '../../hooks/diot/useDiotExam';
import DIOTDashboard from '../../components/diot/DIOTDashboard';
import FeedbackToast from '../../components/diot/FeedbackToast';
import StartModal from '../../components/diot/StartModal';
import CompletionModal from '../../components/diot/CompletionModal';

export default function ExamRoute() {
  const { scenario } = useDiotScenario('examen', 1);
  const prac = useDiotPractice(scenario);
  const [iniciado, setIniciado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const exam = useDiotExam(300, iniciado && !finalizado);

  const precision = prac.totales > 0 ? Math.round((prac.encontrados / prac.totales) * 100) : 0;
  const puntaje = Math.min(100, precision);

  return (
    <DiotProvider inicial="examen">
      {!iniciado && <StartModal mode="examen" scenario={scenario} onIniciar={() => setIniciado(true)} />}
      <DIOTDashboard mode="examen" scenario={scenario} eliminadas={prac.eliminadas} onEliminar={prac.eliminar} onPresentar={() => setFinalizado(true)} headerTitle={`DIOT · Modo Examen · ${exam.texto}`} />
      <FeedbackToast mensaje={exam.agotado ? 'Tiempo agotado' : prac.feedback} tipo={exam.agotado ? 'error' : 'info'} />
      {finalizado && (
        <CompletionModal titulo="Examen Completado" pasos={`${prac.encontrados}/${prac.totales}`} tiempo={exam.texto} puntaje={`${puntaje}/100`} certificado={puntaje >= 90} siguiente="Repetir" onRepetir={() => setFinalizado(false)} onSiguiente={() => undefined} />
      )}
    </DiotProvider>
  );
}
