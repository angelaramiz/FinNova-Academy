import { describe, it, expect } from 'vitest';
import { getFundamentalWorkflow, FUNDAMENTAL_TYPES } from '../backend/src/services/fundamentals';
import { generateMonthPlan } from '../backend/src/services/taskPlanner';
import { runDEValidator } from '../backend/src/services/deValidation';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';

describe('R-15 — Capa 0 (fundamentos) + Ecosistema', () => {
  it('cada fundamento/ecosistema tiene validación real (maxPossible>0, sin auto-aprueba)', () => {
    for (const t of FUNDAMENTAL_TYPES) {
      const wf = getFundamentalWorkflow(t);
      const max = wf.validation.reduce((s, v) => s + v.points, 0);
      expect(max, `${t} maxPossible=0 (auto-aprueba)`).toBeGreaterThan(0);
    }
  });

  it('los fundamentos NO cuentan como caso; los ecosistemas SÍ', () => {
    const fund = ['excel_basico', 'sql_basico', 'bi_basico', 'python_basico', 'stats_basico'];
    for (const t of fund) expect(getFundamentalWorkflow(t).countsAsCase).toBeUndefined();
    expect(getFundamentalWorkflow('ecosistema_da').countsAsCase).toBe(true);
    expect(getFundamentalWorkflow('ecosistema_de').countsAsCase).toBe(true);
    expect(getFundamentalWorkflow('ecosistema_ds').countsAsCase).toBe(true);
  });

  it('el validador bi aprueba un visual+origen y reprueba vacío', () => {
    expect(runDEValidator({ validator: 'bi' }, { 'row_Visual del tablero': 'barras por cliente', 'row_Origen de los datos': 'mrt_ventas_por_cliente' }).passed).toBe(true);
    expect(runDEValidator({ validator: 'bi' }, {}).passed).toBe(false);
  });

  it('el validador basic_read aprueba solo con identificar el dato (lectura)', () => {
    expect(runDEValidator({ validator: 'basic_read' }, { 'row_Estado del pipeline': 'falló el 05-jul en dbt_test' }).passed).toBe(true);
    expect(runDEValidator({ validator: 'basic_read' }, {}).passed).toBe(false);
  });

  it('el plan por rama incluye fundamentos (sem 2/3) y ecosistema (sem 3/4) según route', () => {
    const da = generateMonthPlan(6, 2026, 'data_engineering', 'analyst');
    const daTypes = new Set(da.tasks.map(t => t.type));
    expect(daTypes.has('excel_basico')).toBe(true);
    expect(daTypes.has('bi_basico')).toBe(true);
    expect(daTypes.has('ecosistema_da')).toBe(true);

    const de = generateMonthPlan(6, 2026, 'data_engineering', 'de');
    const deTypes = new Set(de.tasks.map(t => t.type));
    expect(deTypes.has('python_basico')).toBe(true);
    expect(deTypes.has('monitor_basico')).toBe(true);
    expect(deTypes.has('ecosistema_de')).toBe(true);

    const ds = generateMonthPlan(6, 2026, 'data_engineering', 'ds');
    const dsTypes = new Set(ds.tasks.map(t => t.type));
    expect(dsTypes.has('stats_basico')).toBe(true);
    expect(dsTypes.has('ml_basico')).toBe(true);
    expect(dsTypes.has('ecosistema_ds')).toBe(true);
  });

  it('los fundamentos/ecosistema están registrados en la especialidad data', () => {
    const wf = getSpecialtyWorkflows('data_engineering');
    for (const t of ['excel_basico', 'sql_basico', 'bi_basico', 'ecosistema_da', 'ecosistema_de', 'ecosistema_ds']) {
      expect(wf).toContain(t);
    }
  });
});