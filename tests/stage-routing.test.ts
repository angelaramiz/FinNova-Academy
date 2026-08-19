import { describe, it, expect } from 'vitest';
import { routeStage, UMBRAL_DENSIDAD } from '../backend/src/services/stageRouter';
import { computeMatch, UMBRAL_MODO_A } from '../backend/src/services/matchScorer';
import { analyzeVacancyDeterministic } from '../backend/src/services/vacancyAnalyzer';

describe('R-10 v2 — stageRouter (Etapa 1 → routing)', () => {
  it('match 74 → Modo B', () => {
    expect(routeStage({ match_pct: 74, requires_experience: false, experience_density: 0 })).toBe('ETAPA_2_MODO_B');
  });

  it('match 75 → Modo A', () => {
    expect(routeStage({ match_pct: 75, requires_experience: false, experience_density: 0 })).toBe('ETAPA_2_MODO_A');
  });

  it('match 76 → Modo A', () => {
    expect(routeStage({ match_pct: 76, requires_experience: false, experience_density: 0 })).toBe('ETAPA_2_MODO_A');
  });

  it('vacante que exige años sin densidad → Etapa 3', () => {
    expect(routeStage({ match_pct: 90, requires_experience: true, experience_density: 0 })).toBe('ETAPA_3');
  });

  it('vacante que exige años CON densidad alta → Modo A (experiencia comprobable)', () => {
    expect(routeStage({ match_pct: 80, requires_experience: true, experience_density: 0.8 })).toBe('ETAPA_2_MODO_A');
  });

  it('el umbral es configurable y coherente (75)', () => {
    expect(UMBRAL_MODO_A).toBe(75);
  });
});

describe('R-10 v2 — matchScorer', () => {
  const profile = [
    { id: 'sql', label: 'SQL', score: 85 },
    { id: 'etl', label: 'Python / ETL', score: 60 },
    { id: 'calidad', label: 'Calidad de datos', score: 78 },
  ];

  it('match alto cuando el alumno domina los skills requeridos', () => {
    const r = computeMatch(profile, [
      { skill: 'SQL', required: true, weight: 1 },
      { skill: 'Calidad de datos', required: false, weight: 0.7 },
    ]);
    expect(r.match_pct).toBeGreaterThanOrEqual(75);
    expect(r.covered).toContain('SQL');
  });

  it('match bajo y gaps detectados cuando falta dominio', () => {
    const r = computeMatch(profile, [
      { skill: 'SQL', required: true, weight: 1 },
      { skill: 'Python', required: true, weight: 1 },
      { skill: 'Airflow', required: true, weight: 1 },
    ]);
    expect(r.match_pct).toBeLessThan(75);
    expect(r.top_gaps.length).toBeGreaterThan(0);
  });

  it('sin skills detectados → match 0', () => {
    const r = computeMatch(profile, []);
    expect(r.match_pct).toBe(0);
  });
});

describe('R-10 v2 — vacancyAnalyzer (determinístico)', () => {
  it('detecta skills, años y seniority de un texto de vacante', () => {
    const text = `
Puesto: Analista de Datos
Requisitos obligatorios: SQL, Python, Power BI.
Experiencia: 3+ años en análisis de datos. Liderazgo de módulos.
`;
    const v = analyzeVacancyDeterministic(text);
    expect(v.skills.length).toBeGreaterThanOrEqual(3);
    expect(v.min_years).toBe(3);
    expect(v.requires_experience).toBe(true);
    expect(v.senior).toBe(true);
  });

  it('vacante junior sin años → no requiere experiencia', () => {
    const v = analyzeVacancyDeterministic('Puesto: Auxiliar. Conocimientos básicos de Excel.');
    expect(v.requires_experience).toBe(false);
    expect(v.min_years).toBe(0);
  });

  it('skills obligatorios pesan más', () => {
    const v = analyzeVacancyDeterministic('Puesto: DE. SQL obligatorio, Python deseable.');
    const sql = v.skills.find(s => s.skill === 'SQL');
    const py = v.skills.find(s => s.skill === 'Python');
    expect(sql!.weight).toBeGreaterThan(py!.weight);
  });
});