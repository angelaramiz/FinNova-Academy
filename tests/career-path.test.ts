import { describe, it, expect } from 'vitest';
import {
  freshCareerPath,
  computePracticePct,
  computeUnlock,
  applyProgress,
  chooseBranch,
  applyDemoOverride,
  resetCareer,
  UNLOCK_PCT,
  careerAppSet,
  PracticeBreakdown,
} from '../backend/src/services/careerPath';

function bd(tasks: [number, number], sims: [number, number], cases: [number, number]): PracticeBreakdown {
  return {
    tasks: { done: tasks[0], total: tasks[1] },
    sims: { validated: sims[0], total: sims[1] },
    cases: { done: cases[0], total: cases[1] },
  };
}

describe('careerPath — árbol de rutas de la especialidad Data', () => {
  it('freshCareerPath inicia como analista sin rama elegida y sin desbloqueos', () => {
    const cp = freshCareerPath();
    expect(cp.currentNode).toBe('analyst');
    expect(cp.chosenBranch).toBeNull();
    expect(cp.practicePct).toBe(0);
    expect(cp.unlocked.data_engineering).toBe(false);
    expect(cp.unlocked.data_science).toBe(false);
    expect(cp.demoOverride.enabled).toBe(false);
    expect(careerAppSet(cp)).toBe('analyst');
  });

  it('computePracticePct pondera 45/35/20', () => {
    // tasks 6/12 (0.5) · sims 4/8 (0.5) · cases 1/3 (0.333)
    expect(computePracticePct(bd([6, 12], [4, 8], [1, 3]))).toBe(Math.round(100 * (0.45 * 0.5 + 0.35 * 0.5 + 0.20 * (1 / 3))));
    // sin actividad = 0
    expect(computePracticePct(bd([0, 12], [0, 8], [0, 3]))).toBe(0);
    // todo completo = 100
    expect(computePracticePct(bd([12, 12], [8, 8], [3, 3]))).toBe(100);
  });

  it('desbloquea a partir de UNLOCK_PCT=40 con casos límite 39/40/41', () => {
    expect(computeUnlock(39)).toBe(false);
    expect(computeUnlock(40)).toBe(true);
    expect(computeUnlock(41)).toBe(true);
    expect(UNLOCK_PCT).toBe(40);
  });

  it('applyProgress recalcula practicePct y desbloquea ambas ramas al pasar 40', () => {
    const cp = freshCareerPath();
    // 5/12, 4/8, 1/3 → ~50% → desbloquea
    const next = applyProgress(cp, bd([5, 12], [4, 8], [1, 3]));
    expect(next.practicePct).toBeGreaterThanOrEqual(40);
    expect(next.unlocked.data_engineering).toBe(true);
    expect(next.unlocked.data_science).toBe(true);
    expect(next.history.some(h => h.event === 'UNLOCK')).toBe(true);
  });

  it('chooseBranch es irreversible y solo si está desbloqueada', () => {
    let cp = freshCareerPath();
    // bloqueada: no se puede elegir
    expect(chooseBranch(cp, 'data_engineering').chosenBranch).toBeNull();
    // desbloqueada por progreso
    cp = applyProgress(cp, bd([12, 12], [8, 8], [3, 3]));
    const chosen = chooseBranch(cp, 'data_engineering');
    expect(chosen.chosenBranch).toBe('data_engineering');
    expect(chosen.currentNode).toBe('data_engineering');
    expect(careerAppSet(chosen)).toBe('engineering');
    // irreversible: elegir otra rama no cambia
    expect(chooseBranch(chosen, 'data_science').chosenBranch).toBe('data_engineering');
  });

  it('el demo override fuerza unlocked SIN mutar practicePct', () => {
    const cp = freshCareerPath();
    const before = cp.practicePct;
    const demoOn = applyDemoOverride(cp, true);
    expect(demoOn.demoOverride.enabled).toBe(true);
    expect(demoOn.unlocked.data_engineering).toBe(true);
    expect(demoOn.unlocked.data_science).toBe(true);
    expect(demoOn.practicePct).toBe(before); // inmutable
    expect(demoOn.history.some(h => h.event === 'DEMO_ON')).toBe(true);

    // Apagado: vuelve a regir el progreso (0% → bloqueadas)
    const demoOff = applyDemoOverride(demoOn, false);
    expect(demoOff.demoOverride.enabled).toBe(false);
    expect(demoOff.unlocked.data_engineering).toBe(false);
    expect(demoOff.practicePct).toBe(before);
    expect(demoOff.history.some(h => h.event === 'DEMO_OFF')).toBe(true);
  });

  it('resetCareer devuelve a analista sin rama ni demo', () => {
    let cp = applyDemoOverride(freshCareerPath(), true);
    cp = chooseBranch(cp, 'data_science');
    const reset = resetCareer();
    expect(reset.currentNode).toBe('analyst');
    expect(reset.chosenBranch).toBeNull();
    expect(reset.demoOverride.enabled).toBe(false);
  });

  it('careerAppSet mapea la fase correcta', () => {
    const eng = chooseBranch(applyProgress(freshCareerPath(), bd([12, 12], [8, 8], [3, 3])), 'data_engineering');
    expect(careerAppSet(eng)).toBe('engineering');
    const sci = chooseBranch(applyProgress(freshCareerPath(), bd([12, 12], [8, 8], [3, 3])), 'data_science');
    expect(careerAppSet(sci)).toBe('science');
    const ana = applyDemoOverride(freshCareerPath(), true);
    expect(careerAppSet(ana)).toBe('analyst');
  });
});
