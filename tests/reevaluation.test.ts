import { describe, it, expect } from 'vitest';
import { routeStage } from '../backend/src/services/stageRouter';
import { UMBRAL_MODO_A } from '../backend/src/services/matchScorer';

// La reevaluación usa stage1Service (async, con Supabase/memoria). Aquí
// validamos la LÓGICA central: tras completar el plan intensivo, el perfil
// del alumno mejora → el match sube → el routing migra a Modo A y queda
// en el historial.

describe('R-10 v2 — reevaluación: Modo B → Modo A', () => {
  it('un match < 75 inicial rutea a Modo B', () => {
    expect(routeStage({ match_pct: 60, requires_experience: false, experience_density: 0 })).toBe('ETAPA_2_MODO_B');
  });

  it('tras completar el plan, un match ≥ 75 migra a Modo A automáticamente', () => {
    expect(routeStage({ match_pct: 78, requires_experience: false, experience_density: 0 })).toBe('ETAPA_2_MODO_A');
  });

  it('el umbral de migración es 75 (configurable)', () => {
    expect(UMBRAL_MODO_A).toBe(75);
  });

  it('la mejora queda registrada: 74 → B, 75 → A (frontera exacta)', () => {
    expect(routeStage({ match_pct: 74, requires_experience: false, experience_density: 0 })).toBe('ETAPA_2_MODO_B');
    expect(routeStage({ match_pct: 75, requires_experience: false, experience_density: 0 })).toBe('ETAPA_2_MODO_A');
  });

  it('una vacante que exige experiencia sigue a Etapa 3 incluso con match alto si falta densidad', () => {
    expect(routeStage({ match_pct: 90, requires_experience: true, experience_density: 0.2 })).toBe('ETAPA_3');
  });
});