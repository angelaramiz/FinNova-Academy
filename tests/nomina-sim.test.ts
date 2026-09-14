import { describe, expect, it } from 'vitest';
// TASK-D4: NominaSim — motor puro. Tarifa ISR R-14 obligatoria (NUNCA 15%
// fijo) + goldens del video de nomina. Cero LLM.
import {
  calcularISR,
  calcularNomina,
  validarEmpresa,
  periodos,
  filtroOrdinaria,
  aplicarIncidencias,
  validarCuentas,
  timbrar,
} from '../alumnos/src/sims/nominaEngine';

describe('nominaEngine (TASK-D4)', () => {
  it('tarifa R-14 por tramos (NUNCA 15% fijo)', () => {
    expect(calcularISR(5000)).toBe(0);
    expect(calcularISR(25000)).toBe(1331); // 115.20 + 6.4% x 19000
    expect(calcularISR(10000)).toBe(371); // asimilada Julia Martinez
    expect(calcularISR(35000)).toBe(2195); // 1651.20 + 10.88% x 5000
    expect(calcularISR(25000)).not.toBe(3750); // 15% fijo prohibido
  });

  it('sueldo semanal = diario x 7 (318.19 x 7 = 2227.33)', () => {
    const n = calcularNomina({ diario: 318.19, dias: 7, esMinimo: false, causaISR: true, asimilada: false });
    expect(n.bruto).toBeCloseTo(2227.33, 2);
    expect(n.isr).toBe(0); // 2227 < 6000 tramo 1
    expect(n.neto).toBeCloseTo(n.bruto - n.imss, 2);
  });

  it('salario minimo: ISR e IMSS en 0', () => {
    const n = calcularNomina({ diario: 248.93, dias: 7, esMinimo: true, causaISR: false, asimilada: false });
    expect(n.isr).toBe(0);
    expect(n.imss).toBe(0);
  });

  it('asimilada Julia Martinez 10000: solo ISR 371, sin IMSS, neto 9629', () => {
    const n = calcularNomina({ diario: 0, dias: 0, esMinimo: false, causaISR: true, asimilada: true, montoAsimilada: 10000 });
    expect(n.isr).toBe(371);
    expect(n.imss).toBe(0);
    expect(n.neto).toBe(9629);
  });

  it('empresa: CSD cer+key+pass y logo <= 2MB', () => {
    const ok = { razon: 'LNO', regimen: '601', cp: '32575', cer: 'a.cer', key: 'a.key', pass: 'x', logoMB: 1.5 };
    expect(validarEmpresa(ok)).toEqual([]);
    expect(validarEmpresa({ ...ok, logoMB: 3 })[0]).toContain('2MB');
    expect(validarEmpresa({ ...ok, cer: '' })[0]).toContain('CSD');
  });

  it('periodos: semanal 20-26 y 27jul-2ago; quincenal corte 16 (15 vs 15.2)', () => {
    expect(periodos('semanal')).toEqual(['20–26 jul', '27 jul–2 ago']);
    expect(periodos('quincenal')).toEqual(['16–31', '1–15']);
    expect(periodos('quincenal', '15.2')).toEqual(['16–31 (15.2)', '1–15 (15.2)']);
  });

  it('ordinaria filtra periodicidad: 6 empleados, solo 3 semanales', () => {
    const emps = [
      { nombre: 'A', periodicidad: 'semanal' }, { nombre: 'B', periodicidad: 'quincenal' },
      { nombre: 'C', periodicidad: 'semanal' }, { nombre: 'D', periodicidad: 'quincenal' },
      { nombre: 'E', periodicidad: 'semanal' }, { nombre: 'F', periodicidad: 'quincenal' },
    ];
    expect(filtroOrdinaria(emps, 'semanal').map((e) => e.nombre)).toEqual(['A', 'C', 'E']);
  });

  it('incidencias solo afectan periodo 20-26 (Camila 3 vac, Emilio 2 HE + 1 fest)', () => {
    const r = aplicarIncidencias('20–26 jul', { vacaciones: 3, he: 2, festivo: 1 });
    expect(r.aplicadas).toBe(true);
    const r2 = aplicarIncidencias('27 jul–2 ago', { vacaciones: 3, he: 2, festivo: 1 });
    expect(r2.aplicadas).toBe(false);
  });

  it('cuentas: toda percepcion/deduccion con cuenta; extraordinaria sin cuenta se detecta', () => {
    expect(validarCuentas([{ concepto: 'Sueldos', cuenta: '501-01' }])).toEqual([]);
    expect(validarCuentas([{ concepto: 'Finiquito', cuenta: '' }])[0]).toContain('Finiquito');
  });

  it('timbrado: palomita + contra caja en efectivo con fecha XML', () => {
    expect(timbrar({ seleccionados: 3, total: 3, contraCaja: true, fechaXML: '2026-07-26' }).ok).toBe(true);
    expect(timbrar({ seleccionados: 0, total: 3, contraCaja: true, fechaXML: '2026-07-26' }).ok).toBe(false);
    expect(timbrar({ seleccionados: 3, total: 3, contraCaja: false, fechaXML: '2026-07-26' }).ok).toBe(false);
  });
});
