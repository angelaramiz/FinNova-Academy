import { describe, it, expect } from 'vitest';
import { validateMolde } from '../alumnos/src/lib/revisorMoldes';
import auditoria from '../alumnos/src/data/capacitaciones/auditoria.json';
import conciliacion from '../alumnos/src/data/capacitaciones/conciliacion.json';
import nomina from '../alumnos/src/data/capacitaciones/nomina.json';
import reporteImpuestos from '../alumnos/src/data/capacitaciones/reporte-impuestos.json';

// TASK-1-1 (Revisor de moldes, TDD): el validador estructural es puro.
// Cada regla tiene su caso rojo; los 4 moldes reales pasan en verde.

const VALIDO = {
  titulo: 'Molde ejemplo',
  instructor: 'Instructora',
  duracion: 100,
  duracionTxt: '1:40',
  capitulos: [
    { titulo: 'A', inicio: 0 },
    { titulo: 'B', inicio: 20 },
    { titulo: 'C', inicio: 40 },
    { titulo: 'D', inicio: 60 },
    { titulo: 'E', inicio: 80 },
  ],
  segmentos: [
    { start: 0, end: 10, text: 'hola' },
    { start: 20, end: 30, text: 'mundo' },
    { start: 40, end: 50, text: 'tres' },
    { start: 60, end: 70, text: 'cuatro' },
    { start: 80, end: 90, text: 'cinco' },
  ],
};

describe('revisor-moldes: molde valido', () => {
  it('devuelve lista vacia', () => {
    expect(validateMolde(VALIDO)).toEqual([]);
  });
});

describe('revisor-moldes: schema exacto', () => {
  it('falla si falta una clave', () => {
    const { titulo, ...resto } = VALIDO as any;
    void titulo;
    expect(validateMolde(resto).length).toBeGreaterThan(0);
  });
  it('falla si sobra una clave', () => {
    expect(validateMolde({ ...VALIDO, extra: 1 } as any).length).toBeGreaterThan(0);
  });
  it('falla si un tipo es incorrecto', () => {
    expect(validateMolde({ ...VALIDO, duracion: '100' } as any).length).toBeGreaterThan(0);
  });
  it('falla con menos de 5 capitulos', () => {
    expect(
      validateMolde({ ...VALIDO, capitulos: VALIDO.capitulos.slice(0, 4) }).length,
    ).toBeGreaterThan(0);
  });
});

describe('revisor-moldes: segmentos', () => {
  it('falla si no estan ordenados por start', () => {
    const segs = [VALIDO.segmentos[1], VALIDO.segmentos[0], ...VALIDO.segmentos.slice(2)];
    const errores = validateMolde({ ...VALIDO, segmentos: segs });
    expect(errores.some((e) => e.includes('segmentos[1]'))).toBe(true);
  });
  it('falla si start > end', () => {
    const segs = VALIDO.segmentos.map((s, i) => (i === 2 ? { ...s, end: s.start - 1 } : s));
    const errores = validateMolde({ ...VALIDO, segmentos: segs });
    expect(errores.some((e) => e.includes('segmentos[2]'))).toBe(true);
  });
  it('falla si start < 0', () => {
    const segs = [{ start: -1, end: 2, text: 'x' }, ...VALIDO.segmentos.slice(1)];
    const errores = validateMolde({ ...VALIDO, segmentos: segs });
    expect(errores.some((e) => e.includes('segmentos[0]'))).toBe(true);
  });
  it('falla si un texto esta vacio', () => {
    const segs = VALIDO.segmentos.map((s, i) => (i === 1 ? { ...s, text: '   ' } : s));
    const errores = validateMolde({ ...VALIDO, segmentos: segs });
    expect(errores.some((e) => e.includes('segmentos[1]'))).toBe(true);
  });
});

describe('revisor-moldes: capitulos anclados', () => {
  it('falla si un inicio sale de [0, duracion]', () => {
    const caps = VALIDO.capitulos.map((c, i) => (i === 3 ? { ...c, inicio: 500 } : c));
    const errores = validateMolde({ ...VALIDO, capitulos: caps });
    expect(errores.some((e) => e.includes('capitulos[3]'))).toBe(true);
  });
  it('falla si un inicio esta a >=1s de todo segmento real', () => {
    const caps = VALIDO.capitulos.map((c, i) => (i === 2 ? { ...c, inicio: 45 } : c));
    const errores = validateMolde({ ...VALIDO, capitulos: caps });
    expect(errores.some((e) => e.includes('capitulos[2]'))).toBe(true);
  });
});

describe('revisor-moldes: moldes reales en verde', () => {
  it.each([
    ['auditoria', auditoria],
    ['conciliacion', conciliacion],
    ['nomina', nomina],
    ['reporte-impuestos', reporteImpuestos],
  ])('%s pasa sin errores', (_id, molde) => {
    expect(validateMolde(molde)).toEqual([]);
  });
});
