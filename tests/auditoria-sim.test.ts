import { describe, expect, it } from 'vitest';
// TASK-D3: AuditoriaSim — motor puro. Goldens del video (VTT) + spec.
// Sin numeros inventados. Cero LLM.
import {
  GOLDENS,
  validarModulo,
  validarHoja,
  cuadrar,
  validarSAT,
  polizaCierre,
  resolverCasoABC,
} from '../alumnos/src/sims/auditoriaEngine';

describe('auditoriaEngine (TASK-D3)', () => {
  it('goldens del video expuestos como constantes', () => {
    expect(GOLDENS.diotBase16).toBe(4606);
    expect(GOLDENS.ingresos).toBe(10000);
    expect(GOLDENS.ivaTrasladado).toBe(1600);
    expect(GOLDENS.egresos).toBe(2787.88);
    expect(GOLDENS.ivaPagado).toBe(424.22);
    expect(GOLDENS.ivaACargo).toBe(194.67);
    expect(GOLDENS.isrSAT).toBe(464);
    expect(GOLDENS.retISR).toBe(1000);
    expect(GOLDENS.ivaRetenido).toBe(1066.67);
    expect(GOLDENS.neto).toBe(99.11);
    expect(GOLDENS.netoRecargos).toBe(132);
    expect(GOLDENS.satCompras).toBe(2714);
    expect(GOLDENS.satIVA).toBe(434);
  });

  it('M1 bloquea DIOT con aviso; M2/M3 permiten', () => {
    expect(validarModulo('M1').bloqueado).toBe(true);
    expect(validarModulo('M1').aviso).toContain('DIOT');
    expect(validarModulo('M2').bloqueado).toBe(false);
    expect(validarModulo('M3').bloqueado).toBe(false);
  });

  it('hoja valida ingresos/egresos/parcial/coeficiente/prorrateo', () => {
    const buena = { ingresos: 10000, ivaTrasladado: 1600, egresos: 2787.88, ivaPagado: 424.22, parcial: 2507, factorParcial: 0.6, coeficiente: 0.32, prorrateo: 0.5 };
    expect(validarHoja(buena)).toEqual([]);
    expect(validarHoja({ ...buena, ingresos: 9000 })[0]).toContain('10000');
    expect(validarHoja({ ...buena, coeficiente: 0.2 })[0]).toContain('0.32');
  });

  it('cuadre: DIOT = hoja = reporte; 464 = 464', () => {
    expect(cuadrar({ diot: 4606, hoja: 4606, reporte: 4606 })).toEqual([]);
    expect(cuadrar({ diot: 4606, hoja: 4600, reporte: 4606 })[0]).toContain('cuadra');
  });

  it('portal SAT: ingresos, compras, IVA ±1, conteos, ISR a favor', () => {
    const bueno = { ingresos: 10000, compras: 2714, iva: 434, pueIng: 1, ppdIng: 7, pueComp: 7, noDeducibles: 3, isr: 464, retIsr: 1000 };
    expect(validarSAT(bueno)).toEqual([]);
    expect(validarSAT({ ...bueno, iva: 436 })[0]).toContain('434');
    expect(validarSAT({ ...bueno, pueComp: 5 })[0]).toContain('7 PUE');
  });

  it('poliza de cierre cuadra debitos = creditos (1600 + 1066.67)', () => {
    const ok = { trasladado: 1600, retenido: 1066.67, acreditable: 2567.56, porPagar: 99.11 };
    expect(polizaCierre(ok)).toEqual([]);
    expect(polizaCierre({ ...ok, porPagar: 100 })[0]).toContain('cuadra');
  });

  it('casos a/b/c: accion correcta aprueba, distractores reprueban', () => {
    expect(resolverCasoABC('a', 'reaplicar-31-dic').ok).toBe(true);
    expect(resolverCasoABC('a', 'dejar-72h').ok).toBe(false);
    expect(resolverCasoABC('b', 'alta-manual-31-ene').ok).toBe(true);
    expect(resolverCasoABC('b', 'esperar-corte').ok).toBe(false);
    expect(resolverCasoABC('c', 'exigir-complemento').ok).toBe(true);
    expect(resolverCasoABC('c', 'omitir-ppd').ok).toBe(false);
  });
});
