import { describe, it, expect } from 'vitest';
import { getPracticasModule, evaluatePracticaPrueba } from '../backend/src/services/practicasModules';

// TASK-1-1 (Contalink a produccion, TDD): cada modulo Contalink tiene quiz
// sobre sus goldens reales (no genericas), con aprobarMin, feedback por
// pregunta y evaluacion operativa.

// goldens que cada prueba DEBE mencionar (pregunta, opciones o explicacion)
const GOLDENS: Record<string, string[]> = {
  'mod-conciliacion': ['3200', '789/45', '899', 'puente'],
  'mod-auditoria': ['M1', '194.67', '4606'],
  'mod-nomina-web': ['progresiva', '15%', 'asimilada', '9629'],
  'mod-reporte': ['pago', 'Complementaria', '1-2h'],
  'mod-polizas': ['63,810', '119.01', '601.45'],
};

describe('quiz Contalink x5: goldens cubiertos', () => {
  for (const [id, goldens] of Object.entries(GOLDENS)) {
    it(`${id} pregunta sus goldens`, () => {
      const mod = getPracticasModule(id)!;
      expect(mod).toBeTruthy();
      const texto = mod.prueba.preguntas
        .map((p) => [p.q, ...p.opciones, p.explicacion].join(' '))
        .join(' ');
      for (const g of goldens) {
        expect(texto, `golden '${g}' ausente en ${id}`).toContain(g);
      }
    });
  }

  it('las 4 tienen aprobarMin + feedback por pregunta', () => {
    for (const id of Object.keys(GOLDENS)) {
      const mod = getPracticasModule(id)!;
      expect(mod.prueba.aprobarMin).toBeGreaterThan(0);
      for (const p of mod.prueba.preguntas) {
        expect(p.explicacion.length).toBeGreaterThan(10);
        expect(p.correcta).toBeGreaterThanOrEqual(0);
        expect(p.correcta).toBeLessThan(p.opciones.length);
      }
    }
  });
});

describe('quiz Contalink x5: evaluacion operativa', () => {
  it('aciertos perfectos aprueban y fallos reprueban con feedback', () => {
    for (const id of Object.keys(GOLDENS)) {
      const mod = getPracticasModule(id)!;
      const buenas = mod.prueba.preguntas.map((p) => p.correcta);
      const ok = evaluatePracticaPrueba(id, buenas);
      expect(ok.aprobado).toBe(true);
      expect(ok.resultados.every((r) => r.acierto)).toBe(true);
      const malas = mod.prueba.preguntas.map(() => -1);
      const mal = evaluatePracticaPrueba(id, malas);
      expect(mal.aprobado).toBe(false);
      expect(mal.resultados.every((r) => r.explicacion.length > 0)).toBe(true);
    }
  });
});
