import { describe, it, expect } from 'vitest';
import { registrarAvanceQuiz } from '../backend/src/services/progressTracker';
import { getRoleProgress } from '../backend/src/services/progressTracker';
import { evaluatePracticaPrueba, getPracticasModule } from '../backend/src/services/practicasModules';

// TASK-1-2 (Contalink a produccion, TDD): completar practica + quiz escribe
// en sim_progress (memoria en tests: supabase no listo). Staff lo ve por
// progressBySpec y reanudar lee el mismo estado via getRoleProgress.

const UID = 'test-quiz-avance';

describe('avance quiz persistido', () => {
  it('registrarAvanceQuiz guarda modulo, score y aprobado', async () => {
    const mod = getPracticasModule('mod-conciliacion')!;
    const res = evaluatePracticaPrueba('mod-conciliacion', mod.prueba.preguntas.map((p) => p.correcta));
    const comp = await registrarAvanceQuiz(UID, 'mod-conciliacion', res);
    expect(comp.moduleId).toBe('mod-conciliacion');
    expect(comp.taskType).toBe('prueba_modulo');
    expect(comp.passed).toBe(true);
    expect(comp.score).toBe(100);
  });

  it('getRoleProgress practicas muestra el avance para reanudar', async () => {
    const prog = await getRoleProgress(UID, 'practicas');
    const quiz = prog.recentCompletions.filter((c) => c.taskType === 'prueba_modulo');
    expect(quiz.length).toBeGreaterThanOrEqual(1);
    expect(quiz[0].moduleId).toBe('mod-conciliacion');
  });

  it('reprobado tambien queda registrado (reanudar muestra estado real)', async () => {
    await registrarAvanceQuiz(UID + '-r', 'mod-reporte', evaluatePracticaPrueba('mod-reporte', [-1, -1, -1]));
    const prog = await getRoleProgress(UID + '-r', 'practicas');
    const quiz = prog.recentCompletions.find((c) => c.taskType === 'prueba_modulo');
    expect(quiz?.passed).toBe(false);
  });
});
