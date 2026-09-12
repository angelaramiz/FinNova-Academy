import { describe, it, expect } from 'vitest';
import {
  filtrarSegmentos, fmtTiempo, indiceActivo, validarTraining,
} from '../alumnos/src/lib/capacitaciones';
import type { TrainingSegmento } from '../alumnos/src/components/TrainingPlayer';
import auditoria from '../alumnos/src/data/capacitaciones/auditoria.json';
import conciliacion from '../alumnos/src/data/capacitaciones/conciliacion.json';
import nomina from '../alumnos/src/data/capacitaciones/nomina.json';

// TASK-2-2: mismo layout x3, seek, buscador. Sin DOM: logica pura + contrato.

const MODULOS = [auditoria, conciliacion, nomina];

describe('capacitaciones: mismo layout en los 3 modulos', () => {
  it('los 3 cumplen el contrato TrainingData sin errores', () => {
    for (const m of MODULOS) {
      expect(validarTraining(m)).toEqual([]);
    }
  });
  it('capitulos >= 5 con inicios ordenados y dentro de la duracion', () => {
    for (const m of MODULOS) {
      expect(m.capitulos.length).toBeGreaterThanOrEqual(5);
      const inicios = m.capitulos.map((c) => c.inicio);
      expect([...inicios].sort((a, b) => a - b)).toEqual(inicios);
      expect(Math.max(...inicios)).toBeLessThanOrEqual(m.duracion);
    }
  });
  it('segmentos ordenados, no negativos y con texto', () => {
    for (const m of MODULOS) {
      expect(m.segmentos.length).toBeGreaterThan(0);
      m.segmentos.forEach((s) => {
        expect(s.start).toBeGreaterThanOrEqual(0);
        expect(s.end).toBeGreaterThanOrEqual(s.start);
        expect(s.text.trim().length).toBeGreaterThan(0);
      });
    }
  });
});

describe('capacitaciones: seek (capitulo y linea saltan al tiempo)', () => {
  it('todo inicio de capitulo cae dentro de la duracion (seek valido)', () => {
    for (const m of MODULOS) {
      m.capitulos.forEach((c) => {
        expect(c.inicio).toBeGreaterThanOrEqual(0);
        expect(c.inicio).toBeLessThanOrEqual(m.duracion);
      });
    }
  });
  it('toda linea tiene start valido como destino de seek', () => {
    for (const m of MODULOS) {
      m.segmentos.forEach((s) => {
        expect(s.start).toBeLessThanOrEqual(m.duracion);
      });
    }
  });
  it('indiceActivo sigue al tiempo (highlight)', () => {
    const segs: TrainingSegmento[] = [
      { start: 0, end: 5, text: 'a' },
      { start: 5, end: 10, text: 'b' },
      { start: 10, end: 15, text: 'c' },
    ];
    expect(indiceActivo(segs, 0)).toBe(0);
    expect(indiceActivo(segs, 7.5)).toBe(1);
    expect(indiceActivo(segs, 14.9)).toBe(2);
    expect(indiceActivo(segs, 100)).toBe(2);
  });
});

describe('capacitaciones: buscador filtra', () => {
  const segs: TrainingSegmento[] = [
    { start: 0, end: 5, text: 'Reporte DIOT ante el SAT' },
    { start: 5, end: 10, text: 'Conciliacion bancaria' },
  ];
  it('query vacio devuelve todo', () => {
    expect(filtrarSegmentos(segs, '')).toHaveLength(2);
    expect(filtrarSegmentos(segs, '   ')).toHaveLength(2);
  });
  it('filtra case-insensitive', () => {
    expect(filtrarSegmentos(segs, 'diot')).toHaveLength(1);
    expect(filtrarSegmentos(segs, 'SAT')).toHaveLength(1);
    expect(filtrarSegmentos(segs, 'inexistente')).toHaveLength(0);
  });
  it('fmtTiempo formatea m:ss', () => {
    expect(fmtTiempo(0)).toBe('0:00');
    expect(fmtTiempo(65)).toBe('1:05');
    expect(fmtTiempo(3568)).toBe('59:28');
  });
});
