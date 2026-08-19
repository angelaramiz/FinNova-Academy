import { describe, it, expect } from 'vitest';
import { computeDensity, densityFromProgress, DensityResult } from '../backend/src/services/experienceDensity';

describe('R-10 v2 — Etapa 3: densidad de experiencia', () => {
  it('densidad crece con casos resueltos e incidentes, no con tiempo ocioso', () => {
    const activo = computeDensity({ casosResueltos: 40, complejidad: 80, variedad: 10, incidentes: 3, resultados: 40 });
    const ocioso = computeDensity({ casosResueltos: 0, complejidad: 0, variedad: 0, incidentes: 0, resultados: 0 });
    expect(activo.density).toBeGreaterThan(ocioso.density);
    // el tiempo ocioso no aporta: densidad 0 sin actividad
    expect(ocioso.density).toBe(0);
  });

  it('un alumno con muchos casos variados puede superar a uno con pocos aunque lleve más tiempo', () => {
    const variado = computeDensity({ casosResueltos: 40, complejidad: 80, variedad: 10, incidentes: 3, resultados: 40 });
    const basico = computeDensity({ casosResueltos: 5, complejidad: 30, variedad: 2, incidentes: 0, resultados: 5 });
    expect(variado.density).toBeGreaterThan(basico.density);
  });

  it('el nivel sube con la densidad', () => {
    expect(computeDensity({ casosResueltos: 0, complejidad: 0, variedad: 0, incidentes: 0, resultados: 0 }).nivel).toBe('novato');
    expect(computeDensity({ casosResueltos: 40, complejidad: 85, variedad: 10, incidentes: 3, resultados: 40 }).nivel).toBe('senior');
  });

  it('genera evidencia para el expediente (R-08)', () => {
    const r = computeDensity({ casosResueltos: 40, complejidad: 80, variedad: 8, incidentes: 3, resultados: 30 });
    expect(r.evidencia.length).toBeGreaterThan(0);
    expect(r.evidencia.join(' ')).toContain('casos aplicados');
    expect(r.evidencia.join(' ')).toContain('incidentes');
    expect(r.narrativa).toContain('no se mide solo en años');
  });

  it('densityFromProgress es una conveniencia de computeDensity', () => {
    const a = densityFromProgress(40, 3, 10, 80, 40);
    const b = computeDensity({ casosResueltos: 40, complejidad: 80, variedad: 10, incidentes: 3, resultados: 40 });
    expect(a.density).toBe(b.density);
    expect(a.anos_equivalentes).toBeGreaterThan(0);
  });

  it('la densidad está acotada en 0-1', () => {
    const r = computeDensity({ casosResueltos: 999, complejidad: 999, variedad: 999, incidentes: 999, resultados: 999 });
    expect(r.density).toBeLessThanOrEqual(1);
    expect(r.density).toBeGreaterThanOrEqual(0);
  });
});