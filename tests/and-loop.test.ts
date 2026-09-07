import { describe, it, expect } from 'vitest';
import {
  freshAndState, nextVariant, registerAttempt,
  setAutoConfirma, setQuizScore, canAdvance,
} from '../backend/src/services/andLoop';
import { getFundamentalWorkflow } from '../backend/src/services/fundamentals';
import { runDEValidator } from '../backend/src/services/deValidation';

// P1-1 (TASK-1-1): bucle AND completo. Contrato congelado 2026-09-03.

describe('P1-1 - variantes por seed (deterministas)', () => {
  it('misma seed + índice → misma variante', () => {
    expect(nextVariant('sql_basico', 0)).toEqual(nextVariant('sql_basico', 0));
  });
  it('índices distintos generan variantId distintos (reproducibles)', () => {
    const a = nextVariant('sql_basico', 0);
    const b = nextVariant('sql_basico', 1);
    expect(a.variantId).not.toBe(b.variantId);
    expect(nextVariant('sql_basico', 1)).toEqual(b);
  });
});

describe('P1-1 - máquina racha/dominio', () => {
  it('pass con seed nueva sube racha y marca pass_practico', () => {
    const s = registerAttempt(freshAndState('sql'), { variantSeed: 'sql#0', passed: true });
    expect(s.racha).toBe(1);
    expect(s.passedPractico).toBe(true);
  });
  it('pass con seed repetida NO farmea racha', () => {
    let s = registerAttempt(freshAndState('sql'), { variantSeed: 'sql#0', passed: true });
    s = registerAttempt(s, { variantSeed: 'sql#0', passed: true });
    expect(s.racha).toBe(1);
    expect(s.attempts).toBe(2);
  });
  it('fail resetea racha y alimenta el quiz', () => {
    let s = registerAttempt(freshAndState('sql'), { variantSeed: 'sql#0', passed: true });
    s = registerAttempt(s, { variantSeed: 'sql#1', passed: false, quizTopic: 'group-by' });
    expect(s.racha).toBe(0);
    expect(s.passedPractico).toBe(false);
    expect(s.quizFocus).toContain('group-by');
  });
});

describe('P1-1 - gate de avance (compuerta AND + quiz)', () => {
  it('bloquea sin pass, sin autoconfianza y sin quiz (4 razones)', () => {
    const v = canAdvance(freshAndState('sql'));
    expect(v.ok).toBe(false);
    expect(v.reasons.length).toBe(4);
  });
  it('avanza con pass + racha + autoconfianza + quiz>=80', () => {
    let s = registerAttempt(freshAndState('sql'), { variantSeed: 'sql#0', passed: true });
    s = setAutoConfirma(s, true);
    s = setQuizScore(s, 85);
    expect(canAdvance(s).ok).toBe(true);
  });
  it('quiz < 80 bloquea aunque el resto pase', () => {
    let s = registerAttempt(freshAndState('sql'), { variantSeed: 'sql#0', passed: true });
    s = setAutoConfirma(s, true);
    s = setQuizScore(s, 70);
    const v = canAdvance(s);
    expect(v.ok).toBe(false);
    expect(v.reasons.join(' ')).toMatch(/80/);
  });
});

describe('P1-1 - estructural en fundamentos (concept 0 pts)', () => {
  it('fund() trae concept en 0 + estructural en 10 (sin auto-aprueba)', () => {
    const wf = getFundamentalWorkflow('sql_basico');
    const concept = wf.validation.find((r: any) => r.validator === 'concept');
    const est = wf.validation.find((r: any) => r.validator === 'estructural');
    expect(concept.points).toBe(0);
    expect(est.points).toBe(10);
    const max = wf.validation.reduce((s: number, v: any) => s + v.points, 0);
    expect(max).toBeGreaterThan(0);
  });
  it('respuesta con enie no suma puntos estructurales', () => {
    const wf = getFundamentalWorkflow('sql_basico');
    const est = wf.validation.find((r: any) => r.validator === 'estructural');
    const r = runDEValidator(est, { [est.field]: 'SELECT año FROM ventas' });
    expect(r.passed).toBe(false);
  });
});
