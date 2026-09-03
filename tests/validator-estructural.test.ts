import { describe, it, expect } from 'vitest';
import { runDEValidator, validateEstructural } from '../backend/src/services/deValidation';

// P0-3: validator_estructural (bucle AND). El validador 'concept' es regex de
// keywords: una respuesta puede mencionarlo todo y carecer de estructura.
// Estos tests FALLAN sin validateEstructural (prueban el hueco detectado).

const RULE = {
  validator: 'estructural' as const,
  field: 'row_Query limpio',
  requireAll: ['select', 'from', 'where'],
  forbid: ['select *'],
  seed: 'and-2026-demo',
};

describe('P0 - validator_estructural (bucle AND)', () => {
  it('rechaza enie en codigo (principio anio: SQL no maneja la enie)', () => {
    const r = runDEValidator(RULE, { 'row_Query limpio': 'SELECT ano AS año FROM ventas' });
    expect(r.passed).toBe(false);
    expect(r.feedback).toMatch(/ñ|enie/i);
  });

  it('acepta la version limpia con anio', () => {
    const r = runDEValidator(RULE, { 'row_Query limpio': 'SELECT anio FROM ventas WHERE anio = 2026' });
    expect(r.passed).toBe(true);
  });

  it('falla si falta un elemento estructural aunque el concepto-regex pasaria', () => {
    // Menciona select/where (keywords de TOOL_KEYWORDS.sql) pero sin FROM.
    const noFrom = 'select de consulta where con filtro de datos';
    const concept = runDEValidator(
      { validator: 'concept', field: 'row_Query limpio', concept: 'sql' },
      { 'row_Query limpio': noFrom },
    );
    expect(concept.passed).toBe(true); // el hueco: concept aprueba...
    const est = runDEValidator(RULE, { 'row_Query limpio': noFrom });
    expect(est.passed).toBe(false); // ...pero estructural lo frena
    expect(est.feedback).toMatch(/from/i);
  });

  it('falla ante patron prohibido (SELECT * en contexto curado)', () => {
    const r = runDEValidator(RULE, { 'row_Query limpio': 'SELECT * FROM ventas WHERE anio = 2026' });
    expect(r.passed).toBe(false);
    expect(r.feedback).toMatch(/prohibido/i);
  });

  it('no auto-aprueba en vacio', () => {
    const r = runDEValidator(RULE, { 'row_Query limpio': '   ' });
    expect(r.passed).toBe(false);
  });

  it('es determinista por seed: misma entrada, mismo veredicto', () => {
    const a = { 'row_Query limpio': 'SELECT anio FROM ventas WHERE anio = 2026' };
    const r1 = validateEstructural(RULE, a);
    const r2 = validateEstructural(RULE, a);
    expect(r1).toEqual(r2);
  });
});
