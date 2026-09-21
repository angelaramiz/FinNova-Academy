import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// Pilotos individuales: cada paso del tour debe tener contenido completo y su
// selector [data-tour] debe existir en el Sim correspondiente (si el ancla se
// borra, el tour quedaría ciego). Cero LLM.
import { TOURS } from '../alumnos/src/sims/toursContalink';

const SIM_DE: Record<string, string> = {
  nomina: 'NominaSim.tsx',
  conciliacion: 'ConciliacionSim.tsx',
  auditoria: 'AuditoriaSim.tsx',
  poliza: 'PolizaSim.tsx',
};

describe('tours Contalink', () => {
  it('4 pilotos con 6 pasos cada uno y storageKeys únicos', () => {
    const ids = Object.keys(TOURS).sort();
    expect(ids).toEqual(['auditoria', 'conciliacion', 'nomina', 'poliza']);
    const keys = Object.values(TOURS).map((t) => t.storageKey);
    expect(new Set(keys).size).toBe(4);
    for (const t of Object.values(TOURS)) {
      expect(t.titulo).toMatch(/Piloto/);
      expect(t.pasos).toHaveLength(6);
    }
  });

  it('pasos con contenido completo (selector, título, descripción, teoría, referencia)', () => {
    for (const [id, t] of Object.entries(TOURS)) {
      for (const p of t.pasos) {
        expect(p.selector.startsWith('[data-tour="'), `${id}: selector malformado`);
        for (const campo of ['titulo', 'descripcion', 'teoria', 'referencia'] as const) {
          expect(p[campo].trim().length, `${id} ${p.selector} sin ${campo}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it('cada selector existe como data-tour en su Sim', () => {
    for (const [id, t] of Object.entries(TOURS)) {
      const src = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', SIM_DE[id]), 'utf8');
      for (const p of t.pasos) {
        const attr = p.selector.slice(1, -1); // [data-tour="x"] → data-tour="x"
        expect(src, `${id}: falta ancla ${attr}`).toContain(attr);
      }
    }
  });

  it('los Sims montan TourSim con su tour y navegación', () => {
    const usos: Record<string, string> = {
      nomina: 'TOURS.nomina',
      conciliacion: 'TOURS.conciliacion',
      auditoria: 'TOURS.auditoria',
      poliza: 'TOURS.poliza',
    };
    for (const [id, uso] of Object.entries(usos)) {
      const src = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', SIM_DE[id]), 'utf8');
      expect(src, `${id}: no importa TourSim`).toContain("from './TourSim'");
      expect(src, `${id}: no monta ${uso}`).toContain(`<TourSim titulo={${uso}.titulo}`);
      expect(src, `${id}: sin onNavegar (los tabs se saltarían)`).toContain('onNavegar=');
    }
  });

  it('pasos condicionales declaran a qué paso navegar', () => {
    for (const [id, t] of Object.entries(TOURS)) {
      // hero/stats/fases siempre visibles; el resto navega a su tab.
      for (const p of t.pasos) {
        const siempre = /hero|stats|fases/.test(p.selector);
        if (siempre) expect(p.paso, `${id} ${p.selector}`).toBeUndefined();
        else expect(typeof p.paso, `${id} ${p.selector} sin paso`).toBe('string');
      }
    }
  });
});
