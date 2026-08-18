import { describe, it, expect } from 'vitest';
import { buildPlanRefuerzo } from '../backend/src/services/reforzamiento';

describe('reforzamiento — práctica a la medida (R-08 Fase 3)', () => {
  it('devuelve un plan con estructura completa', async () => {
    const plan = await buildPlanRefuerzo('u-nonexistent', 'accounting');
    expect(plan.userId).toBe('u-nonexistent');
    expect(plan.specialty).toBe('accounting');
    expect(Array.isArray(plan.recomendaciones)).toBe(true);
    expect(['refuerzo', 'avanzar']).toContain(plan.prioridad);
  });

  it('prioridad es avanzar si no hay recomendaciones', async () => {
    const plan = await buildPlanRefuerzo('u-perfecto', 'accounting');
    if (plan.recomendaciones.length === 0) {
      expect(plan.prioridad).toBe('avanzar');
    }
  });

  it('cada recomendación tiene evidencia esperada y nivel objetivo', async () => {
    const plan = await buildPlanRefuerzo('u-nonexistent', 'accounting');
    for (const r of plan.recomendaciones) {
      expect(r.titulo).toBeTruthy();
      expect(r.instrucciones).toBeTruthy();
      expect(r.evidenciaEsperada).toBeTruthy();
      expect(['Básico', 'Intermedio', 'Avanzado']).toContain(r.nivelObjetivo);
      expect(typeof r.scoreActual).toBe('number');
    }
  });
});
