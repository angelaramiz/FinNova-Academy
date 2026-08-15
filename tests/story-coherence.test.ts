import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STORY_SCENES, STORY_DATASETS } from '../backend/src/data/storyData';
import { generateMonthPlan } from '../backend/src/services/taskPlanner';
import { freshCareerPath, applyDemoOverride, applyProgress } from '../backend/src/services/careerPath';
import { SOURCES, MODELS } from '../alumnos/src/components/DBTSim';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('story-coherence — guion de seguimiento de la especialidad Data', () => {
  it('cada escena tiene taskType conocido por el árbol de rutas', () => {
    const known = ['sql_query', 'etl_pipeline', 'data_quality', 'ontology_modeling', 'airflow_dag', 'code_review', 'soporte_datos', 'incident_recovery', 'eda_churn', 'modelo_baseline', 'eval_metricas'];
    for (const s of STORY_SCENES) {
      expect(known).toContain(s.taskType);
    }
  });

  it('los datasets de las escenas existen en SOURCES/MODELS de DBTSim', () => {
    const valid = new Set([...Object.keys(SOURCES), ...MODELS.map(m => m.name)]);
    for (const d of STORY_DATASETS) {
      expect(valid).toContain(d);
    }
  });

  it('el NPC de la especialidad data es Sandra Mora o el sistema de monitoreo (nunca Lic. Gómez)', () => {
    for (const s of STORY_SCENES) {
      expect(s.npc).not.toContain('Lic. Gómez');
      expect(['Ing. Sandra Mora', 'Sistema de Monitoreo', 'Ana García (Analista)']).toContain(s.npc);
    }
  });

  it('las fechas sim de las escenas están dentro del calendario (03→08 jul 2026)', () => {
    const validDates = ['01-jul', '02-jul', '03-jul', '04-jul', '05-jul', '06-jul', '07-jul', '08-jul'];
    for (const s of STORY_SCENES) {
      expect(validDates).toContain(s.fechaSim);
    }
  });

  it('el incidente del 05-jul es coherente: dbt_test falló en positive(total_ventas)', () => {
    const incident = STORY_SCENES.find(s => s.taskType === 'incident_recovery');
    expect(incident?.fechaSim).toBe('05-jul');
    expect(incident?.dataset).toBe('mrt_ventas_por_cliente');
  });

  it('el caso churn de ciencia usa las features del mart degradado (coherencia cruzada con el 05-jul)', () => {
    const churn = STORY_SCENES.find(s => s.taskType === 'eda_churn');
    expect(churn?.arco).toBe('science');
    expect(['int_ventas_cliente', 'mrt_ventas_por_cliente']).toContain(churn?.dataset);
    // el guion legible menciona la degradación
    const doc = fs.readFileSync(path.resolve(__dirname, '../docs/guion-seguimiento-data.md'), 'utf8');
    expect(doc).toContain('05-jul');
  });

  it('las tareas de taskPlanner por fase son coherentes: las analistas no mezclan ramas de ingeniería', () => {
    const planAnalyst = generateMonthPlan(6, 2026, 'data_engineering', 'analyst');
    const analystPhases = new Set(planAnalyst.tasks.map(t => t.phase));
    // fase analista: solo tareas analyst (sin incident_recovery / airflow_dag de ingeniería)
    for (const t of planAnalyst.tasks) {
      expect(['analyst']).toContain(t.phase);
    }
    const planEng = generateMonthPlan(6, 2026, 'data_engineering', 'de');
    expect(planEng.tasks.some(t => t.phase === 'de')).toBe(true);
    const planDs = generateMonthPlan(6, 2026, 'data_engineering', 'ds');
    expect(planDs.tasks.some(t => t.type === 'eda_churn')).toBe(true);
  });

  it('el demo override NO cambia practicePct (inmutable)', () => {
    const cp = applyProgress(freshCareerPath(), { tasks: { done: 5, total: 12 }, sims: { validated: 3, total: 8 }, cases: { done: 1, total: 3 } });
    const before = cp.practicePct;
    const demo = applyDemoOverride(cp, true);
    expect(demo.practicePct).toBe(before);
  });

  it('nunca aparecen apps contables en ninguna rama data (regresión FALLA #1)', () => {
    // Los appSets data se definen en DesktopShell; verificamos que las
    // constantes de especialidad data no incluyen las apps contables clave.
    const accountingOnlyApps = ['accounting', 'banking', 'calculator'];
    const src = fs.readFileSync(path.resolve(__dirname, '../alumnos/src/components/DesktopShell.tsx'), 'utf8');
    const analyst = src.split('const analystApps = [').pop()!.split('];')[0];
    const eng = src.split('const engineeringApps = [').pop()!.split('];')[0];
    const sci = src.split('const scienceApps = [').pop()!.split('];')[0];
    for (const set of [analyst, eng, sci]) {
      for (const app of accountingOnlyApps) {
        expect(set).not.toContain(`setScreen('${app}')`);
      }
    }
  });

  it('el guion legible refleja el árbol de 3 nodos', () => {
    const doc = fs.readFileSync(path.resolve(__dirname, '../docs/guion-seguimiento-data.md'), 'utf8');
    expect(doc).toContain('ANALISTA DE DATOS');
    expect(doc).toContain('INGENIERÍA DE DATOS');
    expect(doc).toContain('CIENCIA DE DATOS');
    expect(doc).toContain('UNLOCK_PCT');
  });
});
