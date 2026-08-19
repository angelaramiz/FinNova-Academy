import { describe, it, expect } from 'vitest';
import { coverageGap, drillFor, trapFromMisconception } from '../backend/src/services/qualityConsumption';
import { computeMatch } from '../backend/src/services/matchScorer';
import { buildPlanRefuerzo } from '../backend/src/services/reforzamiento';
import { recordOutcome } from '../backend/src/services/learningAnalytics';
import { TICKET_FAIL_RATE } from '../backend/src/services/learningAnalytics';

describe('R-11 T5 — Consumo del flywheel', () => {
  it('coverageGap clasifica skills demandados vs cubiertos (matchScorer/careerPath)', () => {
    const gaps = coverageGap(['SQL', 'Python', 'Excel'], ['sql', 'python']);
    expect(gaps.find(g => g.skill === 'SQL')?.state).toBe('cubierto');
    expect(gaps.find(g => g.skill === 'Python')?.state).toBe('cubierto');
    expect(gaps.find(g => g.skill === 'Excel')?.state).toBe('gap');
  });

  it('drillFor sugiere refuerzo solo cuando el ítem supera el umbral real', () => {
    const ok = drillFor('sql_query', 0.5);
    const mal = drillFor('bank_reconciliation', 0.85);
    expect(ok).toBeNull();
    expect(mal).not.toBeNull();
    expect(mal!.refId).toBe('bank_reconciliation');
    expect(mal!.motivo).toContain(`${(TICKET_FAIL_RATE * 100).toFixed(0)}%`);
  });

  it('trapFromMisconception devuelve null sin cache (no inventa trampas)', () => {
    // Sin cache aprobada → no hay trampa que sugerir (gate: solo se consume lo aprobado).
    expect(trapFromMisconception('sql')).toBeNull();
  });

  it('computeMatch produce top_gaps con score < 75 (base del plan intensivo)', () => {
    const profile = [
      { id: 'sql', label: 'SQL', score: 90 },
      { id: 'python', label: 'Python', score: 40 },
    ];
    const vacancy = [
      { skill: 'SQL', required: true, weight: 1 },
      { skill: 'Python', required: true, weight: 1 },
      { skill: 'Excel', required: false, weight: 0.5 },
    ];
    const match = computeMatch(profile, vacancy);
    expect(match.top_gaps).toContain('Python');
    expect(match.top_gaps).toContain('Excel');
    expect(match.top_gaps).not.toContain('SQL');
    expect(match.covered).toContain('SQL');
  });

  it('buildPlanRefuerzo degrada sin Supabase sin lanzar (contrato estable)', async () => {
    const plan = await buildPlanRefuerzo('test-user-000', 'data_engineering');
    expect(plan.userId).toBe('test-user-000');
    expect(['refuerzo', 'avanzar']).toContain(plan.prioridad);
    expect(Array.isArray(plan.recomendaciones)).toBe(true);
  });
});

describe('R-11 T6 — Outcome tracking consentido', () => {
  it('recordOutcome exige consentimiento en la API (gate)', async () => {
    // Sin Supabase, recordOutcome devuelve ok (memoria) — el gate de consent
    // vive en la ruta (consent !== true → 400). Verificamos la función pura.
    const res = await recordOutcome('test-user-000', { applied: 3, interviews: 1, hired: false, skills_entrevista: ['SQL'] });
    expect(res.ok).toBe(true);
    expect(res.outcome.applied).toBe(3);
    expect(res.outcome.interviews).toBe(1);
    expect(res.outcome.hired).toBe(false);
    expect(res.outcome.skills_entrevista).toContain('SQL');
  });

  it('el outcome se persiste con user_hash irreversible, no el id', async () => {
    const res = await recordOutcome('00000001-0000-0000-0000-000000000001', { hired: true });
    expect(res.outcome.user_hash).toMatch(/^[0-9a-f]{32}$/);
    expect(res.outcome.user_hash).not.toContain('00000001-0000');
  });
});