import { describe, expect, it } from 'vitest';
// TASK-D2: ConciliacionSim — motor puro. Goldens del webinar Pedro Castillo.
// Sin numeros inventados: todos salen del VTT/spec. Cero LLM.
import {
  validarAltaBanco,
  validarCaratula,
  sugerirPorMonto,
  aplicarCaso,
  validarCierre,
  CASOS,
} from '../alumnos/src/sims/conciliacionEngine';

describe('conciliacionEngine (TASK-D2)', () => {
  it('alta de banco: BBVA debito, cuenta 102-01, saldo 50000, CLABE 10/16/18', () => {
    const ok = { nombre: 'BBVA débito', cuenta: '102-01-001', saldoInicial: 50000, clabe: '012345678901234567', moneda: 'MN' as const };
    expect(validarAltaBanco(ok)).toEqual([]);
    expect(validarAltaBanco({ ...ok, clabe: '12345' })[0]).toContain('CLABE');
    expect(validarAltaBanco({ ...ok, nombre: '' })[0]).toContain('nombre');
  });

  it('caratula: inicial + depositos - retiros = final (100% iguales)', () => {
    expect(validarCaratula({ inicial: 50000, depositos: 20000, retiros: 15000, final: 55000 })).toEqual([]);
    expect(validarCaratula({ inicial: 50000, depositos: 20000, retiros: 15000, final: 55001 })[0]).toContain('carátula');
  });

  it('sugerencia por monto + folio en descripcion', () => {
    const s = sugerirPorMonto(
      { id: 1, monto: 1219.6, descripcion: 'PAGO FOLIO 8821' },
      [
        { folio: '8821', monto: 4419.6 },
        { folio: '9900', monto: 500 },
      ],
    );
    expect(s[0].folio).toBe('8821');
  });

  it('hay 8 casos con los montos del webinar', () => {
    expect(CASOS).toHaveLength(8);
    expect(CASOS.map((c) => c.id)).toEqual(['parcial', 'uno-vs-dos', 'n-vs-uno', 'usd', 'traspaso', 'rebote', 'reembolso', 'auto']);
  });

  it('caso parcial: factura 4419.60, movimiento 1219.60, resto 3200.00', () => {
    const r = aplicarCaso('parcial', { montoAplicado: 1219.6 });
    expect(r.ok).toBe(true);
    expect(r.resto).toBeCloseTo(3200.0, 2);
  });

  it('caso uno-vs-dos: 89.50 + 65.98, resto 626.20 pendiente', () => {
    const r = aplicarCaso('uno-vs-dos', { folios: ['A-8950', 'A-6598'] });
    expect(r.ok).toBe(true);
    expect(r.resto).toBeCloseTo(626.2, 2);
  });

  it('caso n-vs-uno: 4062 + 4000 contra folio 51010', () => {
    const r = aplicarCaso('n-vs-uno', { folio: '51010', montos: [4062, 4000] });
    expect(r.ok).toBe(true);
    expect(r.aplicado).toBeCloseTo(8062, 2);
  });

  it('caso usd: TC = 789/45 con todos los decimales; centavo a cuenta', () => {
    const r = aplicarCaso('usd', { tipoCambio: 789 / 45 });
    expect(r.ok).toBe(true);
    const mal = aplicarCaso('usd', { tipoCambio: 17.53 });
    expect(mal.ok).toBe(false);
  });

  it('caso traspaso: SIEMPRE por puente 899/104, directo se rechaza', () => {
    expect(aplicarCaso('traspaso', { cuentaDestino: '899-04' }).ok).toBe(true);
    expect(aplicarCaso('traspaso', { cuentaDestino: 'Santander' }).ok).toBe(false);
  });

  it('caso rebote: 150/150 puenteados no duplican', () => {
    const r = aplicarCaso('rebote', { retiro: 150, deposito: 150, cuenta: '899-04' });
    expect(r.ok).toBe(true);
    expect(r.duplicado).toBe(false);
  });

  it('caso reembolso socio: 2018.40 via cuenta de socio', () => {
    const r = aplicarCaso('reembolso', { monto: 2018.4, cuenta: 'reembolso-socio' });
    expect(r.ok).toBe(true);
  });

  it('caso auto: 10 de 12, resto a pendientes', () => {
    const r = aplicarCaso('auto', {});
    expect(r.conciliados).toBe(10);
    expect(r.pendientes).toBe(2);
  });

  it('cierre: fecha poliza = fecha movimiento, contrapartida != banco', () => {
    const ok = { fechaPoliza: '2025-06-10', fechaMovimiento: '2025-06-10', contrapartida: '899-04', cuentaBanco: '102-01-001' };
    expect(validarCierre(ok)).toEqual([]);
    expect(validarCierre({ ...ok, fechaPoliza: '2025-06-11' })[0]).toContain('fecha del movimiento');
    expect(validarCierre({ ...ok, contrapartida: '102-01-001' })[0]).toContain('misma cuenta del banco');
  });
});
