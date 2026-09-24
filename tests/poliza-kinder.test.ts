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
  it('GRAN TOTAL = ΣDEBE − ΣHABER (balanza cuadra por columnas, no por saldos con signo)', () => {
    expect(POL).toContain('s + b.debe, 0) - balanza.reduce((s, b) => s + b.haber');
    expect(POL).not.toContain("b.debe - b.haber : b.haber - b.debe), 0))} —");
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

describe('poliza dataset: el Sim opera con semillas de la base (sin repetir)', () => {
  it('carga casos de /api/sim/polizas/casos con fallback local', () => {
    expect(POL).toContain('/api/sim/polizas/casos');
    expect(POL).toContain('CASOS.marcelo');
  });
  it('botón Otra semilla pide /api/sim/polizas/semilla excluyendo usadas', () => {
    expect(POL).toContain('/api/sim/polizas/semilla');
    expect(POL).toContain('Otra semilla');
    expect(POL).toContain('poliza_semillas_usadas');
  });
  it('al guardar usa el agrupador calculado por el motor (no la equivalencia 601-83→601.45)', () => {
    expect(POL).toContain('l.agrupador ??');
  });
});

describe('poliza vacía: aviso + guía al Documento (reporte tester)', () => {
  it('avisa dentro de la póliza vacía por qué está vacía', () => {
    expect(POL).toContain('aún no generas las líneas');
  });
  it('lleva solo al Documento a generar (botón desde la póliza vacía)', () => {
    expect(POL).toContain('aún no generas las líneas');
    expect(POL).toContain("setFase('documento')");
  });
  it('explica junto al Guardar apagado qué falta', () => {
    expect(POL).toContain('Te falta generar');
  });
});
describe('tester-estudiante: lo que pidió el reporte', () => {
  it('glosario kinder de 1 línea por palabra rara', () => {
    for (const s of ['Glosario kinder', 'CFDI', 'PUE', 'PPD', 'DEBE', 'HABER', 'ISR', 'Folio', 'Semilla']) {
      expect(POL).toContain(s);
    }
  });
  it('la pestaña 2 dice explícito qué revisar y cuándo puedes seguir', () => {
    expect(POL).toContain('puedes seguir');
  });
  it('el botón semilla se entiende: practicar con otra factura', () => {
    expect(POL).toContain('Practicar con otra factura');
    expect(POL).toContain('Otra semilla');
  });
  it('al guardar avisa que el folio vive en la Balanza', () => {
    expect(POL).toContain('verás en la Balanza');
  });
  it('el piloto hazlo-por-mí ejecuta el siguiente paso de verdad', () => {
    expect(POL).toContain('Haz el siguiente paso por mí');
  });
  it('el piloto avisa mientras trabaja (no más clics muertos)', () => {
    expect(POL).toContain('Trabajando');
  });
  it('el editor explica que al pagar el banco va en HABER aunque su casa sea DEBE', () => {
    expect(POL).toContain('aunque su casa sea DEBE');
  });
});

describe('uuid duplicado: mensaje amable del servidor + lección kinder (reporte 422)', () => {
  it('muestra el mensaje real del servidor (ya contabilizado / duplicarías el registro)', () => {
    expect(POL).toContain('ya contabilizado');
    expect(POL).toContain('duplicarías el registro');
  });
  it('agrega lección kinder de 1 línea (otra factura, una sola vez por UUID)', () => {
    expect(POL).toContain('cada UUID se contabiliza una sola vez');
  });
  it('apiFetch preserva el body { error } del servidor en el ApiError', () => {
    const API = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'lib', 'api.ts'), 'utf8');
    expect(API).toContain('errorData.error');
  });
});
