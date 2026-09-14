// DB estática Anexo 24: agrupador SAT + mapeo cuentas internas (TDD).
import { describe, it, expect } from 'vitest';
import {
  CATALOGO_AGRUPADOR,
  agrupadorDe,
  agrupadorDeCuentaInterna,
  etiquetaAgrupador,
} from '../alumnos/src/sims/catalogoAgrupador';

describe('catalogo agrupador SAT', () => {
  it('códigos clave del DOF existen', () => {
    expect(agrupadorDe('102.01')?.nombre).toBe('Bancos nacionales');
    expect(agrupadorDe('105.01')?.nombre).toBe('Clientes nacionales');
    expect(agrupadorDe('113.01')?.nombre).toBe('IVA a favor');
    expect(agrupadorDe('118.01')?.nombre).toBe('IVA acreditable pagado');
    expect(agrupadorDe('119.01')?.nombre).toBe('IVA pendiente de pago');
    expect(agrupadorDe('207.01')?.nombre).toBe('IVA trasladado');
    expect(agrupadorDe('208.01')?.nombre).toBe('IVA trasladado cobrado');
    expect(agrupadorDe('213.01')?.nombre).toBe('IVA por pagar');
    expect(agrupadorDe('216.10')?.nombre).toBe('Impuestos retenidos de IVA');
    expect(agrupadorDe('899.01')?.nombre).toBe('Otras cuentas de orden');
    expect(agrupadorDe('601.83')?.nombre).toContain('no deducibles');
  });

  it('inexistente devuelve null', () => {
    expect(agrupadorDe('999.99')).toBeNull();
    expect(agrupadorDe('')).toBeNull();
  });

  it('mapeo cuentas internas de los Sims', () => {
    expect(agrupadorDeCuentaInterna('102-01-001')?.codigo).toBe('102.01');
    expect(agrupadorDeCuentaInterna('1-02')?.codigo).toBe('102.01');
    expect(agrupadorDeCuentaInterna('1-03')?.codigo).toBe('105.01');
    expect(agrupadorDeCuentaInterna('899-04')?.codigo).toBe('899.01');
    expect(agrupadorDeCuentaInterna('211-01')?.codigo).toBe('216.01');
    expect(agrupadorDeCuentaInterna('XXX') ).toBeNull();
  });

  it('etiqueta corta para el Sim', () => {
    expect(etiquetaAgrupador('102-01-001')).toBe('102.01 · Bancos nacionales');
    expect(etiquetaAgrupador('XXX')).toBe('');
  });

  it('sin duplicados', () => {
    const cods = CATALOGO_AGRUPADOR.map((e) => e.codigo);
    expect(new Set(cods).size).toBe(cods.length);
    expect(cods.length).toBeGreaterThan(600);
  });
});
