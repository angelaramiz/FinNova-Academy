// R-12 — Valida que un SimulabV2 "prompt-driven" (como genera ChatGPT/Qwen con el
// prompt de docs/prompt-vacante-simulab-v2.md) pasa validateSimulabV2 y enruta bien.
import { describe, it, expect } from 'vitest';
import { validateSimulabV2, simId } from '../backend/src/services/simulabFormat';
import { compileRoute } from '../backend/src/services/roadmapCompiler';

// Un documento producido por el prompt (simula la salida de ChatGPT/Qwen) para la
// vacante CHRISTUS. Solo texto válido: golden del mart real 128350, motor_mapping
// con ids canónicos, power_bi/forecast en engine_requirements.
const promptGenerated: any = {
  formato: 'SIMULAB v2',
  schema_version: '2.0',
  id: simId('CHRISTUS Muguerza', 'Analista de Datos'),
  vacante: {
    titulo: 'Analista de Datos',
    empresa: 'CHRISTUS Muguerza',
    requiere_experiencia: true,
    min_years: 1,
  },
  ruta: { rama: 'analyst', arco_id: 'arco_analista', task_types: ['sql_query', 'data_quality'] },
  analisis_requerimientos: [
    { requerimiento: 'SQL avanzado', tipo: 'tecnica', nivel_pedido: 'avanzado', nivel_actual: 'nulo', brecha: 'faltan joins y ventanas', prioridad: 'excluyente' },
    { requerimiento: 'Power BI con DAX', tipo: 'herramienta', nivel_pedido: 'avanzado', nivel_actual: 'nulo', brecha: 'falta motor DAX', prioridad: 'importante' },
    { requerimiento: 'Pronóstico', tipo: 'tecnica', nivel_pedido: 'intermedio', nivel_actual: 'nulo', brecha: 'falta motor pronóstico', prioridad: 'importante' },
    { requerimiento: 'Excel intermedio-avanzado', tipo: 'herramienta', nivel_pedido: 'intermedio', nivel_actual: 'nulo', brecha: 'falta extensión excel', prioridad: 'importante' },
    { requerimiento: 'Python', tipo: 'tecnica', nivel_pedido: 'deseable', nivel_actual: 'nulo', brecha: 'sin conocimiento', prioridad: 'deseable' },
    { requerimiento: 'Experiencia 1-2 años', tipo: 'experiencia', nivel_pedido: '1-2 años', nivel_actual: '0', brecha: 'sin experiencia profesional', prioridad: 'filtro' },
  ],
  motor_mapping: [
    { skill: 'SQL', capability: { id: 'sql', skill: 'SQL', status: 'exists', label: 'SQL', icon: '🗄️', tool: 'sql', taskTypes: ['sql_query'] } },
    { skill: 'Excel', capability: { id: 'excel_advanced', skill: 'Excel', status: 'extends', label: 'Excel', icon: '📊', tool: 'spreadsheet' } },
    { skill: 'Python', capability: { id: 'python', skill: 'Python', status: 'exists', label: 'Python', icon: '🐍', tool: 'notebook', taskTypes: ['etl_pipeline'] } },
    { skill: 'Power BI', capability: { id: 'power_bi', skill: 'Power BI', status: 'missing', label: 'Power BI', icon: '📈', tool: 'bi' } },
    { skill: 'Pronóstico', capability: { id: 'forecast', skill: 'Pronóstico', status: 'missing', label: 'Pronóstico', icon: '📉' } },
  ],
  engine_requirements: [
    { id: 'power_bi', skill: 'Power BI', status: 'missing', label: 'Power BI', icon: '📈', tool: 'bi', gap: 'motor de DAX', buildPlan: ['Motor DAX'] },
    { id: 'forecast', skill: 'Pronóstico', status: 'missing', label: 'Pronóstico', icon: '📉', gap: 'motor pronóstico', buildPlan: ['Motor PRONOSTICO'] },
  ],
  etapas: {
    etapa1: {
      prueba: [
        { id: 'E1-0', skill: 'SQL', pregunta: 'Suma el total por cliente de ventas jul', correcta: 'SELECT cliente_id, SUM(total) FROM ventas GROUP BY cliente_id', peso: 25 },
        { id: 'E1-1', skill: 'Power BI', pregunta: 'Diferencia CALCULATE vs SUMX', correcta: 'CALCULATE cambia contexto de filtro; SUMX itera por fila', peso: 25 },
        { id: 'E1-2', skill: 'Pronóstico', pregunta: 'Media móvil 3 semanas para semana 5', correcta: 'PRONOSTICO o promedio de 3 semanas', peso: 25 },
        { id: 'E1-3', skill: 'Excel', pregunta: 'Variación % feb vs ene', correcta: '=(feb-ene)/ene', peso: 25 },
      ],
      umbral_modo_a: 75,
    },
    etapa2: {
      modo_b: {
        plan_intensivo: [
          { id: 'T1', ticket: 'Monta un tablero de indicadores con SQL + Excel', dependencias: [], teoria: ['SQL', 'Excel'], practica: 'Compila un query y una fórmula', herramientas: ['sql', 'spreadsheet'], motor_mapping: { skill: 'SQL', taskType: 'sql_query', tool: 'sql' }, criterio_cumplimiento: 'Query correcto y fórmula aplicada' },
        ],
      },
    },
    etapa3: {
      densidad: { pesos: { casos: 0.4, complejidad: 0.2, variedad: 0.15, incidentes: 0.15, resultados: 0.1 } },
      evidencia: ['Expediente R-08'],
    },
  },
  simulador_laboral: {
    tickets: [
      { id: 'T1', ticket: 'Monta un tablero de indicadores con SQL + Excel', dependencias: [], teoria: ['SQL', 'Excel'], practica: 'Compila un query y una fórmula', herramientas: ['sql', 'spreadsheet'], motor_mapping: { skill: 'SQL', taskType: 'sql_query', tool: 'sql' }, criterio_cumplimiento: 'Query correcto y fórmula aplicada' },
    ],
    reglas: ['Un ticket se cierra solo con criterio cumplido'],
    proyecto_integrador: 'Tablero de indicadores hospitalarios sobre el mart real',
  },
  entrevista: { tecnica: ['Qué indicadores de calidad usas'], conductual: ['STAR: error que corregiste'] },
  criterios_listo_para_vacante: ['Responder 8 de 10 preguntas técnicas', 'Cerrar los tickets', 'Proyecto aprobado'],
};

describe('R-12 — SimulabV2 prompt-driven (como ChatGPT/Qwen)', () => {
  it('un documento generado por el prompt pasa validateSimulabV2 sin errores', () => {
    const v = validateSimulabV2(promptGenerated);
    expect(v.valid).toBe(true);
    expect(v.errors).toEqual([]);
  });

  it('rechaza un documento con golden no numérico', () => {
    const bad = JSON.parse(JSON.stringify(promptGenerated));
    bad.simulador_laboral.tickets[0].motor_mapping.golden = '128350';
    const v = validateSimulabV2(bad);
    expect(v.valid).toBe(false);
    expect(v.errors.some(e => e.includes('golden'))).toBe(true);
  });

  it('avisa (no falla) si un skill missing no está en engine_requirements', () => {
    const partial = JSON.parse(JSON.stringify(promptGenerated));
    partial.engine_requirements = partial.engine_requirements.filter((r: any) => r.id !== 'forecast');
    const v = validateSimulabV2(partial);
    expect(v.valid).toBe(true);
    expect(v.warnings.some(w => w.includes('Pronóstico') || w.includes('forecast'))).toBe(true);
  });

  it('compileRoute enruta la vacante a ETAPA_3 (pide experiencia, sin densidad)', async () => {
    const res = await compileRoute(
      'Puesto: Analista de Datos. Requisitos: SQL avanzado, Power BI con DAX, pronóstico. Experiencia: 1-2 años en puesto similar.',
      'user-test-prompt',
      'analyst',
    );
    expect(res.routing).toBe('ETAPA_3');
    expect(res.simulab.vacante.requiere_experiencia).toBe(true);
  });
});