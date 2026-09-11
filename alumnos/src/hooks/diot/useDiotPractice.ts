// Práctica: eliminaciones, aciertos, hints y feedback.
import { useState } from 'react';
import type { ScenarioDIOT } from '../../lib/diot/types';

export function useDiotPractice(scenario: ScenarioDIOT | null) {
  const [eliminadas, setEliminadas] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState('');
  const totales = scenario?.cantErrores ?? 0;
  const encontrados = eliminadas.filter((id) =>
    scenario?.erroresInyectados.some((e) => e.operacionId === id),
  ).length;

  const eliminar = (opId: number) => {
    const err = scenario?.erroresInyectados.find((e) => e.operacionId === opId);
    if (err) {
      setEliminadas((xs) => [...xs, opId]);
      setFeedback(`Correcto: ${err.error}. ${err.pista}`);
    } else {
      setFeedback('Esa operación era correcta.');
    }
  };
  const pedirPista = (pista: string) => { setHints((h) => h + 1); setFeedback(pista); };
  return { eliminadas, encontrados, totales, hints, feedback, eliminar, pedirPista };
}
