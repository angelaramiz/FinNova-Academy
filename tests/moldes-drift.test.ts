import { describe, expect, it } from 'vitest';
// TASK-R2-2: guardian contra divergencia entre las copias VENDOREADAS del
// backend (services/moldeReview.ts) y los originales de alumnos/
// (lib/revisorMoldes.ts + lib/scoreMoldes.ts). Si alguien edita un lado
// sin el otro, este test falla en alto.
import { validateMolde as validateBE, scoreMolde as scoreBE } from '../backend/src/services/moldeReview';
import { validateMolde as validateFE } from '../alumnos/src/lib/revisorMoldes';
import { scoreMolde as scoreFE } from '../alumnos/src/lib/scoreMoldes';
import auditoria from '../alumnos/src/data/capacitaciones/auditoria.json';
import conciliacion from '../alumnos/src/data/capacitaciones/conciliacion.json';
import nomina from '../alumnos/src/data/capacitaciones/nomina.json';
import reporte from '../alumnos/src/data/capacitaciones/reporte-impuestos.json';

const BATERIA: Array<[string, unknown]> = [
  ['nulo', null],
  ['vacio', {}],
  ['titulo-corto', { titulo: 'x', instructor: 'I', duracion: 100, duracionTxt: '1:40', capitulos: [], segmentos: [] }],
  [
    'sintetico-sano',
    {
      titulo: 'Molde sintetico',
      instructor: 'Instructor',
      duracion: 1200,
      duracionTxt: '20:00',
      capitulos: [0, 240, 480, 720, 960].map((inicio, i) => ({
        titulo: `Capitulo numero ${i + 1} con titulo largo`,
        inicio,
      })),
      segmentos: [0, 240, 480, 720, 960].flatMap((b) => [
        { start: b, end: b + 10, speaker: 'A', text: 'Punto uno.' },
        { start: b + 12, end: b + 22, speaker: 'A', text: 'Punto dos?' },
        { start: b + 24, end: b + 25, speaker: 'A', text: 'Punto tres.' },
      ]),
    },
  ],
  ['auditoria', auditoria],
  ['conciliacion', conciliacion],
  ['nomina', nomina],
  ['reporte-impuestos', reporte],
];

describe('moldes drift guard (backend vendored vs alumnos original)', () => {
  for (const [nombre, molde] of BATERIA) {
    it(`validateMolde identico: ${nombre}`, () => {
      expect(validateBE(molde)).toEqual(validateFE(molde));
    });
    it(`scoreMolde identico: ${nombre}`, () => {
      expect(scoreBE(molde)).toEqual(scoreFE(molde));
    });
  }
});
