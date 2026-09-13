# R-12 — Agente-automatizador de rutas y auto-extensión de motores

**Fecha**: 19-ago-2026 · **Estado**: implementado y verificado (233 root / 106 audit / backend tsc limpio)

## Objetivo

Que una **vacante real** (pegada por el staff) produzca una **ruta SIMULAB v2 completa** cableada a las 3 Etapas de R-10, y que el sistema **detecte y registre los motores faltantes** para auto-extender sus capacidades tras cada vacante.

## Problema que resuelve

El sistema puede entrenar a contadores y analistas/ingenieros/científicos de datos, pero NO cargaba vacantes externas (p.ej. CHRISTUS Muguerza o Brick Walling) como rutas de entrenamiento. R-12 cierra ese hueco con un **agente-automatizador**:

1. **Analiza** la vacante (IA con fallback determinístico) → skills, peso, años de experiencia, seniority.
2. **Mide el match** con el perfil real del alumno (motores reales de R-10: `matchScorer`).
3. **Enruta** a Etapa 1/2/3 (motor real de R-10: `stageRouter`).
4. **Resuelve capacidades de motor** para cada skill (`engineCapabilities`): `exists` / `extends` / `missing`.
5. **Registra** los motores faltantes en un backlog → el sistema sabe qué construir después de cada vacante (auto-extensión).
6. **Genera** el documento `SimulabV2` estándar (prueba de Etapa 1 + tickets de Etapa 2 + criterio de Etapa 3) y lo valida.

## Regla de oro (heredada de R-09/R-11)

- match / golden / routing / densidad salen de **motores reales** (`matchScorer`, `stageRouter`, `computeMatch`, `expediente`).
- Solo el **texto del documento** de la ruta es heurístico (IA con fallback determinístico).
- Nada se despliega sin el gate de staff + auditoría `story-coherence`.

## Cambios en R-10 (requeridos)

`vacancyAnalyzer.ts`:

- **SKILL_KEYWORDS ampliados**: Power BI, Pronóstico, Automatización (n8n), APIs LLM, Agentes, Prompt engineering, ERP.
- `requires_experience = min_years >= 1` (antes `> 2`): un puesto que pide experiencia (1+ años) exige acreditar equivalencia → Etapa 3. El caso junior "1-2 años en puesto similar" ahora enruta a Etapa 3 (verificable con expediente R-08), en vez de caer en Modo B.

## Componentes nuevos

### `backend/src/services/simulabFormat.ts`
Formato estándar `SimulabV2`:
- `simId`, `empresa`, `puesto`, `objetivo`, `fecha_creacion`.
- `analisis_requerimientos`: skills con peso, obligatorio/deseable, años, seniority.
- `motor_mapping`: skill → `{ taskType, validator, tool, golden, branch }`.
- `engine_requirements`: `{ capability, status: exists|extends|missing, gap, build_plan }`.
- `etapas`: `etapa1` (prueba con `match_pct`, `routing`), `etapa2` (modo A/B + tickets), `etapa3` (densidad objetivo, `experiencia_equivalente`).
- `validateSimulabV2(doc)` → lista de errores. `simId(empresa, puesto)` → slug estable.

### `backend/src/services/engineCapabilities.ts`
Registro `ENGINE_CAPABILITIES` (17 capacidades + `excel_advanced` en `extends`):

| id | skill | status | motor real |
|----|-------|--------|-----------|
| sql | SQL | exists | `compileModelSql` |
| excel | Excel | exists | `evaluateFormula` |
| excel_advanced | Excel | extends | tabla dinámica/formato → falta `excel_advanced` |
| dbt | dbt | exists | DBTSim |
| python | Python | exists | NotebookSim |
| etl | ETL | exists | PipelineSim |
| airflow | Airflow | exists | AirflowSim |
| cloud | Cloud | exists | CloudSim |
| bi | BI | exists | BiSim |
| calidad | Calidad | exists | CatalogSim + validators |
| incidentes | Incidentes | exists | MonitorSim + `recoverIncident` |
| eda | EDA | exists | StatsSim |
| ml | ML | exists | MLSim |
| cfdi | CFDI | exists | AccountingSystem |
| conciliacion | Conciliación | exists | BankingPortal + paymentMatching |
| nomina | Nómina | exists | SpreadsheetSim |
| fiscal | Fiscal | exists | AccountingSystem |
| power_bi | Power BI | **missing** | → `PowerBISim` (DAX) |
| forecast | Pronóstico | **missing** | → motor de pronóstico |
| n8n | Automatización | **missing** | → motor de nodos/triggers/webhooks |
| llm_api | APIs LLM | **missing** | → chat completions |
| agents | Agentes | **missing** | → loop agente→tool |
| prompt | Prompt engineering | **missing** | → prompts evaluables |
| erp | ERP | **missing** | → TableStore + TransactionEngine + FormEngine |

Backlog: `ENGINE_BACKLOG` (memoria) con `registerEngineRequirement` (dedupe por id) y `pendingEngines()`.

### `backend/src/services/roadmapCompiler.ts`
Agente que ejecuta el pipeline: `compileRoute(vacancyText, userId, specialty)` → `CompiledRoute`:
- `simulab` (SimulabV2 validado), `match_pct`, `routing` (E1/E2-A/E2-B/E3), `routing_detail`,
- `missing_engines` (nuevos registrados en backlog), `requires_engine_build`, `validation` (errores del doc).

`SKILL_TO_BRANCH` mapea cada skill a la rama de arcos (`analyst`/`engineering`/`science`/`accounting`).

### `backend/src/routes/automator.ts`
| Endpoint | Función |
|----------|---------|
| `GET /api/automator/capabilities` | lista el registro de capacidades |
| `GET /api/automator/pending-engines` | backlog de motores a construir |
| `POST /api/automator/compile` | vacante → ruta SIMULAB v2 (+ registra faltantes) |
| `POST /api/automator/validate` | valida un documento SimulabV2 |
| `POST /api/automator/backlog/clear` | admin: limpia backlog |
| `POST /api/automator/backlog/complete` | admin: marca un motor como construido |

## Tests

`tests/automator-routes.test.ts` (12):

1. `resolveCapability('SQL')` → sql (exists).
2. `resolveCapability('Power BI')` → power_bi (missing) — **antes resolvía `bi` por substring**.
3. `resolveCapability('Excel')` → excel_advanced (extends).
4. `resolveCapability('n8n')` → n8n por alias.
5. `resolveCapability('SAP')` → erp por alias.
6. `registerEngineRequirement` agrega y dedupe por id (added true → false).
7. Vacante CHRISTUS (analista con Power BI + pronóstico) → missing_engines contiene `power_bi` y `forecast`, `requires_engine_build=true`.
8. Vacante Brick Walling (IA/automatización/LLM) → missing_engines contiene `n8n`/`llm_api`/`agents`, match bajo, enruta Modo B.
9. Vacante CHRISTUS → routing ETAPA_3 (pide 1-2 años, alumno sin densidad) + `experiencia_equivalente`.
10. compileRoute devuelve `simulab` válido (validateSimulabV2 sin errores) con `motor_mapping` y `etapas`.
11. Vacante sin motores faltantes → `requires_engine_build=false`.
12. compileRoute no toca el progreso real del alumno (match/mundo inmutables).

## Gaps resueltos durante implementación

1. **`resolveCapability` substring-greedy**: `'power bi'.includes('bi')` resolvía a `bi` (exists) en vez de `power_bi`. → Prioridad: alias exacto → skill exacto → substring.
2. **`registerEngineRequirement` siempre `added:true`**: el flag no reflejaba el dedupe. → `added = !exists`.
3. **`requires_experience > 2`**: los puestos junior de 1-2 años no acreditaban experiencia. → `>= 1` (alineado con la Etapa 3 de R-10).

## Suite final

- Root: **233** tests (26 files) — incluye `automator-routes` (12).
- Audit: **106** (`npm run audit:story`).
- Backend: `npx tsc --noEmit` limpio.