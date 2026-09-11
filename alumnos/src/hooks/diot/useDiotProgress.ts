// Persistencia del progreso DIOT (badges y puntajes en localStorage).
const KEYS = {
  piloto: 'diot_piloto',
  practica: 'diot_practica',
  practicaScore: 'diot_practica_score',
  examen: 'diot_examen',
  examenScore: 'diot_examen_score',
} as const;

export function leerProgreso(): Record<string, string | null> {
  return {
    piloto: localStorage.getItem(KEYS.piloto),
    practica: localStorage.getItem(KEYS.practica),
    practicaScore: localStorage.getItem(KEYS.practicaScore),
    examen: localStorage.getItem(KEYS.examen),
    examenScore: localStorage.getItem(KEYS.examenScore),
  };
}

export function guardarProgreso(clave: keyof typeof KEYS, valor: string): void {
  localStorage.setItem(KEYS[clave], valor);
}

export function examenDesbloqueado(): boolean {
  return localStorage.getItem(KEYS.piloto) === 'true' && localStorage.getItem(KEYS.practica) === 'true';
}
