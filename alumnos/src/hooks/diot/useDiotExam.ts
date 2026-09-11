// Examen: cronómetro regresivo con aviso de time-up.
import { useEffect, useState } from 'react';

export function useDiotExam(limite = 300, activo: boolean) {
  const [restante, setRestante] = useState(limite);
  const [agotado, setAgotado] = useState(false);

  useEffect(() => {
    if (!activo) return;
    setRestante(limite);
    setAgotado(false);
    const t = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(t);
          setAgotado(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [activo, limite]);

  const mm = String(Math.floor(restante / 60)).padStart(2, '0');
  const ss = String(restante % 60).padStart(2, '0');
  return { restante, agotado, texto: `${mm}:${ss}`, critico: restante < 60 };
}
