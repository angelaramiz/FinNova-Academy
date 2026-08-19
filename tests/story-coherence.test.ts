import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STORY_SCENES, STORY_DATASETS } from '../backend/src/data/storyData';
import { generateMonthPlan } from '../backend/src/services/taskPlanner';
import { freshCareerPath, applyDemoOverride, applyProgress } from '../backend/src/services/careerPath';
import { SOURCES, MODELS, compileModelSql } from '../alumnos/src/components/DBTSim';
import { WORLD_CALENDAR, CANONICAL_EVENTS, NPCS, COMPANIES, getNpc } from '../backend/src/data/worldBible';
import { STORY_ARCS, getArcsForRoute } from '../backend/src/data/storyArcs';
import { auditCase, auditLore } from '../backend/src/services/storyCoherence';
import { DBT_DATASETS, MART_TOTAL, INCIDENT } from '../backend/src/data/dbtCatalog';

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

// ─── R-09: Lore vivo — world bible, arcos y auditoría de coherencia ───

describe('R-09 world bible — lore canónico', () => {
  it('el calendario sim HOY es 2026-07-08 y la ventana es julio 2026', () => {
    expect(WORLD_CALENDAR.hoyIso).toBe('2026-07-08');
    expect(WORLD_CALENDAR.ventana).toEqual({ inicio: '2026-07-01', fin: '2026-07-31' });
  });

  it('los eventos canónicos tienen fecha dentro de la ventana y rutas válidas', () => {
    const validRoutes = ['contable', 'analyst', 'engineering', 'science'];
    for (const ev of CANONICAL_EVENTS) {
      expect(validRoutes).toContain(ev.routes[0]);
      for (const r of ev.routes) expect(validRoutes).toContain(r);
      expect(ev.fechaSim).toMatch(/^\d{2}-(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/);
    }
  });

  it('el incidente 05-jul es idéntico al de dbtCatalog y al de DBTSim (golden 128350)', () => {
    const incident = CANONICAL_EVENTS.find(e => e.id === 'incidente_05jul');
    expect(incident).toBeDefined();
    expect(incident!.fixedFacts.join(' ')).toContain('positive(total_ventas)');
    expect(incident!.fixedFacts.join(' ')).toContain('lno_sales_pipeline');
    expect(INCIDENT.failedTest).toBe('positive(total_ventas)');
    expect(INCIDENT.failedTask).toBe('dbt_test');
    expect(INCIDENT.fechaSim).toBe('05-jul');
    expect(MART_TOTAL).toBe(128350);
  });

  it('cada NPC tiene rasgos válidos y una escalera no vacía', () => {
    for (const npc of Object.values(NPCS)) {
      expect([0, 1, 2]).toContain(npc.traits.paciencia);
      expect([0, 1, 2]).toContain(npc.traits.formalidad);
      expect([0, 1, 2]).toContain(npc.traits.aversionRiesgo);
      expect(typeof npc.traits.memoria).toBe('boolean');
      expect(npc.ladder.length).toBeGreaterThan(0);
      expect(COMPANIES[npc.company]).toBeDefined();
    }
  });

  it('el incidente 05-jul está dentro del calendario sim (auditLore pasa)', () => {
    const r = auditLore({ fechaSim: '05-jul', route: 'engineering', npc: 'sandra_mora', entidades: ['mrt_ventas_por_cliente'], texto: 'dbt_test falló en positive(total_ventas)' }, 'u-demo');
    expect(r.ok).toBe(true);
  });
});

describe('R-09 arcos por ruta — coherencia con la world bible', () => {
  it('cada ruta tiene al menos un arco', () => {
    for (const route of ['contable', 'analyst', 'engineering', 'science']) {
      expect(getArcsForRoute(route as any).length).toBeGreaterThan(0);
    }
  });

  it('cada escena de arco referencia un NPC válido y de la empresa correcta', () => {
    for (const arc of STORY_ARCS) {
      for (const scene of arc.escenas) {
        expect(scene.route).toBe(arc.route);
        const npc = getNpc(scene.npc);
        expect(npc, `escena ${scene.sceneId}`).toBeDefined();
        if (npc!.company === 'lno') expect(scene.route).toBe('contable');
        if (npc!.company === 'dataflow') expect(scene.route).not.toBe('contable');
      }
    }
  });

  it('cada escena de arco pasa la auditoría de lore (fechas, entidades, sin cruce)', () => {
    for (const arc of STORY_ARCS) {
      for (const scene of arc.escenas) {
        const r = auditLore({
          fechaSim: scene.ventanaSim,
          route: scene.route,
          npc: scene.npc,
          entidades: scene.entidades,
          texto: scene.consecuencia + ' ' + scene.trigger,
        }, 'u-demo');
        expect(r.ok, `escena ${scene.sceneId} — checks: ${JSON.stringify(r.checks.filter(c => !c.passed))}`).toBe(true);
      }
    }
  });

  it('los taskTypes de los arcos son conocidos (contables o DE/DS)', () => {
    const accounting = ['invoice_emission', 'payment_registration', 'supplier_invoice', 'bank_reconciliation', 'tax_calculation', 'payroll', 'journal_entry', 'credit_note', 'cash_cut', 'depreciation', 'financial_statements', 'payment_scheduling', 'ap_reconciliation', 'cfdi_reception'];
    const de = ['sql_query', 'etl_pipeline', 'data_quality', 'ontology_modeling', 'airflow_dag', 'code_review', 'soporte_datos', 'incident_recovery', 'eda_churn', 'modelo_baseline', 'eval_metricas'];
    for (const arc of STORY_ARCS) {
      for (const scene of arc.escenas) {
        for (const tt of scene.taskTypes) {
          expect([...accounting, ...de], `escena ${scene.sceneId} taskType ${tt}`).toContain(tt);
        }
      }
    }
  });

  it('no hay fugas contables en arcos data (regresión FALLA #1)', () => {
    for (const arc of STORY_ARCS) {
      if (arc.route === 'analyst' || arc.route === 'engineering' || arc.route === 'science') {
        for (const scene of arc.escenas) {
          const contable = ['SAT', 'CFDI', 'Nómina', 'Pólizas', 'Logística del Norte', 'LNO'];
          expect(scene.entidades.some(e => contable.includes(e)), `escena ${scene.sceneId}`).toBe(false);
        }
      }
    }
  });

  it('el arco de ciencia referencia el incidente 05-jul (coherencia cruzada)', () => {
    const sci = STORY_ARCS.find(a => a.route === 'science');
    const eng = STORY_ARCS.find(a => a.id === 'engineering_incidente');
    expect(eng).toBeDefined();
    expect(eng!.escenas[0].trigger).toContain('incidente_05jul');
    expect(sci!.descripcion).toContain('05-jul');
  });
});

describe('R-09 auditoría de coherencia — 9 checks del gate', () => {
  const base = {
    seed: 'u123:2026-W28:arco_cierre:0',
    route: 'contable',
    npc: 'lic_gomez',
    entities: ['Comercial del Norte', 'Transportes Express'],
    dates: ['2026-07-03'],
    payload: { facturas: ['FAC-045', 'FAC-047'], montos: [12480, 8350], iva: 0.16, cheque_sin_cobrar: 'CH-1092' },
    golden: { saldo_conciliado: 20830, asiento_cuadra: true, martTotal: 128350 },
    texts: ['Variante de lore #3 con tono formal'],
  };

  it('un caso bien formado pasa los 9 checks', () => {
    const r = auditCase(base, 'u-demo');
    expect(r.ok).toBe(true);
    expect(r.checks).toHaveLength(9);
  });

  it('fecha fuera del calendario sim falla (check 1)', () => {
    const r = auditCase({ ...base, dates: ['2026-08-15'] }, 'u-demo');
    expect(r.ok).toBe(false);
    expect(r.checks.find(c => c.name === 'datesInSimCalendar')!.passed).toBe(false);
  });

  it('entidad inexistente falla (check 2)', () => {
    const r = auditCase({ ...base, entities: ['Cliente Fantasma S.A.'] }, 'u-demo');
    expect(r.ok).toBe(false);
    expect(r.checks.find(c => c.name === 'entitiesExist')!.passed).toBe(false);
  });

  it('golden del mart distinto a 128350 falla (check 4)', () => {
    const r = auditCase({ ...base, golden: { martTotal: 99999 } }, 'u-demo');
    expect(r.ok).toBe(false);
    expect(r.checks.find(c => c.name === 'goldenFromEngine')!.passed).toBe(false);
  });

  it('NPC no autorizado falla (check 6): Lic. Gómez nunca en data, Sandra nunca en contable', () => {
    const crossData = auditCase({ ...base, route: 'engineering', npc: 'lic_gomez' }, 'u-demo');
    expect(crossData.ok).toBe(false);
    const crossContable = auditCase({ ...base, route: 'contable', npc: 'sandra_mora' }, 'u-demo');
    expect(crossContable.ok).toBe(false);
  });

  it('entidad contable en ruta data falla (check 7 — regresión FALLA #1)', () => {
    const r = auditCase({ ...base, route: 'engineering', entities: ['CFDI'] }, 'u-demo');
    expect(r.ok).toBe(false);
    expect(r.checks.find(c => c.name === 'noCrossRoute')!.passed).toBe(false);
  });

  it('sin semilla falla (check 8)', () => {
    const r = auditCase({ ...base, seed: '' }, 'u-demo');
    expect(r.ok).toBe(false);
    expect(r.checks.find(c => c.name === 'seedReproducible')!.passed).toBe(false);
  });

  it('texto con mojibake falla (check 9 — regresión FALLA #2)', () => {
    const r = auditCase({ ...base, texts: ['El asiento cuadra: â€“ descuadre detectado'] }, 'u-demo');
    expect(r.ok).toBe(false);
    expect(r.checks.find(c => c.name === 'noMojibake')!.passed).toBe(false);
  });

  it('un caso data válido pasa la auditoría completa', () => {
    const dataCase = {
      seed: 'u2:2026-W28:engineering_incidente:0',
      route: 'engineering',
      npc: 'sandra_mora',
      entities: ['mrt_ventas_por_cliente', 'lno_sales_pipeline'],
      dates: ['2026-07-05'],
      payload: { facturas: [] as string[], montos: [] as number[] },
      golden: { martTotal: 128350 },
      texts: ['Incidente de dbt_test en el pipeline de ventas'],
    };
    const r = auditCase(dataCase, 'u-demo');
    expect(r.ok).toBe(true);
  });
});

describe('R-09 catálogo dbt backend — coherencia con DBTSim del frontend', () => {
  it('DBT_DATASETS coincide con SOURCES/MODELS reales', () => {
    const real = [...Object.keys(SOURCES), ...MODELS.map(m => m.name)];
    expect(DBT_DATASETS.sort()).toEqual([...new Set(real)].sort());
  });

  it('el golden 128350 coincide con el total del mart real (motor compileModelSql)', () => {
    const tables: Record<string, { schema: string[]; rows: Record<string, any>[] }> = {};
    for (const name of ['stg_ventas', 'stg_clientes', 'int_ventas_cliente']) {
      const model = MODELS.find(x => x.name === name)!;
      tables[name] = compileModelSql(model.sql, { ...SOURCES, ...tables });
    }
    const mrt = compileModelSql(MODELS.find(x => x.name === 'mrt_ventas_por_cliente')!.sql, { ...SOURCES, ...tables });
    const sumMrt = mrt.rows.reduce((s: number, r: any) => s + Number(r.total_ventas), 0);
    expect(MART_TOTAL).toBe(sumMrt);
  });
});
