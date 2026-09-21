import { describe, expect, it } from 'vitest';
// TASK-D5: cableado tarea real -> Sim. La regla dura vive aqui: solo los 5
// taskTypes *_practica rutean a Sim; los genericos (contabilidad) quedan
// fuera del mapa y siguen al fallback.
import { SIM_POR_TAREA, SIM_POR_MODULO, simParaTarea } from '../alumnos/src/sims/simsContalink';

describe('simsContalink (TASK-D5, regla dura)', () => {
  it('los 5 taskTypes practica rutean a su Sim', () => {
    expect(simParaTarea('conciliacion_practica')).toBe('sim-conciliacion');
    expect(simParaTarea('auditoria_practica')).toBe('sim-auditoria');
    expect(simParaTarea('nomina_practica')).toBe('sim-nomina');
    expect(simParaTarea('reporte_practica')).toBe('sim-diot');
    expect(simParaTarea('poliza_practica')).toBe('sim-poliza');
  });

  it('los 5 modulos Contalink rutean a su Sim', () => {
    expect(SIM_POR_MODULO['mod-conciliacion']).toBe('sim-conciliacion');
    expect(SIM_POR_MODULO['mod-auditoria']).toBe('sim-auditoria');
    expect(SIM_POR_MODULO['mod-nomina-web']).toBe('sim-nomina');
    expect(SIM_POR_MODULO['mod-reporte']).toBe('sim-diot');
    expect(SIM_POR_MODULO['mod-polizas']).toBe('sim-poliza');
  });

  it('genericos de contabilidad NO estan en el mapa (fallback intacto)', () => {
    for (const t of ['invoice_emission', 'payment_registration', 'supplier_invoice', 'business_expense', 'payroll', 'bank_reconciliation', 'journal_entry']) {
      expect(simParaTarea(t)).toBeNull();
    }
  });

  it('el mapa tiene exactamente 5 entradas (nada mas rutea a Sim)', () => {
    expect(Object.keys(SIM_POR_TAREA)).toHaveLength(5);
    expect(Object.keys(SIM_POR_MODULO)).toHaveLength(5);
  });
});
