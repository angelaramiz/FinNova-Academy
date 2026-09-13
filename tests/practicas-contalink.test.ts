import { describe, it, expect } from 'vitest';
import { getPracticasModule, auditPracticasModules } from '../backend/src/services/practicasModules';
import { generateMonthPlan } from '../backend/src/services/taskPlanner';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';

// TASK-2-1 (Practicas Contalink x4, TDD): los 4 modulos Contalink en el
// catalogo, con prueba + curso, taskTypes reales y planificados.

const MODULOS = [
  { id: 'mod-conciliacion', taskType: 'conciliacion_practica' },
  { id: 'mod-auditoria', taskType: 'auditoria_practica' },
  { id: 'mod-nomina-web', taskType: 'nomina_practica' },
  { id: 'mod-reporte', taskType: 'reporte_practica' },
];

describe('catalogo Contalink x4', () => {
  it('los 4 modulos existen con pasos, prueba y curso', () => {
    for (const m of MODULOS) {
      const mod = getPracticasModule(m.id);
      expect(mod).toBeTruthy();
      expect(mod!.pasos.some((p) => p.tipo === 'tarea' && p.taskType === m.taskType)).toBe(true);
      expect(mod!.prueba.preguntas.length).toBeGreaterThanOrEqual(3);
      expect(mod!.curso.secciones.length).toBeGreaterThanOrEqual(2);
      expect(mod!.curso.npc).toBe('capacitador');
    }
  });

  it('cada paso de tarea referencia un workflow real (audit en verde)', () => {
    const issues = auditPracticasModules(getSpecialtyWorkflows('accounting'));
    expect(issues).toEqual([]);
  });
});

describe('planificacion Contalink x4', () => {
  it('specialty accounting registra los 4 taskTypes', () => {
    const types = getSpecialtyWorkflows('accounting');
    for (const m of MODULOS) {
      expect(types).toContain(m.taskType);
    }
  });

  it('el plan de practicas incluye los 4 taskTypes', () => {
    const plan = generateMonthPlan(6, 2026, 'practicas');
    const types = new Set(plan.tasks.map((t) => t.type));
    for (const m of MODULOS) {
      expect(types.has(m.taskType)).toBe(true);
    }
  });

  it('el tracker sigue en 4 semanas coherentes', () => {
    const plan = generateMonthPlan(6, 2026, 'practicas');
    const weeks = new Set(plan.weekPlans.map((w) => w.week));
    expect(weeks).toEqual(new Set([1, 2, 3, 4]));
  });
});
