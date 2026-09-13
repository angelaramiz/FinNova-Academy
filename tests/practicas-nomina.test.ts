import { describe, it, expect } from 'vitest';
import { generateWorkflow } from '../backend/src/services/workflowEngine';

// TASK-1-3 (Practicas Contalink x4, TDD): mod-nomina con goldens del video
// + tarifa ISR progresiva R-14 (NO 15% fijo). Montos del input; el split del
// finiquito es dato del caso (scaffolding como MOV_FECHA en conciliacion).

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

describe('mod-nomina: estructura del flujo', () => {
  it('email -> spreadsheet -> decision -> result', () => {
    const wf = generateWorkflow('nomina_practica');
    expect(wf.taskType).toBe('nomina_practica');
    expect(wf.steps.map((s: any) => s.type)).toEqual(['email', 'spreadsheet', 'form', 'result']);
  });

  it('el correo trae goldens y prohibe el 15% fijo', () => {
    const wf = generateWorkflow('nomina_practica');
    const body: string = wf.steps.find((s: any) => s.type === 'email').data.body;
    for (const golden of ['318.19', '300', '10000', 'Camila', 'Emilio', '15%']) {
      expect(body).toContain(golden);
    }
  });
});

describe('mod-nomina: validacion con goldens + tarifa R-14', () => {
  it('toda fila editable tiene su regla row_<label>', () => {
    const wf = generateWorkflow('nomina_practica');
    const rows = wf.steps.find((s: any) => s.type === 'spreadsheet').data.rows.filter((r: any) => r.editable);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(wf.validation.some((v: any) => v.field === `row_${r.label}`)).toBe(true);
    }
  });

  it('sueldo semanal = 318.19 x 7 = 2227.33', () => {
    const wf = generateWorkflow('nomina_practica');
    expect(wf.validation.find((v: any) => v.label === 'Sueldo semanal 7 días')?.expected).toBeCloseTo(2227.33, 2);
  });

  it('ISR con tarifa progresiva, nunca 15% fijo', () => {
    const wf = generateWorkflow('nomina_practica');
    const rule = wf.validation.find((v: any) => v.label === 'Método ISR');
    expect(String(rule?.expected).toLowerCase()).toContain('progresiva');
    expect(String(rule?.expected)).not.toContain('15%');
    // Asimilada 10000 -> solo ISR: 115.2 + 4000 x 6.4% = 371.2 -> 371
    expect(wf.validation.find((v: any) => v.label === 'ISR asimilada')?.expected).toBe(371);
  });

  it('minimo -> ISR e IMSS en 0', () => {
    const wf = generateWorkflow('nomina_practica');
    expect(wf.validation.find((v: any) => v.label === 'ISR con mínimo')?.expected).toBe(0);
  });

  it('3 semanales de 6 empleados; Camila 3 vacaciones; Emilio 2 HE + 1 festivo', () => {
    const wf = generateWorkflow('nomina_practica');
    const labels = wf.validation.map((v: any) => v.label);
    for (const l of ['Semanales que entran', 'Vacaciones Camila', 'HE Emilio', 'Festivo Emilio']) {
      expect(labels).toContain(l);
    }
    expect(wf.validation.find((v: any) => v.label === 'Semanales que entran')?.expected).toBe(3);
  });

  it('prima a 5 dias y excedio exento', () => {
    const wf = generateWorkflow('nomina_practica');
    expect(wf.validation.find((v: any) => v.label === 'Prima días')?.expected).toBe(5);
    const excede = wf.validation.find((v: any) => v.label === 'Prima excede exento');
    expect(String(excede?.expected).toLowerCase()).toContain('sí');
  });

  it('NO auto-aprueba: correctas pasan, incorrectas reprueban', () => {
    const wf = generateWorkflow('nomina_practica');
    const ok = simularReglas(wf, true);
    expect(ok.total).toBe(ok.max);
    expect(ok.max).toBeGreaterThan(0);
    const mal = simularReglas(wf, false);
    expect(mal.total).toBeLessThan(mal.max * 0.6);
  });
});
