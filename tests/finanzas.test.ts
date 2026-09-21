import { describe, expect, it } from 'vitest';
// EXP finanzas — cimientos base (rama experimental).
// TDD: goldens verificados A MANO (no contra el propio motor).
// Convenciones: MXN, redondeo a centavos por periodo, tasa nominal anual
// con capitalizacion explicita, anio de 12 meses.
import { interesCompuesto, amortizacion } from '../backend/src/services/finanzas';
import { buildPoints } from '../alumnos/src/components/charts/chartMath';

describe('EXP finanzas — interes compuesto', () => {
  it('golden a mano: $10,000 al 12% anual capitalizable mensual, 1 anio = $11,268.25', () => {
    const r = interesCompuesto(10000, 0.12, 12, 1);
    expect(r.serie).toHaveLength(12);
    expect(r.montoFinal).toBe(11268.25);
    expect(r.interesTotal).toBe(1268.25);
  });

  it('primeros periodos a mano: 10100.00, 10201.00, 10303.01', () => {
    const r = interesCompuesto(10000, 0.12, 12, 1);
    expect(r.serie[0]).toMatchObject({ periodo: 1, saldo: 10100.0, interes: 100.0 });
    expect(r.serie[1]).toMatchObject({ periodo: 2, saldo: 10201.0, interes: 101.0 });
    expect(r.serie[2]).toMatchObject({ periodo: 3, saldo: 10303.01, interes: 102.01 });
  });

  it('rechaza entradas invalidas', () => {
    expect(() => interesCompuesto(0, 0.12, 12, 1)).toThrow();
    expect(() => interesCompuesto(10000, -0.01, 12, 1)).toThrow();
    expect(() => interesCompuesto(10000, 0.12, 0, 1)).toThrow();
    expect(() => interesCompuesto(10000, 0.12, 12, 0)).toThrow();
  });
});

describe('EXP finanzas — amortizacion', () => {
  it('golden a mano (1a fila): credito $100,000 al 12% a 12 pagos → pago $8,884.88', () => {
    const r = amortizacion(100000, 0.12, 12);
    expect(r.pagoFijo).toBe(8884.88);
    expect(r.filas).toHaveLength(12);
    expect(r.filas[0]).toMatchObject({
      pagoNumero: 1, pago: 8884.88, interes: 1000.0, capital: 7884.88, saldo: 92115.12,
    });
  });

  it('la tabla cierra: ultimo saldo 0 y total pagado = monto + intereses', () => {
    const r = amortizacion(100000, 0.12, 12);
    expect(r.filas[11].saldo).toBe(0);
    expect(r.totalPagado).toBe(r.monto + r.totalIntereses);
    const sumaIntereses = Math.round(r.filas.reduce((a, f) => a + f.interes, 0) * 100) / 100;
    expect(r.totalIntereses).toBe(sumaIntereses);
  });

  it('rechaza entradas invalidas', () => {
    expect(() => amortizacion(0, 0.12, 12)).toThrow();
    expect(() => amortizacion(100000, 0.12, 0)).toThrow();
  });
});

describe('EXP finanzas — chartMath (helper puro de la grafica)', () => {
  it('12 puntos dentro del area y el maximo arriba', () => {
    const pts = buildPoints([10100, 10201, 10303.01, 11268.25], 260, 120, 10);
    expect(pts).toHaveLength(4);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(10);
      expect(p.x).toBeLessThanOrEqual(250);
      expect(p.y).toBeGreaterThanOrEqual(10);
      expect(p.y).toBeLessThanOrEqual(110);
    }
    // El ultimo (maximo) queda mas arriba (menor y) que el primero.
    expect(pts[3].y).toBeLessThan(pts[0].y);
  });

  it('serie constante no divide por cero', () => {
    const pts = buildPoints([5, 5, 5], 260, 120, 10);
    expect(pts).toHaveLength(3);
    expect(pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });
});
