import { describe, it, expect } from 'vitest';
import { compileRoute, listCapabilities } from '../backend/src/services/roadmapCompiler';
import { validateSimulabV2, simId } from '../backend/src/services/simulabFormat';
import { resolveCapability, registerEngineRequirement, pendingEngines, ENGINE_BACKLOG } from '../backend/src/services/engineCapabilities';
import { computeMatch } from '../backend/src/services/matchScorer';
import { routeStage } from '../backend/src/services/stageRouter';

// Textos de vacantes reales (análogos a los roadmaps del repo).
const VACANCY_ANALISTA = `
Puesto: Analista de Datos
Empresa: CHRISTUS Muguerza Corporativo
Requisitos: Excel intermedio-avanzado (tablas dinámicas, XLOOKUP, SUMIFS), Power BI con DAX,
SQL analítico (GROUP BY, funciones de ventana), análisis de indicadores operativos,
planeación y pronóstico (media móvil, PRONOSTICO, MAPE). Deseable: Python.
Experiencia: 1-2 años en puesto similar.
`;

const VACANCY_IA = `
Puesto: Auxiliar de Inteligencia Artificial y Automatización
Empresa: Brick Walling
Requisitos: herramientas de IA generativa (ChatGPT, Gemini, Claude), prompt engineering,
automatización con Python, n8n o Power Automate, APIs de modelos (OpenAI, Anthropic),
agentes y asistentes con LLMs, análisis de procesos de negocio.
`;

describe('R-12 — Capacidades de motor (auto-extensión)', () => {
  it('resuelve skills existentes a motores reales', () => {
    expect(resolveCapability('SQL')?.status).toBe('exists');
    expect(resolveCapability('SQL')?.tool).toBe('sql');
    expect(resolveCapability('Calidad de datos')?.validator).toBe('quality_decision');
    expect(resolveCapability('Resolución de incidentes')?.taskTypes).toContain('incident_recovery');
  });

  it('detecta motores faltantes que el sistema debe construir', () => {
    expect(resolveCapability('Power BI')?.status).toBe('missing');
    expect(resolveCapability('Power BI')?.buildPlan?.length).toBeGreaterThan(0);
    expect(resolveCapability('n8n')?.id).toBe('n8n');
    expect(resolveCapability('Automatización')?.status).toBe('missing');
    expect(resolveCapability('Pronóstico')?.buildPlan).toContain('Motor de pronóstico (media móvil, tendencia lineal, PRONOSTICO) en motor de fórmulas');
  });

  it('Excel se marca como "extends" (el motor existe, faltan funciones)', () => {
    const cap = resolveCapability('Excel');
    expect(cap?.status).toBe('extends');
    expect(cap?.buildPlan?.join(' ')).toMatch(/XLOOKUP/);
  });

  it('registerEngineRequirement agrega al backlog y dedupe por id', () => {
    ENGINE_BACKLOG.length = 0;
    const cap = resolveCapability('Power BI')!;
    const a = registerEngineRequirement(cap);
    expect(a.added).toBe(true);
    const b = registerEngineRequirement(cap);
    expect(b.added).toBe(false);
    expect(ENGINE_BACKLOG.length).toBe(1);
    expect(pendingEngines()[0].id).toBe('power_bi');
  });
});

describe('R-12 — Formato SIMULAB v2', () => {
  it('simId genera id canónico', () => {
    expect(simId('CHRISTUS Muguerza', 'Analista de Datos')).toMatch(/^SIMULAB_/);
  });

  it('validateSimulabV2 rechaza documento incompleto', () => {
    const bad = validateSimulabV2({ formato: 'SIMULAB v1', schema_version: '1.0', id: '', vacante: { titulo: '', empresa: '', requiere_experiencia: false, min_years: 0 }, ruta: { rama: 'analyst', task_types: [] }, analisis_requerimientos: [], motor_mapping: [], engine_requirements: [], etapas: { etapa1: { prueba: [], umbral_modo_a: 75 }, etapa2: {}, etapa3: { densidad: { pesos: {} }, evidencia: [] } }, simulador_laboral: { tickets: [], reglas: [], proyecto_integrador: '' }, entrevista: { tecnica: [], conductual: [] }, criterios_listo_para_vacante: [] } as any);
    expect(bad.valid).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });
});

describe('R-12 — Agente-automatizador (compileRoute)', () => {
  it('compila vacante real → ruta SIMULAB v2 con Etapas 1-3', async () => {
    const res = await compileRoute(VACANCY_ANALISTA, 'user-test', 'data_engineering');
    expect(res.simulab.formato).toBe('SIMULAB v2');
    expect(res.simulab.schema_version).toBe('2.0');
    expect(res.validation.valid).toBe(true);
    expect(res.match_pct).toBeGreaterThanOrEqual(0);
    expect(['ETAPA_2_MODO_A', 'ETAPA_2_MODO_B', 'ETAPA_3']).toContain(res.routing);
    // Requiere experiencia (1-2 años) y densidad 0 → ETAPA_3
    expect(res.routing_detail.requires_experience).toBe(true);
    expect(res.routing_detail.density).toBe(0);
    expect(res.routing).toBe('ETAPA_3');
  });

  it('detecta y registra los motores faltantes de la vacante (Power BI, pronóstico)', async () => {
    const before = pendingEngines().length;
    const res = await compileRoute(VACANCY_ANALISTA, 'user-test', 'data_engineering');
    expect(res.requires_engine_build).toBe(true);
    const ids = res.missing_engines.map(m => m.id);
    expect(ids).toContain('power_bi');
    expect(ids).toContain('forecast');
    expect(pendingEngines().length).toBeGreaterThanOrEqual(before);
  });

  it('genera prueba de Etapa 1 sobre los gaps con preguntas reales', async () => {
    const res = await compileRoute(VACANCY_ANALISTA, 'user-test', 'data_engineering');
    const prueba = res.simulab.etapas.etapa1.prueba;
    expect(prueba.length).toBeGreaterThan(0);
    expect(prueba.every(q => q.pregunta && q.peso > 0)).toBe(true);
  });

  it('la vacante de IA registra motores de automatización/agentes', async () => {
    const res = await compileRoute(VACANCY_IA, 'user-test', 'data_engineering');
    const ids = res.missing_engines.map(m => m.id);
    expect(ids).toContain('n8n');
    expect(ids).toContain('llm_api');
    expect(ids).toContain('agents');
  });

  it('capabilities lista existentes y pendientes', () => {
    const caps = listCapabilities();
    expect(caps.some(c => c.status === 'exists')).toBe(true);
    expect(caps.some(c => c.status === 'missing')).toBe(true);
  });
});

describe('R-12 — Reutiliza motores reales (match y routing)', () => {
  it('computeMatch y routeStage siguen siendo puros', () => {
    const match = computeMatch([{ id: 'sql', label: 'SQL', score: 90 }], [{ skill: 'SQL', required: true, weight: 1 }]);
    expect(match.match_pct).toBe(90);
    expect(routeStage({ match_pct: 80, requires_experience: false, experience_density: 0.8 })).toBe('ETAPA_2_MODO_A');
    expect(routeStage({ match_pct: 50, requires_experience: false, experience_density: 0.8 })).toBe('ETAPA_2_MODO_B');
  });
});