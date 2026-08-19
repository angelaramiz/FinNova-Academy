import { describe, it, expect } from 'vitest';
import { buildIntensivePlan, auditAppliedCase, SKILL_UMBRAL_INTENSIVO } from '../backend/src/services/intensivePlanner';
import { SIM_BLOCKS, getSimBlock, toolForSkill } from '../backend/src/services/simBlocks';

describe('R-10 v2 — Modo B: casos aplicados', () => {
  it('genera un caso aplicado por cada gap del alumno', () => {
    const plan = buildIntensivePlan('u1', 'a1', ['SQL', 'Airflow', 'BI']);
    expect(plan.cases.length).toBe(3);
  });

  it('todo caso aplicado cumple las 5 reglas obligatorias (sin ejecución básica)', () => {
    const plan = buildIntensivePlan('u1', 'a1', ['SQL', 'Python', 'dbt', 'ETL', 'Airflow', 'BI', 'Cloud', 'Excel', 'CFDI', 'Conciliación', 'Calidad de datos']);
    for (const c of plan.cases) {
      const audit = auditAppliedCase(c);
      expect(audit.ok, `caso ${c.id} no cumple: ${audit.failed.join(', ')}`).toBe(true);
      // (a) contexto de negocio realista
      expect(c.context.length).toBeGreaterThan(10);
      // (b) decisión multi-camino
      expect(c.decision.toLowerCase()).toMatch(/elig/);
      // (c) trampa o restricción oculta
      expect(c.trap.description.length).toBeGreaterThan(5);
      // (d) validable por motor
      expect(c.validable).toBe(true);
      expect(c.trap.validation.length).toBeGreaterThan(0);
      // (e) reflexión
      expect(c.reflection.toLowerCase()).toContain('por qué');
    }
  });

  it('los casos se encadenan: el resultado de uno alimenta el siguiente', () => {
    const plan = buildIntensivePlan('u1', 'a1', ['SQL', 'Airflow', 'BI']);
    for (let i = 0; i < plan.cases.length - 1; i++) {
      expect(plan.cases[i].feedsNext).toBe(plan.cases[i + 1].id);
    }
    expect(plan.cases[plan.cases.length - 1].feedsNext).toBeUndefined();
  });

  it('ningún caso es "ejecuta la función básica"', () => {
    const plan = buildIntensivePlan('u1', 'a1', ['SQL', 'Excel']);
    for (const c of plan.cases) {
      expect(c.decision.toLowerCase()).not.toMatch(/ejecuta (la|una) funci[oó]n b[aá]sica/);
    }
  });

  it('el umbral de skill para intensivo es 75', () => {
    expect(SKILL_UMBRAL_INTENSIVO).toBe(75);
  });
});

describe('R-10 v2 — simBlocks (registry de herramientas)', () => {
  it('toda skill reconocible tiene herramienta diaria real', () => {
    expect(SIM_BLOCKS.length).toBeGreaterThan(10);
    for (const b of SIM_BLOCKS) {
      expect(b.tool).toBeTruthy();
      expect(b.label).toBeTruthy();
    }
  });

  it('mapea skills comunes a su herramienta', () => {
    expect(toolForSkill('SQL')).toBe('sql');
    expect(toolForSkill('Excel')).toBe('spreadsheet');
    expect(toolForSkill('dbt')).toBe('dbt');
    expect(toolForSkill('Airflow')).toBe('airflow');
  });

  it('getSimBlock es case-insensitive', () => {
    expect(getSimBlock('sql')).toBeDefined();
    expect(getSimBlock('SQL')).toBeDefined();
  });
});