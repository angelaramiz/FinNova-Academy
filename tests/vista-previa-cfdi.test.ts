import { describe, expect, it } from 'vitest';
// P2: vista previa del CFDI de Nómina 4.0 — determinista, sin azar.
import { vistaPreviaCFDI, selloSimulado, uuidSimulado, type DatosCFDI } from '../alumnos/src/sims/nominaEngine';

const DATOS: DatosCFDI = {
  razon: 'Logística del Norte', regimen: '601', cp: '32575',
  empleadoNombre: 'Ana', empleadoRfc: 'AANA900101AAA', empleadoCurp: 'AANA900101MCHNNN00', empleadoNss: '12345678901',
  diario: 318.19, dias: 7, bruto: 2227.33, isr: 0, imss: 111.37, neto: 2115.96,
  fecha: '2026-07-26',
};

describe('P2 vista previa CFDI Nómina 4.0', () => {
  it('estructura completa: emisor, receptor, concepto, complemento, cadena, sello y UUID', () => {
    const v = vistaPreviaCFDI(DATOS);
    expect(v.emisor.razon).toBe('Logística del Norte');
    expect(v.receptor.rfc).toBe('AANA900101AAA');
    expect(v.concepto.importe).toBe(2227.33);
    expect(v.complementoNomina.neto).toBe(2115.96);
    expect(v.cadenaOriginal).toContain('||4.0|');
    expect(v.selloSimulado).toMatch(/^[0-9A-F]{32}$/);
    expect(v.uuidSimulado).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
  it('determinista: mismos datos = mismo sello y UUID (sin azar)', () => {
    const a = vistaPreviaCFDI(DATOS);
    const b = vistaPreviaCFDI(DATOS);
    expect(a.selloSimulado).toBe(b.selloSimulado);
    expect(a.uuidSimulado).toBe(b.uuidSimulado);
    expect(selloSimulado('x')).toBe(selloSimulado('x'));
    expect(uuidSimulado('x')).toBe(uuidSimulado('x'));
  });
  it('datos distintos = sello distinto', () => {
    expect(vistaPreviaCFDI(DATOS).selloSimulado).not.toBe(vistaPreviaCFDI({ ...DATOS, bruto: 1 }).selloSimulado);
  });
});
