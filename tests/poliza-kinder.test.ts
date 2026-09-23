import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// R-kinder (TDD): rediseño didáctico de PolizaSim — 1+2 fusionado, balanza por
// rubros con regla del cero, modo detective 3.5 y piloto kinder. Auditoría en
// fuente (mismo patrón que sims-cableado-ui: el SSR mezcla dos React).
const POL = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'PolizaSim.tsx'), 'utf8');

describe('poliza kinder: fusión papel vs alcancía (1+2)', () => {
  it('rotula las 2 tablas como papel y alcancía, no "movimientos" genérico', () => {
    expect(POL).toContain('Lo que dice el papel');
    expect(POL).toContain('Lo que dice la alcancía');
  });
  it('muestra veredicto PUE/PPD y mensaje de promesa sin banco', () => {
    expect(POL).toContain('aún no se paga, es promesa');
  });
});

describe('poliza kinder: regla del cero + balanza por rubros', () => {
  it('titula el paso 4 como balanza de comprobación por rubros (nunca "balance de resultados")', () => {
    expect(POL).toContain('Balanza de comprobación por rubros');
    expect(POL).not.toContain('Balance de resultados');
  });
  it('separa sección Balance (1/2/3) y sección Resultados (4/5/6/7) + GRAN TOTAL', () => {
    expect(POL).toContain('Sección Balance');
    expect(POL).toContain('Sección Resultados');
    expect(POL).toContain('GRAN TOTAL');
  });
  it('enseña la regla del cero kinder (cada cuenta tiene su casa)', () => {
    expect(POL).toContain('Cada cuenta tiene su casa');
  });
});

describe('poliza kinder: modo detective 3.5 + 601.83', () => {
  it('tiene panel detective con las 4 preguntas en orden', () => {
    expect(POL).toContain('Modo detective');
    expect(POL).toContain('¿El CFDI cuadra solo?');
    expect(POL).toContain('¿PUE o PPD');
    expect(POL).toContain('601.45 vs 601.46 vs 601.83');
    expect(POL).toContain('retención');
  });
  it('tarjeta 601.83: hospital sí, basurero no + declaración explícita', () => {
    expect(POL).toContain('hospital de gastos enfermos');
    expect(POL).toContain('no basurero');
    expect(POL).toContain('declaro que este gasto no tiene requisitos fiscales');
  });
});

describe('poliza kinder: piloto con hazlo por mí / yo lo intento', () => {
  it('el piloto ofrece ambos modos', () => {
    expect(POL).toContain('hazlo por mí');
    expect(POL).toContain('yo lo intento');
  });
});
