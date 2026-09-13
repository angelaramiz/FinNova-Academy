import { describe, it, expect } from 'vitest';
import { generateWorkflow } from '../backend/src/services/workflowEngine';
import { auditPracticasModules } from '../backend/src/services/practicasModules';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';

// TASK-2-2 (Practicas Contalink x4): QA end-to-end. Replica la logica de
// POST /validate (exact/choice insensible a caso, calculated con tolerancia,
// umbral 60%): con goldens APRUEBA; con cada error tipico del Q&A, la regla
// correspondiente REPRUEBA. Sin codigo productivo nuevo: verificacion.

function evaluar(wf: any, answers: Record<string, any>) {
  let total = 0;
  let max = 0;
  const porRegla: Record<string, boolean> = {};
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
    porRegla[rule.label] = passed;
    if (passed) total += rule.points;
  }
  return { total, max, porRegla, aprobado: max > 0 && total >= max * 0.6 };
}

function respuestasCorrectas(wf: any): Record<string, any> {
  const answers: Record<string, any> = {};
  const spread = wf.steps.find((s: any) => s.type === 'spreadsheet');
  const form = wf.steps.find((s: any) => s.type === 'form');
  for (const r of spread.data.rows) answers[`row_${r.label}`] = r.cell_B;
  for (const f of form.data.fields) answers[f.key] = f.correct;
  return answers;
}

const MODULOS = ['conciliacion_practica', 'auditoria_practica', 'nomina_practica', 'reporte_practica'];

describe('e2e Contalink x4: goldens aprueban de punta a punta', () => {
  it.each(MODULOS)('%s aprueba con goldens', (type) => {
    const wf = generateWorkflow(type);
    const r = evaluar(wf, respuestasCorrectas(wf));
    expect(r.aprobado).toBe(true);
    expect(r.total).toBe(r.max);
  });

  it('audit cubre los 10 modulos en verde', () => {
    const issues = auditPracticasModules(getSpecialtyWorkflows('accounting'));
    expect(issues).toEqual([]);
  });
});

describe('e2e Contalink x4: errores tipicos reprueban su regla', () => {
  it('conciliacion: directo a otro banco reprueba contrapartida', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const a = respuestasCorrectas(wf);
    a['contrapartida'] = '102-01-001 (directo a otro banco)';
    const r = evaluar(wf, a);
    expect(r.porRegla['Contrapartida traspaso']).toBe(false);
  });

  it('conciliacion: TC redondeado a 2 decimales reprueba', () => {
    const wf = generateWorkflow('conciliacion_practica');
    const a = respuestasCorrectas(wf);
    a['row_TC aplicado'] = 17.53;
    const r = evaluar(wf, a);
    expect(r.porRegla['TC aplicado']).toBe(false);
  });

  it('auditoria: DIOT por fecha de emision reprueba (reporte: Dic queda Fuera->Ene)', () => {
    const wf = generateWorkflow('reporte_practica');
    const a = respuestasCorrectas(wf);
    a['row_Op Dic-emitida/Ene-pagada'] = 'Dic';
    const r = evaluar(wf, a);
    expect(r.porRegla['Op Dic-emitida/Ene-pagada']).toBe(false);
  });

  it('nomina: 15% fijo reprueba metodo ISR', () => {
    const wf = generateWorkflow('nomina_practica');
    const a = respuestasCorrectas(wf);
    a['metodo'] = '15% fijo';
    const r = evaluar(wf, a);
    expect(r.porRegla['Método ISR']).toBe(false);
  });

  it('reporte: nov-2025 en Normal reprueba (ya existe en SAT)', () => {
    const wf = generateWorkflow('reporte_practica');
    const a = respuestasCorrectas(wf);
    a['nov2025'] = 'Normal';
    const r = evaluar(wf, a);
    expect(r.porRegla['Tipo caso nov-2025']).toBe(false);
  });

  it('reporte: reenviar de inmediato reprueba', () => {
    const wf = generateWorkflow('reporte_practica');
    const a = respuestasCorrectas(wf);
    a['reenvio'] = 'Sí';
    const r = evaluar(wf, a);
    expect(r.porRegla['Reenviar inmediato']).toBe(false);
  });
});
