// reportarSim — puente Sim → servidor. Cuando el alumno COMPLETA una acción
// real en un Sim Contalink (timbrar, conciliar un caso, cerrar, presentar),
// se registra en /api/sim/progress/record para que alimente tracker,
// expediente y trampas. Best-effort: jamás bloquea el juego. Cero LLM.
import { apiFetch } from '../lib/api';

export interface ResultadoSim {
  taskType: 'nomina_practica' | 'conciliacion_practica' | 'auditoria_practica' | 'reporte_practica' | 'poliza_practica';
  title: string;
  score: number;
  passed: boolean;
  timeSpent?: number;
}

export async function reportarSim(r: ResultadoSim): Promise<boolean> {
  try {
    await apiFetch('/api/sim/progress/record', {
      method: 'POST',
      body: JSON.stringify({
        taskId: `sim-${r.taskType}-${Date.now()}`,
        taskType: r.taskType,
        title: r.title,
        category: 'sim',
        specialty: 'practicas',
        difficulty: 2,
        score: r.score,
        maxScore: 100,
        passed: r.passed,
        week: 0,
        day: 0,
        timeSpent: r.timeSpent ?? 10,
        isTrap: false,
        trapDetected: false,
        countsAsCase: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    return true;
  } catch {
    return false;
  }
}
