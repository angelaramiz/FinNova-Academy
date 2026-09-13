import { describe, it, expect } from 'vitest';
import { generateWorkflow } from '../backend/src/services/workflowEngine';

// TASK-1-1 (Practicas Contalink x4, TDD): mod-conciliacion con los goldens
// del webinar Pedro Castillo. Tasas y montos FIJOS del input (no inventar).

function simularReglas(wf: any, correctas: boolean) {
  const answers: Record<string, any> = {};
  const spread = wf.steps.find((s: any) => s.type === 'spreadsheet');
  const form = wf.steps.find((s: any) => s.type === 'form');
  for (const r of spread.data.rows) {
    answers[`row_${r.label}`] = correctas ? r.cell_B : typeof r.cell_B === 'string' ? 'xx' : 0;
  }
  for (const f of form.data.fields) {
    answers[f.key] = correctas ? f.correct : 'xx';
  }
  let total = 0;
  let max = 0;
  for (const rule of wf.validation) {
    const ua = answers[rule.field];
    if (ua === undefined) continue;
    max += rule.points;
    let passed = false;
    if (rule.type === 'exact' || rule.type === 'choice') {
      passed = String(ua).trim().toLowerCase() === String(rule.expected).trim().toLowerCase();
    } else if (rule.type === 'calculated') {
      passed = Math.abs(Number(ua) - Number(rule.expected)) <= (rule.tolerance ?? 0);
    }
    if (passed) total += rule.points;
  }
  return { total, max };
}

describe('mod-conciliacion: estructura del flujo', () => {
  it('email -> spreadsheet -> decision -> result', () => {
    const wf = generateWorkflow('conciliacion_practica');
    expect(wf.taskType).toBe('conciliacion_practica');
    expect(wf.steps.map((s: any) => s.type)).toEqual(['email', 'spreadsheet', 'form', 'result']);
  });

  it('el correo trae los casos del webinar con goldens exactos', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const body: string = wf.steps.find((s: any) => s.type === 'email').data.body;
    for (const golden of ['50000', '4419.60', '1219.60', '89.50', '65.98', '626.20', '4062', '4000', '51010', '102-01-001', '899', '104', '150', '2018.40', 'BBVA']) {
      expect(body).toContain(golden);
    }
  });
});

describe('mod-conciliacion: validacion con goldens', () => {
  it('toda fila editable tiene su regla row_<label>', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const rows = wf.steps.find((s: any) => s.type === 'spreadsheet').data.rows.filter((r: any) => r.editable);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(wf.validation.some((v: any) => v.field === `row_${r.label}`)).toBe(true);
    }
  });

  it('resto parcial = 4419.60 - 1219.60 = 3200.00', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const rule = wf.validation.find((v: any) => v.label === 'Resto parcial');
    expect(rule?.expected).toBeCloseTo(3200.0, 2);
  });

  it('suma 1-vs-2 = 155.48 y resto = 626.20', () => {
    const wf = generateWorkflow('conciliacion_practica');
    expect(wf.validation.find((v: any) => v.label === 'Suma 1-vs-2')?.expected).toBeCloseTo(155.48, 2);
    expect(wf.validation.find((v: any) => v.label === 'Resto 1-vs-2')?.expected).toBeCloseTo(626.2, 2);
  });

  it('suma N-vs-1 = 8062 contra folio 51010', () => {
    const wf = generateWorkflow('conciliacion_practica');
    expect(wf.validation.find((v: any) => v.label === 'Suma N-vs-1')?.expected).toBe(8062);
  });

  it('TC = 789/45 con todos los decimales y centavo a cuenta', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const tc = wf.validation.find((v: any) => v.label === 'TC aplicado');
    expect(tc?.expected).toBeCloseTo(789 / 45, 4);
    expect(wf.validation.find((v: any) => v.label === 'Diferencia centavo')?.expected).toBeCloseTo(0.01, 2);
  });

  it('traspaso exige cuenta puente (rechaza directo a otro banco)', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const rule = wf.validation.find((v: any) => v.label === 'Contrapartida traspaso');
    expect(rule?.type).toBe('choice');
    expect(String(rule?.expected)).not.toContain('102-01-001');
  });

  it('banco correcto BBVA debito y periodo 13-may -> 13-jun-2025', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const banco = wf.validation.find((v: any) => v.label === 'Banco correcto');
    expect(String(banco?.expected).toLowerCase()).toContain('bbva');
    const periodo = wf.validation.find((v: any) => v.label === 'Periodo');
    expect(String(periodo?.expected)).toContain('13-jun-2025');
  });

  it('NO auto-aprueba: correctas pasan, incorrectas reprueban', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const ok = simularReglas(wf, true);
    expect(ok.total).toBe(ok.max);
    expect(ok.max).toBeGreaterThan(0);
    const mal = simularReglas(wf, false);
    expect(mal.total).toBeLessThan(mal.max * 0.6);
  });
});
