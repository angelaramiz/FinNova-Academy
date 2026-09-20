// Motor de datos del asiento contable: goldens reales del curso (TDD).
import { describe, it, expect } from 'vitest';
import {
  generarPoliza, conciliarPago, clasificar, calcularLineas, agregarABalanza,
  CASO_MARCELO, EDO_MARCELO, CASO_PPD, CASO_VENTAS, EDO_VENTAS, CASO_CAPITAL, EDO_CAPITAL,
  type CfdiRow,
} from '../backend/src/services/polizaEngine';
import { auditSatCatalog, resolverAgrupador, getSatCuenta } from '../backend/src/services/satCatalog';
import {
  getPracticasModule, auditPracticasModules, evaluatePracticaPrueba,
} from '../backend/src/services/practicasModules';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';

describe('satCatalog: catálogo operativo Anexo 24', () => {
  it('auditoría sin issues', () => {
    expect(auditSatCatalog()).toEqual([]);
  });

  it('caso real del curso: interna → agrupador', () => {
    expect(resolverAgrupador('601-83')).toBe('601.45');
    expect(resolverAgrupador('102-01-002')).toBe('102.01');
    expect(resolverAgrupador('216-03')).toBe('216.03');
    expect(resolverAgrupador('601.45')).toBe('601.45');
    expect(resolverAgrupador('cuenta-fantasma')).toBeNull();
  });

  it('naturalezas del DOF', () => {
    expect(getSatCuenta('601.45')?.naturaleza).toBe('D');
    expect(getSatCuenta('102.01')?.naturaleza).toBe('D');
    expect(getSatCuenta('216.03')?.naturaleza).toBe('H');
    expect(getSatCuenta('201.01')?.naturaleza).toBe('H');
    expect(getSatCuenta('401.01')?.naturaleza).toBe('H');
  });
});

describe('etapa 2: conciliación CFDI vs EDO DE CUENTA', () => {
  it('MARCELO casa exacto con RITO FINANCIERA', () => {
    const c = conciliarPago(CASO_MARCELO, EDO_MARCELO);
    expect(c.confirmado).toBe(true);
    expect(c.banco).toBe('RITO FINANCIERA');
  });

  it('monto distinto no confirma y trae lección', () => {
    const c = conciliarPago(CASO_MARCELO, [{ fecha: '02-01-2025', concepto: 'x', totalPagado: 60000, banco: 'RITO' }]);
    expect(c.confirmado).toBe(false);
    expect(c.leccion?.porQue).toContain('📚');
  });

  it('PPD sin pago es provisión con lección 119.01', () => {
    const c = conciliarPago(CASO_PPD, []);
    expect(c.confirmado).toBe(false);
    expect(c.leccion?.codigo).toBe('PPD_SIN_PAGO');
    expect(c.leccion?.porQue).toContain('119.01');
  });
});

describe('etapa 3: clasificación producto → agrupador', () => {
  it('arrendamiento residencias → 601.45', () => {
    expect(clasificar(CASO_MARCELO).agrupador).toBe('601.45');
  });

  it('gas LP → 601.48, cartucho → 601.56', () => {
    expect(clasificar({ ...CASO_MARCELO, producto: 'LITROS DE GAS L. P.' }).agrupador).toBe('601.48');
    expect(clasificar({ ...CASO_MARCELO, producto: 'CARTUCHO DE FILTRO DE AIRE' }).agrupador).toBe('601.56');
  });

  it('concepto ambiguo no se adivina', () => {
    const c = clasificar({ ...CASO_MARCELO, producto: 'PIERNA' });
    expect(c.agrupador).toBeNull();
    expect(c.leccion?.porQue).toContain('📚');
  });
});

describe('etapa 4-5: MARCELO F (PUE pagado, golden del Excel)', () => {
  it('genera las 3 líneas del ASIENTO 1 y cuadra', () => {
    const r = generarPoliza(CASO_MARCELO, EDO_MARCELO);
    expect(r.errores).toEqual([]);
    expect(r.poliza).not.toBeNull();
    const p = r.poliza!;
    expect(p.tipo).toBe('EGRESOS');
    expect(p.uuid).toBe('1317D7E0-38AC-489F-9082-E75019D8975E');
    expect(p.lineas).toHaveLength(3);
    const porAgr = Object.fromEntries(p.lineas.map(l => [l.agrupador, l]));
    expect(porAgr['601.45'].debe).toBe(70900);
    expect(porAgr['216.03'].haber).toBe(7090);
    expect(porAgr['102.01'].haber).toBe(63810);
    expect(p.totalDebe).toBe(p.totalHaber);
    expect(p.totalDebe).toBe(70900);
  });

  it('retención ISR mal timbrada se rechaza con lección Art. 116', () => {
    const mal: CfdiRow = { ...CASO_MARCELO, isrRet: 7000, total: 63900 };
    const r = generarPoliza(mal, [{ fecha: '02-01-2025', concepto: 'x', totalPagado: 63900, banco: 'RITO' }]);
    expect(r.poliza).toBeNull();
    expect(r.errores[0].codigo).toBe('RET_ISR_ARRENDAMIENTO');
    expect(r.errores[0].porQue).toContain('10%');
  });

  it('CFDI que no cuadra solo se rechaza', () => {
    const mal: CfdiRow = { ...CASO_MARCELO, total: 63000 };
    const r = generarPoliza(mal, EDO_MARCELO);
    expect(r.poliza).toBeNull();
    expect(r.errores[0].codigo).toBe('CFDI_NO_CUADRA');
  });
});

describe('ruta PPD: provisión con 119.01, sin bancos', () => {
  it('golden 1000/160/1160 del Excel', () => {
    const r = generarPoliza(CASO_PPD, []);
    expect(r.errores).toEqual([]);
    const p = r.poliza!;
    expect(p.tipo).toBe('PROVISION');
    const porAgr = Object.fromEntries(p.lineas.map(l => [l.agrupador, l]));
    expect(porAgr['601.45'].debe).toBe(1000);
    expect(porAgr['119.01'].debe).toBe(160);
    expect(porAgr['201.01'].haber).toBe(1160);
    expect(p.lineas.some(l => l.agrupador === '102.01')).toBe(false);
    expect(p.totalDebe).toBe(p.totalHaber);
  });
});

describe('ingresos y capital (naturaleza acreedora)', () => {
  it('ventas: D bancos 26680 / H 401.01 23000 / H 208.01 3680', () => {
    const r = generarPoliza(CASO_VENTAS, EDO_VENTAS);
    expect(r.errores).toEqual([]);
    const p = r.poliza!;
    const porAgr = Object.fromEntries(p.lineas.map(l => [l.agrupador, l]));
    expect(porAgr['102.01'].debe).toBe(26680);
    expect(porAgr['401.01'].haber).toBe(23000);
    expect(porAgr['208.01'].haber).toBe(3680);
    expect(p.totalDebe).toBe(p.totalHaber);
  });

  it('capital: D bancos 50000 / H 301.01 50000', () => {
    const r = generarPoliza(CASO_CAPITAL, EDO_CAPITAL);
    expect(r.errores).toEqual([]);
    const p = r.poliza!;
    const porAgr = Object.fromEntries(p.lineas.map(l => [l.agrupador, l]));
    expect(porAgr['102.01'].debe).toBe(50000);
    expect(porAgr['301.01'].haber).toBe(50000);
  });
});

describe('etapa 5b: balanza por agrupador (sección B)', () => {
  it('acumula debe/haber y respeta naturaleza', () => {
    const r = generarPoliza(CASO_MARCELO, EDO_MARCELO);
    const bal = agregarABalanza(new Map(), r.poliza!);
    expect(bal.get('601.45')?.saldoFinal).toBe(70900);
    expect(bal.get('216.03')?.saldoFinal).toBe(7090);
    expect(bal.get('102.01')?.saldoFinal).toBe(-63810);
  });
});

describe('coherencia R-09 del motor', () => {
  it('toda línea generada tiene agrupador válido y la póliza cuadra', () => {
    for (const [cfdi, edo] of [[CASO_MARCELO, EDO_MARCELO], [CASO_PPD, []], [CASO_VENTAS, EDO_VENTAS], [CASO_CAPITAL, EDO_CAPITAL]] as const) {
      const r = generarPoliza(cfdi, edo as typeof EDO_MARCELO);
      expect(r.errores).toEqual([]);
      const debe = r.poliza!.lineas.reduce((s, l) => s + l.debe, 0);
      const haber = r.poliza!.lineas.reduce((s, l) => s + l.haber, 0);
      expect(Math.abs(debe - haber)).toBeLessThan(0.011);
      for (const l of r.poliza!.lineas) {
        expect(getSatCuenta(l.agrupador)).toBeDefined();
      }
    }
  });

  it('calcularLineas expone errores con lección en cada fallo', () => {
    const c = calcularLineas(CASO_MARCELO, { agrupador: null, nota: 'x', leccion: { codigo: 'T', mensaje: 'm', porQue: '📚 p' } }, { confirmado: true }, {});
    expect(c.lineas).toEqual([]);
    expect(c.errores[0].porQue).toContain('📚');
  });
});

describe('módulo mod-polizas (carpeta Contalink)', () => {
  it('existe con plataforma contalink, prueba y curso del capacitador', () => {
    const m = getPracticasModule('mod-polizas');
    expect(m?.plataforma).toBe('contalink');
    expect(m?.prueba.preguntas).toHaveLength(3);
    expect(m?.curso.secciones).toHaveLength(3);
    expect(m?.curso.npc).toBe('capacitador');
    expect(m?.pasos.some(p => p.taskType === 'poliza_practica')).toBe(true);
  });

  it('poliza_practica está registrada en los workflowTypes contables', () => {
    expect(getSpecialtyWorkflows('accounting')).toContain('poliza_practica');
  });

  it('auditoría de módulos sin issues', () => {
    expect(auditPracticasModules(getSpecialtyWorkflows('accounting'))).toEqual([]);
  });

  it('prueba: 0/1/1 aprueba, 1/0/0 reprueba con explicación', () => {
    const ok = evaluatePracticaPrueba('mod-polizas', [0, 1, 1]);
    expect(ok.aprobado).toBe(true);
    expect(ok.scorePct).toBe(100);
    const mal = evaluatePracticaPrueba('mod-polizas', [1, 0, 0]);
    expect(mal.aprobado).toBe(false);
    expect(mal.resultados[0].explicacion).toContain('63,810');
  });
});
