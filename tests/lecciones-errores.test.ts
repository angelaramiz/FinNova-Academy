import { describe, expect, it } from 'vitest';
// P1 pedagogía: cada error de validación debe traer su micro-lección
// (marcador 📚 + fundamento). Si un mensaje no educa, el test falla.
import { validarEmpresa, validarCuentas, timbrar } from '../alumnos/src/sims/nominaEngine';
import { validarAltaBanco, validarCaratula, validarCierre } from '../alumnos/src/sims/conciliacionEngine';
import { validarHoja, cuadrar, validarSAT, polizaCierre } from '../alumnos/src/sims/auditoriaEngine';
import { validarOperacion, ESCENARIO_TUTORIAL } from '../alumnos/src/sims/diotEngine';

function todosEducan(errs: string[], quien: string) {
  expect(errs.length, `${quien} debe reportar errores`).toBeGreaterThan(0);
  for (const e of errs) expect(e, `${quien}: sin micro-lección → "${e}"`).toContain('📚');
}

describe('P1 retroalimentación educativa', () => {
  it('nómina: empresa, cuentas y timbrado educan', () => {
    todosEducan(validarEmpresa({ razon: '', regimen: '', cp: '', cer: '', key: 'k', pass: 'p', logoMB: 3 }), 'validarEmpresa');
    todosEducan(validarCuentas([{ concepto: 'Finiquito', cuenta: '' }]), 'validarCuentas');
    const t = timbrar({ seleccionados: 0, total: 3, contraCaja: false, fechaXML: '' });
    expect(t.ok).toBe(false);
    expect(t.mensaje).toContain('📚');
  });
  it('conciliación: alta, carátula y cierre educan', () => {
    todosEducan(
      validarAltaBanco({ nombre: '', cuenta: '', saldoInicial: -1, clabe: '12345', moneda: 'EUR' as 'MN' }),
      'validarAltaBanco',
    );
    todosEducan(validarCaratula({ inicial: 50000, depositos: 20000, retiros: 15000, final: 1 }), 'validarCaratula');
    todosEducan(
      validarCierre({ fechaPoliza: '2025-06-11', fechaMovimiento: '2025-06-10', contrapartida: '102-01-001', cuentaBanco: '102-01-001' }),
      'validarCierre',
    );
  });
  it('auditoría: hoja, cuadre, SAT y póliza educan', () => {
    todosEducan(
      validarHoja({ ingresos: 1, ivaTrasladado: 1, egresos: 1, ivaPagado: 1, parcial: 1, factorParcial: 1, coeficiente: 0.2, prorrateo: 1 }),
      'validarHoja',
    );
    todosEducan(cuadrar({ diot: 1, hoja: 2, reporte: 3 }), 'cuadrar');
    todosEducan(
      validarSAT({ ingresos: 1, compras: 1, iva: 1, pueIng: 0, ppdIng: 0, pueComp: 0, noDeducibles: 0, isr: 1, retIsr: 1 }),
      'validarSAT',
    );
    todosEducan(polizaCierre({ trasladado: 1600, retenido: 0, acreditable: 424.22, porPagar: 100 }), 'polizaCierre');
  });
  it('DIOT: validarOperacion educa (RFC 13, monto positivo, IVA x tasa)', () => {
    const op = { ...ESCENARIO_TUTORIAL.operaciones[0], rfc: 'CORTO', monto: -5, iva: 999 };
    const errs = validarOperacion(op);
    expect(errs.length).toBe(3);
    todosEducan(errs, 'validarOperacion');
    expect(errs[0]).toContain('RFC');
  });
});
