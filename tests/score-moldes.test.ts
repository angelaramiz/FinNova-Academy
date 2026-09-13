import { describe, expect, it } from 'vitest';
import { scoreMolde } from '../alumnos/src/lib/scoreMoldes';
import auditoria from '../alumnos/src/data/capacitaciones/auditoria.json';
import conciliacion from '../alumnos/src/data/capacitaciones/conciliacion.json';
import nomina from '../alumnos/src/data/capacitaciones/nomina.json';
import reporte from '../alumnos/src/data/capacitaciones/reporte-impuestos.json';

// TASK-R2-1 (Fase 2, Capa 2 por reglas, cero LLM): score pedagogico
// determinista 0-100 + justificacion por criterio.

function moldeBase(extra: Record<string, unknown> = {}) {
  return {
    titulo: 'Molde sintetico',
    instructor: 'Instructor',
    duracion: 1200,
    duracionTxt: '20:00',
    capitulos: [
      { titulo: 'Capitulo uno con titulo largo', inicio: 0 },
      { titulo: 'Capitulo dos con titulo largo', inicio: 300 },
      { titulo: 'Capitulo tres con titulo largo', inicio: 600 },
      { titulo: 'Capitulo cuatro con titulo largo', inicio: 900 },
    ],
    segmentos: [
      { start: 0, end: 10, speaker: 'A', text: 'Hola mundo.' },
      { start: 12, end: 22, speaker: 'A', text: 'Seguimos aqui.' },
      { start: 24, end: 34, speaker: 'A', text: 'Tercer punto.' },
      { start: 300, end: 310, speaker: 'A', text: 'Seguimos.' },
      { start: 312, end: 322, speaker: 'A', text: 'Otro punto.' },
      { start: 324, end: 334, speaker: 'A', text: 'Tercer punto.' },
      { start: 600, end: 610, speaker: 'A', text: 'Avanzamos.' },
      { start: 612, end: 622, speaker: 'A', text: 'Otro punto.' },
      { start: 624, end: 634, speaker: 'A', text: 'Tercer punto.' },
      { start: 900, end: 910, speaker: 'A', text: 'Cerramos.' },
      { start: 912, end: 922, speaker: 'A', text: 'Otro punto.' },
      { start: 924, end: 934, speaker: 'A', text: 'Tercer punto.' },
    ],
    ...extra,
  };
}

describe('scoreMolde (Capa 2, determinista)', () => {
  it('molde sano roza el maximo y trae 4 criterios justificados', () => {
    const r = scoreMolde(moldeBase());
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.justificacion).toHaveLength(4);
    expect(r.justificacion.map((j) => j.criterio)).toEqual([
      'cobertura',
      'claridad',
      'tono_forma',
      'duracion_ritmo',
    ]);
  });

  it('capitulo de 1 segmento penaliza cobertura', () => {
    const sano = scoreMolde(moldeBase()).score;
    const m = moldeBase({
      segmentos: [{ start: 0, end: 10, speaker: 'A', text: 'Solo uno.' }],
    });
    const r = scoreMolde(m);
    const cob = r.justificacion.find((j) => j.criterio === 'cobertura')!;
    expect(r.score).toBeLessThan(sano);
    expect(cob.puntaje).toBeLessThan(cob.max);
  });

  it('hueco > 20 min entre segmentos penaliza cobertura', () => {
    const sano = scoreMolde(moldeBase()).score;
    const m = moldeBase({
      capitulos: [
        { titulo: 'Capitulo uno con titulo largo', inicio: 0 },
        { titulo: 'Capitulo dos con titulo largo', inicio: 1300 },
      ],
      segmentos: [
        { start: 0, end: 10, speaker: 'A', text: 'Inicio.' },
        { start: 1300, end: 1310, speaker: 'A', text: 'Fin.' },
      ],
      duracion: 1400,
    });
    expect(scoreMolde(m).score).toBeLessThan(sano);
  });

  it('titulo corto (<15) y duplicados penalizan claridad', () => {
    const sano = scoreMolde(moldeBase()).score;
    const m = moldeBase({
      capitulos: [
        { titulo: 'Corto', inicio: 0 },
        { titulo: 'Mismo titulo largo aqui', inicio: 300 },
        { titulo: 'Mismo titulo largo aqui', inicio: 600 },
        { titulo: 'Otro titulo largo valido', inicio: 900 },
      ],
    });
    const r = scoreMolde(m);
    const cla = r.justificacion.find((j) => j.criterio === 'claridad')!;
    expect(r.score).toBeLessThan(sano);
    expect(cla.puntaje).toBeLessThan(cla.max);
    expect(cla.notas.length).toBeGreaterThanOrEqual(2);
  });

  it('ausencia total de speaker penaliza tono pero no hunde sola', () => {
    const m = moldeBase({
      segmentos: (moldeBase().segmentos as unknown[]).map((s) => {
        const c = { ...(s as Record<string, unknown>) };
        delete c.speaker;
        return c;
      }),
    });
    const r = scoreMolde(m);
    const tono = r.justificacion.find((j) => j.criterio === 'tono_forma')!;
    expect(tono.puntaje).toBeLessThan(tono.max);
    expect(r.score).toBeGreaterThanOrEqual(50);
  });

  it('exceso de "?" y segmentos <2s penalizan tono', () => {
    const segs = [];
    for (let i = 0; i < 10; i++) {
      segs.push({ start: i * 10, end: i * 10 + 1, speaker: 'A', text: 'En serio? De verdad?' });
    }
    const m = moldeBase({ segmentos: segs, duracion: 1200 });
    const r = scoreMolde(m);
    const tono = r.justificacion.find((j) => j.criterio === 'tono_forma')!;
    expect(tono.puntaje).toBeLessThan(tono.max);
  });

  it('capitulo fuera de 3-15 min penaliza ritmo proporcional', () => {
    const m = moldeBase({
      capitulos: [
        { titulo: 'Capitulo uno con titulo largo', inicio: 0 },
        { titulo: 'Capitulo dos con titulo largo', inicio: 30 },
      ],
      duracion: 1200,
    });
    const r = scoreMolde(m);
    const rit = r.justificacion.find((j) => j.criterio === 'duracion_ritmo')!;
    expect(rit.puntaje).toBeLessThan(rit.max);
  });

  it('entrada invalida da 0 con justificacion', () => {
    const r = scoreMolde(null);
    expect(r.score).toBe(0);
    expect(r.justificacion.length).toBeGreaterThan(0);
  });

  it('es determinista: mismo input, mismo score', () => {
    const a = scoreMolde(moldeBase());
    const b = scoreMolde(moldeBase());
    expect(a).toEqual(b);
  });

  it('los 4 moldes reales pasan >= 50 (sin ajustar la regla al dato)', () => {
    const scores = [auditoria, conciliacion, nomina, reporte].map((m) => ({
      t: (m as { titulo: string }).titulo.slice(0, 30),
      s: scoreMolde(m).score,
    }));
    for (const { t, s } of scores) {
      expect(s, t).toBeGreaterThanOrEqual(50);
    }
  });
});
