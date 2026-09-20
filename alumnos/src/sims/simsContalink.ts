// TASK-D5 — Mapa tarea real -> Sim dedicado Contalink.
// REGLA DURA: contalink NUNCA abre la hoja generica ni los workflows
// *_practica en la UI del alumno (quedan en backend/tests como referencia).
// Solo estos 5 taskTypes rutean a su Sim; el resto (contabilidad) sigue
// al fallback por tipo.
export type SimContalinkId = 'sim-diot' | 'sim-conciliacion' | 'sim-auditoria' | 'sim-nomina' | 'sim-poliza';

export const SIM_POR_TAREA: Record<string, SimContalinkId> = {
  reporte_practica: 'sim-diot',
  conciliacion_practica: 'sim-conciliacion',
  auditoria_practica: 'sim-auditoria',
  nomina_practica: 'sim-nomina',
  poliza_practica: 'sim-poliza',
};

export const SIM_POR_MODULO: Record<string, SimContalinkId> = {
  'mod-reporte': 'sim-diot',
  'mod-conciliacion': 'sim-conciliacion',
  'mod-auditoria': 'sim-auditoria',
  'mod-nomina-web': 'sim-nomina',
  'mod-polizas': 'sim-poliza',
};

export function simParaTarea(taskType: string): SimContalinkId | null {
  return SIM_POR_TAREA[taskType] ?? null;
}
