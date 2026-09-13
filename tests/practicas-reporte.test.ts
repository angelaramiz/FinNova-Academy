import { describe, it, expect } from 'vitest';
import { generateWorkflow } from '../backend/src/services/workflowEngine';

// TASK-1-4 (Practicas Contalink x4, TDD): mod-reporte con los goldens del
// video Diego Ramos (DIOT online + acuse). El folio del acuse es dato del
// caso (scaffolding).

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

describe('mod-reporte: estructura del flujo', () => {
  it('email -> spreadsheet -> decision -> result', () => {
    const wf = generateWorkflow('reporte_practica');
    expect(wf.taskType).toBe('reporte_practica');
    expect(wf.steps.map((s: any) => s.type)).toEqual(['email', 'spreadsheet', 'form', 'result']);
  });

  it('el correo trae ruta, columnas y periodo enero 2026', () => {
    const wf = generateWorkflow('reporte_practica');
    const body: string = wf.steps.find((s: any) => s.type === 'email').data.body;
    for (const golden of ['Contabilidad', 'DIOT', '23', '54', 'enero 2026', 'nov-2025', 'Complementaria']) {
      expect(body).toContain(golden);
    }
  });
});

describe('mod-reporte: validacion con goldens', () => {
  it('toda fila editable tiene su regla row_<label>', () => {
    const wf = generateWorkflow('reporte_practica');
    const rows = wf.steps.find((s: any) => s.type === 'spreadsheet').data.rows.filter((r: any) => r.editable);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(wf.validation.some((v: any) => v.field === `row_${r.label}`)).toBe(true);
    }
  });

  it('columnas TXT: 23 pre-2025 y 54 en 2025+', () => {
    const wf = generateWorkflow('reporte_practica');
    expect(wf.validation.find((v: any) => v.label === 'Columnas pre-2025')?.expected).toBe(23);
    expect(wf.validation.find((v: any) => v.label === 'Columnas 2025+')?.expected).toBe(54);
  });

  it('fecha DIOT = fecha pago: Dic/Ene y PPD van a Ene; canceladas y manual fuera', () => {
    const wf = generateWorkflow('reporte_practica');
    const v = (label: string) => wf.validation.find((x: any) => x.label === label)?.expected;
    expect(String(v('Op Dic-emitida/Ene-pagada'))).toContain('Ene');
    expect(String(v('Op PPD + complemento'))).toContain('Ene');
    expect(String(v('Op cancelada'))).toContain('Fuera');
    expect(String(v('Op póliza manual'))).toContain('Fuera');
  });

  it('caso nov-2025: como hay Normal en SAT va Complementaria', () => {
    const wf = generateWorkflow('reporte_practica');
    const rule = wf.validation.find((v: any) => v.label === 'Tipo caso nov-2025');
    expect(String(rule?.expected)).toContain('Complementaria');
  });

  it('SAT caido: esperar 1-2h, maximo 5/dia, no reenviar', () => {
    const wf = generateWorkflow('reporte_practica');
    const labels = wf.validation.map((v: any) => v.label);
    for (const l of ['Espera SAT caído', 'Reenvíos por día', 'Reenviar inmediato']) {
      expect(labels).toContain(l);
    }
    expect(wf.validation.find((v: any) => v.label === 'Reenvíos por día')?.expected).toBe('5');
  });

  it('cierre con folio de acuse + TXT identico al enviado', () => {
    const wf = generateWorkflow('reporte_practica');
    const labels = wf.validation.map((v: any) => v.label);
    expect(labels).toContain('Folio acuse');
    expect(labels).toContain('TXT idéntico');
  });

  it('NO auto-aprueba: correctas pasan, incorrectas reprueban', () => {
    const wf = generateWorkflow('reporte_practica');
    const ok = simularReglas(wf, true);
    expect(ok.total).toBe(ok.max);
    expect(ok.max).toBeGreaterThan(0);
    const mal = simularReglas(wf, false);
    expect(mal.total).toBeLessThan(mal.max * 0.6);
  });
});
