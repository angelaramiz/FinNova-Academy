import { describe, it, expect } from 'vitest';
import { runAdvancedValidator, daxTotalVentas, movingAverage, mape, FORECAST_SERIES, getAdvancedWorkflow } from '../backend/src/services/advancedDataEngines';
import { ENGINE_CAPABILITIES, resolveCapability, listCapabilities } from '../backend/src/services/engineCapabilities';

describe('R-15 — Motores avanzados (carrera data completa)', () => {
  it('DAX total de ventas del mart = 128350 (golden real)', () => {
    expect(daxTotalVentas()).toBe(128350);
  });

  it('media móvil y MAPE son cálculos reales deterministas', () => {
    expect(movingAverage([112400, 118900, 124150, 128350], 3)).toBe(123800);
    expect(movingAverage([1], 3)).toBeNull();
    expect(mape(100, 90)).toBe(10);
  });

  it('validador DAX aprueba CALCULATE + agregación y reprueba sin ellos', () => {
    const ok = runAdvancedValidator({ validator: 'dax' }, { 'row_Medida DAX': 'VentasTotales = CALCULATE(SUM(mrt_ventas_por_cliente[total_ventas]))' });
    expect(ok.passed).toBe(true);
    const bad = runAdvancedValidator({ validator: 'dax' }, { 'row_Medida DAX': 'sum() simple' });
    expect(bad.passed).toBe(false);
  });

  it('validador Excel reconoce XLOOKUP/SUMIFS/pivot', () => {
    expect(runAdvancedValidator({ validator: 'excel' }, { 'row_Fórmula avanzada que usarías': 'XLOOKUP del precio' }).passed).toBe(true);
    expect(runAdvancedValidator({ validator: 'excel' }, { 'row_Fórmula avanzada que usarías': 'SUM(A1:A5)' }).passed).toBe(false);
  });

  it('validador Pronóstico exige método y MAPE bajo', () => {
    expect(runAdvancedValidator({ validator: 'forecast' }, { 'row_Método de pronóstico': 'media móvil de 3', 'row_MAPE del pronóstico': '3' }).passed).toBe(true);
    expect(runAdvancedValidator({ validator: 'forecast' }, { 'row_Método de pronóstico': 'adivinar', 'row_MAPE del pronóstico': '50' }).passed).toBe(false);
  });

  it('validador Automatización exige trigger + nodos', () => {
    expect(runAdvancedValidator({ validator: 'automation' }, { 'row_Trigger del workflow': 'cron diario 06:00', 'row_Nodos del workflow': 'HTTP GET api → SQL insert' }).passed).toBe(true);
  });

  it('validador LLM exige system prompt + parámetros', () => {
    expect(runAdvancedValidator({ validator: 'llm_api' }, { 'row_Parámetros de la llamada': 'system prompt: eres analista; temperature 0.3' }).passed).toBe(true);
  });

  it('validador Agente exige herramientas y loop/memoria', () => {
    expect(runAdvancedValidator({ validator: 'agent' }, { 'row_Herramientas del agente': 'SQL y HTTP', 'row_Loop y memoria': 'usa el resultado del paso anterior' }).passed).toBe(true);
  });

  it('validador Prompt exige formato + few-shot', () => {
    expect(runAdvancedValidator({ validator: 'prompt' }, { 'row_Mejora del prompt': 'responde JSON, con ejemplo, instrucción clara' }).passed).toBe(true);
  });

  it('los 7 motores avanzados quedan registrados como exists en ENGINE_CAPABILITIES', () => {
    const ids = ['excel_advanced', 'power_bi', 'forecast', 'n8n', 'llm_api', 'agents', 'prompt'];
    for (const id of ids) {
      const cap = ENGINE_CAPABILITIES.find(c => c.id === id);
      expect(cap, `capacidad ${id}`).toBeTruthy();
      expect(cap!.status).toBe('exists');
    }
  });

  it('resolveCapability resuelve skills por alias (n8n, api llm, prompt)', () => {
    expect(resolveCapability('n8n')?.id).toBe('n8n');
    expect(resolveCapability('API LLM')?.id).toBe('llm_api');
    expect(resolveCapability('Prompt')?.id).toBe('prompt');
  });

  it('getAdvancedWorkflow devuelve un workflow válido con validación advanced', () => {
    const wf = getAdvancedWorkflow('powerbi_dax');
    expect(wf.type).toBe('powerbi_dax');
    expect(wf.steps.some(s => s.type === 'tool')).toBe(true);
    expect(wf.validation[0].type).toBe('advanced');
    expect(wf.validation[0].points).toBeGreaterThan(0);
  });

  it('listCapabilities expone los 7 con validator', () => {
    const list = listCapabilities();
    const ids = ['excel_advanced', 'power_bi', 'forecast', 'n8n', 'llm_api', 'agents', 'prompt'];
    for (const id of ids) {
      const c = list.find(x => x.id === id);
      expect(c, id).toBeTruthy();
      expect(c!.validator).toBeTruthy();
      expect(c!.taskTypes.length).toBeGreaterThan(0);
    }
  });
});