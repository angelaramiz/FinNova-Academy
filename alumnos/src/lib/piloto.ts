// Puerta de piloto Contalink (TASK-2-1): helper puro para el gate de
// DesktopShell. Con cohorte se muestra todo; sin cohorte las apps de
// practica real se ocultan (el shell muestra "proximamente").

export interface PilotApp {
  id: string;
}

const APPS_PILOTO = new Set(['practicas', 'practicasTracker', 'practicasCurso', 'capacitaciones']);

export function appsParaPiloto<T extends PilotApp>(apps: T[], piloto: boolean): T[] {
  if (piloto) return apps;
  return apps.filter((a) => !APPS_PILOTO.has(a.id));
}

export function esAppPiloto(id: string): boolean {
  return APPS_PILOTO.has(id);
}
