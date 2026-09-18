import { describe, expect, it } from 'vitest';
// P3: Modo Caso Real — datos sucios como en la vida real. El practicante
// detecta y corrige; eliminar partidas siempre es error grave.
import { CASO_REAL_FILAS, resolverCasoReal } from '../alumnos/src/sims/conciliacionEngine';

const PERFECTO = [
  { id: 'r1', accion: 'corregir' },
  { id: 'r2', accion: 'corregir' },
  { id: 'r3', accion: 'corregir' },
  { id: 'r4', accion: 'transito' },
] as { id: string; accion: 'corregir' | 'transito' | 'eliminar' }[];

describe('P3 Caso Real con datos sucios', () => {
  it('el caso trae 4 filas sucias + 2 limpias (fijas, deterministas)', () => {
    expect(CASO_REAL_FILAS).toHaveLength(6);
    expect(CASO_REAL_FILAS.filter((f) => f.limpia)).toHaveLength(2);
    expect(CASO_REAL_FILAS.filter((f) => !f.limpia)).toHaveLength(4);
  });
  it('resolución perfecta: 4/4 detectados, score 100', () => {
    const r = resolverCasoReal(PERFECTO);
    expect(r.detectados).toBe(4);
    expect(r.total).toBe(4);
    expect(r.score).toBe(100);
    expect(r.ok).toBe(true);
  });
  it('eliminar una partida siempre es error grave (aunque esté sucia)', () => {
    const r = resolverCasoReal([
      { id: 'r1', accion: 'eliminar' },
      { id: 'r2', accion: 'corregir' },
      { id: 'r3', accion: 'corregir' },
      { id: 'r4', accion: 'transito' },
    ]);
    expect(r.detectados).toBe(3);
    expect(r.detalle.join(' ')).toContain('eliminar');
  });
  it('marcar en tránsito lo que debe corregirse no cuenta', () => {
    const r = resolverCasoReal([
      { id: 'r1', accion: 'transito' },
      { id: 'r2', accion: 'corregir' },
      { id: 'r3', accion: 'corregir' },
      { id: 'r4', accion: 'transito' },
    ]);
    expect(r.detectados).toBe(3);
    expect(r.ok).toBe(false);
  });
  it('marcar una fila limpia penaliza (falso positivo)', () => {
    const r = resolverCasoReal([...PERFECTO, { id: 'r5', accion: 'corregir' }]);
    expect(r.falsosPositivos).toBe(1);
    expect(r.score).toBeLessThan(100);
  });
  it('todo el feedback educa (📚) y el cheque en tránsito no se elimina', () => {
    const r = resolverCasoReal(PERFECTO);
    for (const d of r.detalle) expect(d).toContain('📚');
    const r4 = r.detalle.find((d) => d.includes('r4'));
    expect(r4).toContain('tránsito');
  });
});
