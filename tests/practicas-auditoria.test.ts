import { describe, it, expect } from 'vitest';
import { generateWorkflow } from '../backend/src/services/workflowEngine';

// TASK-1-2 (Practicas Contalink x4, TDD): mod-auditoria con los goldens
// del webinar (directora + Pedro). Montos FIJOS del input.

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

describe('mod-auditoria: estructura del flujo', () => {
  it('email -> spreadsheet -> decision -> result', () => {
    const wf = generateWorkflow('auditoria_practica');
    expect(wf.taskType).toBe('auditoria_practica');
    expect(wf.steps.map((s: any) => s.type)).toEqual(['email', 'spreadsheet', 'form', 'result']);
  });

  it('el correo trae M1/M2/M3 y goldens exactos', () => {
    const wf = generateWorkflow('auditoria_practica');
    const body: string = wf.steps.find((s: any) => s.type === 'email').data.body;
    for (const golden of ['M1', 'M2', 'M3', '194.67', '10000', '1600', '2787.88', '424.22', '4606', '2507', '0.32', '1000', '1066.67', '99.11', '132', '464', '2714', '434']) {
      expect(body).toContain(golden);
    }
  });
});

describe('mod-auditoria: validacion con goldens', () => {
  it('toda fila editable tiene su regla row_<label>', () => {
    const wf = generateWorkflow('auditoria_practica');
    const rows = wf.steps.find((s: any) => s.type === 'spreadsheet').data.rows.filter((r: any) => r.editable);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(wf.validation.some((v: any) => v.field === `row_${r.label}`)).toBe(true);
    }
  });

  it('M1 bloquea la DIOT', () => {
    const wf = generateWorkflow('auditoria_practica');
    const rule = wf.validation.find((v: any) => v.label === 'Módulo que bloquea DIOT');
    expect(rule?.type).toBe('choice');
    expect(String(rule?.expected)).toContain('M1');
  });

  it('IVA a cargo = 194.67', () => {
    const wf = generateWorkflow('auditoria_practica');
    expect(wf.validation.find((v: any) => v.label === 'IVA a cargo')?.expected).toBeCloseTo(194.67, 2);
  });

  it('DIOT base 16% = 4606 y parcial 2507 al 60% = 1504.20', () => {
    const wf = generateWorkflow('auditoria_practica');
    expect(wf.validation.find((v: any) => v.label === 'DIOT base 16%')?.expected).toBe(4606);
    expect(wf.validation.find((v: any) => v.label === 'Parcial al 60%')?.expected).toBeCloseTo(1504.2, 2);
  });

  it('casos a/b/c: 72h, corte bancario, sin complemento', () => {
    const wf = generateWorkflow('auditoria_practica');
    const labels = wf.validation.map((v: any) => v.label);
    expect(labels).toContain('Caso a');
    expect(labels).toContain('Caso b');
    expect(labels).toContain('Caso c');
    const a = wf.validation.find((v: any) => v.label === 'Caso a');
    expect(String(a?.expected)).toContain('72');
  });

  it('balanza 464 = 464 -> diferencia 0', () => {
    const wf = generateWorkflow('auditoria_practica');
    expect(wf.validation.find((v: any) => v.label === 'Diferencia balanza')?.expected).toBe(0);
  });

  it('NO auto-aprueba: correctas pasan, incorrectas reprueban', () => {
    const wf = generateWorkflow('auditoria_practica');
    const ok = simularReglas(wf, true);
    expect(ok.total).toBe(ok.max);
    expect(ok.max).toBeGreaterThan(0);
    const mal = simularReglas(wf, false);
    expect(mal.total).toBeLessThan(mal.max * 0.6);
  });
});
