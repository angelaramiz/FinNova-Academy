import { describe, it, expect } from 'vitest';
import { getFundamentalWorkflow, FUNDAMENTAL_TYPES } from '../backend/src/services/fundamentals';
import { generateMonthPlan } from '../backend/src/services/taskPlanner';
import { runDEValidator, runDEValidator as deVal } from '../backend/src/services/deValidation';
import { getSpecialtyWorkflows } from '../backend/src/services/specialties';
import { runAdvancedValidator } from '../backend/src/services/advancedDataEngines';

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

  it('validador concepto aprueba keyword real y reprueba vacío (regresión auto-aprueba)', () => {
    expect(runDEValidator({ validator: 'concept', field: 'row_X', concept: 'sql' }, { 'row_X': 'SELECT ... JOIN ... GROUP BY' }).passed).toBe(true);
    expect(runDEValidator({ validator: 'concept', field: 'row_X', concept: 'sql' }, { 'row_X': '' }).passed).toBe(false);
    expect(runDEValidator({ validator: 'concept', field: 'row_X', concept: 'ml' }, { 'row_X': 'split 80/20 target churn' }).passed).toBe(true);
    expect(runDEValidator({ validator: 'concept', field: 'row_X', concept: 'ml' }, { 'row_X': '' }).passed).toBe(false);
  });

  it('el validador bi aprueba un visual+origen y reprueba vacío', () => {
    expect(runDEValidator({ validator: 'bi' }, { 'row_Visual del tablero': 'barras por cliente', 'row_Origen de los datos': 'mrt_ventas_por_cliente' }).passed).toBe(true);
    expect(runDEValidator({ validator: 'bi' }, {}).passed).toBe(false);
  });

  it('el validador basic_read aprueba solo con identificar el dato (lectura)', () => {
    expect(runDEValidator({ validator: 'basic_read' }, { 'row_Estado del pipeline': 'falló el 05-jul en dbt_test' }).passed).toBe(true);
    expect(runDEValidator({ validator: 'basic_read' }, {}).passed).toBe(false);
  });

  it('cada fundamento valida su campo con el validador correcto (sin desalineación field↔validator)', () => {
    const map: Record<string, { validator: string; ok: Record<string, string> }> = {
      excel_basico: { validator: 'concept', ok: { 'row_Power Query que harías': 'Power Query limpia 5k filas y tipos', 'row_Fórmula XLOOKUP': 'XLOOKUP del precio', 'row_Fórmula SUMIFS': 'SUMIFS por categoría' } },
      sql_basico: { validator: 'concept', ok: { 'row_Concepto de SQL': 'SELECT cliente, SUM(total) FROM ventas GROUP BY cliente' } },
      catalog_basico: { validator: 'concept', ok: { 'row_Concepto de catálogo': 'linaje raw a stg a mrt' } },
      bi_basico: { validator: 'bi', ok: { 'row_Visual del tablero': 'barras por cliente', 'row_Origen de los datos': 'mrt_ventas' } },
      python_basico: { validator: 'concept', ok: { 'row_Concepto de Python': 'fillna imputa nulos pandas' } },
      foundry_basico: { validator: 'concept', ok: { 'row_Concepto de Foundry': 'transform en Foundry' } },
      airflow_basico: { validator: 'concept', ok: { 'row_Concepto de Airflow': 'DAG con dependencia' } },
      git_basico: { validator: 'concept', ok: { 'row_Concepto de Git': 'reviso el PR y detecto SELECT *' } },
      monitor_basico: { validator: 'concept', ok: { 'row_Estado del pipeline': 'el pipeline falló 05-jul' } },
      stats_basico: { validator: 'concept', ok: { 'row_Insight de stats': 'describe nulos y distribución' } },
      ml_basico: { validator: 'concept', ok: { 'row_Config del modelo': 'split 80/20 target churn' } },
      metricas_basico: { validator: 'concept', ok: { 'row_Métricas': 'RMSE y accuracy' } },
      ecosistema_da: { validator: 'dax', ok: { 'row_Medida DAX': 'CALCULATE(SUM(mrt[total_ventas]))' } },
      ecosistema_de: { validator: 'automation', ok: { 'row_Nodos del workflow': 'HTTP API to SQL notify', 'row_Trigger del workflow': 'cron diario 06:00' } },
      ecosistema_ds: { validator: 'forecast', ok: { 'row_Método de pronóstico': 'media móvil', 'row_MAPE del pronóstico': '3' } },
    };
    for (const t of Object.keys(map)) {
      const wf = getFundamentalWorkflow(t);
      const rule = wf.validation[0];
      const field = rule.field;
      expect(rule.field).toBeTruthy();
      // El validador advanced necesita TODAS sus claves; el form debe proveerlas.
      const formKeys = wf.steps.find(s => s.type === 'form')!.data.fields.map((f: any) => f.key);
      for (const k of Object.keys(map[t].ok)) {
        expect(formKeys, `${t}: el form no provee la clave '${k}' que lee el validador`).toContain(k);
      }
      let passed: boolean;
      if (rule.type === 'advanced') passed = runAdvancedValidator(rule, map[t].ok).passed;
      else passed = runDEValidator(rule, map[t].ok).passed;
      expect(passed, `${t}: la respuesta correcta NO pasó (field↔validator desalineado)`).toBe(true);
      // Vacío no pasa (no auto-aprueba)
      const empty: Record<string, string> = {};
      const passedEmpty = rule.type === 'advanced' ? runAdvancedValidator(rule, empty).passed : runDEValidator(rule, empty).passed;
      expect(passedEmpty, `${t}: vacío auto-aprueba`).toBe(false);
    }
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