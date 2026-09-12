// Avance del tutorial (piloto/práctica): índice de paso + navegación.
import { useState } from 'react';
import type { PasoTutorial } from '../../lib/diot/types';

export function useDiotTutorial(pasos: PasoTutorial[]) {
  const [indice, setIndice] = useState(0);
  const [activo, setActivo] = useState(false);
  const paso: PasoTutorial | null = activo ? (pasos[indice] ?? null) : null;
  const iniciar = () => { setIndice(0); setActivo(true); };
  const siguiente = () => {
    if (indice + 1 >= pasos.length) setActivo(false);
    else setIndice((i) => i + 1);
  };
  const saltar = () => setActivo(false);
  return { paso, indice, total: pasos.length, activo, iniciar, siguiente, saltar };
}
