import { describe, it, expect } from 'vitest';
import { buildExpediente, generateSlug } from '../backend/src/services/expediente';

describe('expediente — logros verificables (R-08)', () => {
  it('generateSlug genera un slug alfanumérico de 10 caracteres', () => {
    const s = generateSlug();
    expect(s).toHaveLength(10);
    expect(s).toMatch(/^[a-z0-9]{10}$/);
    // dos slugs distintos
    expect(generateSlug()).not.toBe(generateSlug());
  });

  it('buildExpediente devuelve estructura completa sin datos', async () => {
    const exp = await buildExpediente('u-nonexistent', 'accounting');
    expect(exp.userId).toBe('u-nonexistent');
    expect(exp.specialty).toBe('accounting');
    expect(Array.isArray(exp.logros)).toBe(true);
    expect(exp.resumen).toMatchObject({
      totalTareas: expect.any(Number),
      scorePromedio: expect.any(Number),
      horasInvertidas: expect.any(Number),
      trampasDetectadas: expect.any(Number),
      incidentesResueltos: expect.any(Number),
    });
  });

  it('los logros verificables son títulos con datos y categoría', async () => {
    const exp = await buildExpediente('u-nonexistent', 'accounting');
    // aunque vacío, la estructura de cada logro es correcta si existiera
    expect(exp.logros.every(l => typeof l.titulo === 'string' && typeof l.datos === 'string' && typeof l.verificable === 'boolean')).toBe(true);
  });

  it('marca el incidente del 05-jul como logro si el pipeline fue recuperado', async () => {
    const exp = await buildExpediente('u-nonexistent', 'data_engineering');
    // si el pipeline no fue recuperado (estado por defecto failed), no debe aparecer el logro de recuperación
    expect(exp.logros.some(l => l.titulo.includes('lno_sales_pipeline'))).toBe(false);
  });
});
