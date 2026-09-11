// Modo activo + desbloqueo (examen exige piloto y práctica).
import { useState } from 'react';
import type { DiotMode } from '../../lib/diot/types';

export function useDiotMode(inicial: DiotMode = 'piloto') {
  const [mode, setMode] = useState<DiotMode>(inicial);
  const desbloqueado = (m: DiotMode): boolean => {
    if (m === 'piloto') return true;
    if (m === 'practica') return true;
    return localStorage.getItem('diot_piloto') === 'true' && localStorage.getItem('diot_practica') === 'true';
  };
  const seleccionar = (m: DiotMode): boolean => {
    if (!desbloqueado(m)) return false;
    setMode(m);
    return true;
  };
  return { mode, seleccionar, desbloqueado };
}
