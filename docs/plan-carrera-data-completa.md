# Plan — Carrera Data Completa (motores faltantes) — IMPLEMENTADO (R-15)

> Estado: **IMPLEMENTADO (R-15, 26-ago-2026)** — los 7 motores se construyeron y desplegaron. De 12 a **19 motores `exists`** (quedó `erp` como `missing` único). Backend `e1a0129` live. Verificado en prod: `powerbi_dax` valida `20/20`, `GET /api/automator/capabilities` lista los 7 con `status=exists` y validator.

## Dónde estamos hoy

`engineCapabilities.ts:37` — **12 `exists`** (verificados en código):

| Motor | Skill | App | Validator |
|-------|-------|-----|-----------|
| SQL | SQL | `SQLSim` | `sql` |
| ETL / Python | ETL, Python | `PipelineSim` / `NotebookSim` | `etl_clean` |
| dbt | dbt | `DBTSim` | — |
| Calidad | Calidad de datos | `CatalogSim` | `quality_decision` |
| Incidentes | Resolución de incidentes | `MonitorSim` | `incident` |
| Airflow | Airflow | `AirflowSim` | — |
| Cloud | Cloud | `CloudSim` S3/Redshift | — |
| BI Looker | BI | `BiSim` | — |
| EDA | EDA | `StatsSim` | `eda` |
| ML | ML | `MLSim` | `model` |
| Métricas | Métricas | — | `metrics` |
| Contable base | CFDI/Conciliación/Nómina/Fiscal | `AccountingForm` | — |

**Regla de oro R-09/R-12 intacta:** números/golden de motores reales; solo el texto de la vacante usa IA con fallback.

## Qué le falta a toda la carrera data (7)

De `engineCapabilities.ts:60`:

| # | Id | Skill vacante | Estado | Qué falta (gap) | Para qué fase |
|---|----|---------------|--------|-----------------|---------------|
| 1 | `excel_advanced` | Excel | `extends` | XLOOKUP, SUMIFS/COUNTIFS, tablas dinámicas, Power Query (hoy solo SUM/IF/VLOOKUP) | Analista |
| 2 | `power_bi` | Power BI | `missing` | DAX (CALCULATE, SUMX, medidas, filtros de contexto) + modelado + conector Postgres (hoy `BiSim` es solo Looker) | Analista / Ingeniería |
| 3 | `forecast` | Pronóstico | `missing` | Media móvil, tendencia lineal, PRONOSTICO, MAPE | Analista / Ciencia |
| 4 | `n8n` | Automatización | `missing` | Nodos/triggers/webhooks, workflows tipo n8n / Power Automate | Ingeniería |
| 5 | `llm_api` | APIs LLM | `missing` | Chat completions como herramienta (Gemini hoy solo califica en `providers/ai.ts`) | Ingeniería / Ciencia |
| 6 | `agents` | Agentes | `missing` | Loop agente→herramienta→memoria | Ingeniería / Ciencia |
| 7 | `prompt` | Prompt engineering | `missing` | Motor evaluable de prompts (few-shot, formato) | Ciencia / Ingeniería |
| — | `erp` | SAP/Oracle | `missing` | TableStore + TransactionEngine + FormEngine (transversal) | No bloquea data puro; se deja como último |

> Cada skill es detectada por `vacancyAnalyzer.ts` ("Power BI", "Pronóstico", "n8n", "API LLM", "Agente", "Prompt", "SAP") y, si falta, `roadmapCompiler.ts:25` hace `registerEngineRequirement()` → `ENGINE_BACKLOG`. Este plan es el blueprint que ese backlog debe construir.

## Visión completa

```
Analista (base)  ──────────────►  Ingeniería  ──────────────►  Ciencia
  SQL/Excel/BI/Catalog            + Foundry/dbt/Airflow/Cloud/ + Stats/ML/n8n/LLM
  + Power BI/DAX (1)              + n8n/LLM/Agentes/Prompt       + Forecast/Prompt
  + Forecast (2)                  Git/Monitor/DataOps            (evaluación)
```

Al completar, el alumno puede elegir: **"Quiero ser analista que automatiza con Power BI"** o **"quiero ser ingeniero que orquesta agentes con LLMs"** y el sistema le arma la ruta con herramientas reales, no mocks.

## Diseño por motor (qué se construye)

### 1. Excel avanzado (`extends`, P0)

- **Motor**: extender `SpreadsheetSim.tsx:evaluateFormula` con `XLOOKUP`, `SUMIFS`/`COUNTIFS`, pivots en memoria (`pivot()` sobre rangos), y Power Query simple (unir tablas).
- **App**: `SpreadsheetSim` (ya existe) + `BiSim` para pivots.
- **Workflow**: `excel_advanced` (DE) — validar `XLOOKUP` y `SUMIFS` con golden.
- **Tests**: `tests/excel-advanced.test.ts`.

### 2. Power BI / DAX (`missing`, P1)

- **Motor DAX** (`backend/src/services/daxEngine.ts` nuevo): `CALCULATE`, `SUMX`, `FILTER`, `ALL`, medidas, filtros de contexto, evaluación sobre `compileModelSql` (mismo mart 128350).
- **App**: `PowerBISim.tsx` (nueva, al lado de `BiSim`): modelado (tablas/relaciones), editor DAX, visuales (matriz, gráfico), publicación.
- **Conector**: Postgres FDW (reusa `ingest`-PG) + Excel.
- **Workflow**: `powerbi_dax` (analista/ingeniería), validator `dax`.
- **BuildPlan** ya declarado en `engineCapabilities.ts:63`.

### 3. Pronóstico (`missing`, P1)

- **Motor**: `backend/src/services/forecastEngine.ts`: media móvil, tendencia lineal, `PRONOSTICO` (Excel), error `MAPE`.
- **App**: `ForecastSim.tsx` (serie del mart + controles de ventana + MAPE).
- **Workflow**: `forecast_sales` (analista/ciencia), validator `forecast`.
- **Fuente**: misma `st_mart_ventas` / `ingest`-PG.

### 4. Automatización n8n / Power Automate (`missing`, P2)

- **Motor**: `backend/src/services/automationEngine.ts`: grafo de nodos (trigger cron/webhook/manual → nodos HTTP/LLM/Sheets/BD → salida), runner determinístico con `seed`.
- **App**: `AutomationSim.tsx` (canvas tipo n8n, nodos arrastrables, logs).
- **Workflow**: `automation_etl` (ingeniería), validator `automation`.
- **Alias**: `n8n`, `power automate`, `make`.

### 5. APIs de modelos LLM (`missing`, P2, depende de 4)

- **Motor**: `backend/src/services/llmApiEngine.ts`: `chat.completions` (system prompt, temp, tokens, costo), registro de llamadas, no solo calificación.
- **App**: `ApiClientSim` extiende a endpoints `POST /api/llm/chat` (hoy solo `/api/sim/*`), con api-key de alumno en vault (no en localStorage).
- **Workflow**: `llm_integration` (ingeniería/ciencia), validator `llm_api`.
- **Seguridad**: rate limit + PII scrub + allowlist de modelos.

### 6. Agentes (`missing`, P2, depende de 5+4)

- **Motor**: `backend/src/services/agentEngine.ts`: loop `percepción → decisión → acción (tool) → memoria` (máx 5 pasos, con `seed`), tools = las apps anteriores (SQL, n8n, LLM).
- **App**: `AgentSim.tsx` (chat del agente, traza de tools, memoria).
- **Workflow**: `agent_task` (ingeniería), validator `agent`.

### 7. Prompt engineering (`missing`, P3, depende de 5)

- **Motor**: `backend/src/services/promptEngine.ts`: rúbrica evaluable (claridad, few-shot, formato JSON), comparación A/B.
- **App**: `PromptSim.tsx` (editor side-by-side, antes/después, score).
- **Workflow**: `prompt_engineering` (ciencia), validator `prompt`.

> `erp` queda como `missing` aparte; si se prioriza, sigue `TableStore + TransactionEngine + FormEngine` (`engineCapabilities.ts:80`).

## Integración en la carrera (cómo desbloquea)

| Fase | Motores nuevos que gana | Apps nuevas en DesktopShell | Workflows que valida |
|------|------------------------|-----------------------------|----------------------|
| **Analista** | Excel avanzado, Power BI, Pronóstico | `SpreadsheetSim` extendido, `PowerBISim`, `ForecastSim` | `excel_advanced`, `powerbi_dax`, `forecast_sales` |
| **Ingeniería** | + n8n, APIs LLM, Agentes | `AutomationSim`, `ApiClientSim` (LLM), `AgentSim` | `automation_etl`, `llm_integration`, `agent_task` |
| **Ciencia** | + Prompt | `PromptSim` | `prompt_engineering` |

`careerPath.ts:46` (`computePracticePct = 0.45*tasks+0.35*sims+0.20*cases`) no cambia; los sims nuevos cuentan en `sims.validated`. El árbol actual (`analyst → ingeniería/ciencia`) no necesita un tercer nodo: los motores se desbloquean por `appSet` dentro de cada rama (feature flags por `pendingEngines`). Si se quiere, R-07 permite añadir `RouteNode = 'automation'` sin tocar `UNLOCK_PCT`.

## API / Datos / Validación

- Nuevas rutas: `POST /api/dax/evaluate`, `POST /api/forecast/run`, `POST /api/automation/run`, `POST /api/llm/chat`, `POST /api/agent/run`, `POST /api/prompt/evaluate` (todas `requireSupabaseAuth`, con `workflowId` para `workflowStore` TTL 30m, y `quality_events` para R-11).
- Cada workflow nuevo usa su motor como **golden** (`auditCase` 9 checks, incluido `goldenFromEngine`), con `seed = hash(userId:weekKey:arcId)` (igual que `caseGenerator.ts`).
- `piiScrubber.ts` obligatorio en LLM/Agentes.

## Plan de pruebas (cuando se construya)

| Suite | Qué verifica |
|-------|--------------|
| `tests/dax.test.ts` | `CALCULATE`+`SUMX` sobre mart → golden 128350 |
| `tests/forecast.test.ts` | Media móvil y MAPE contra serie `st_mart_ventas` |
| `tests/automation.test.ts` | Grafo n8n determinístico por seed, 3 nodos → log golden |
| `tests/llm-api.test.ts` | `chat.completions` mock → costo/tokens registrados |
| `tests/agent.test.ts` | Loop 3 pasos → usa SQL + LLM + memoria |
| `tests/prompt.test.ts` | Prompt A/B → score rúbrica sube |
| `tests/engine-backlog.test.ts` | `pendingEngines` ya no lista los construidos |

## Rollout ( Pendiente )

| Fase | Duración | Entrega |
|------|----------|---------|
| **0 — Diseño** (este doc) | — | `pendingEngines` muestra 7 `missing`, no hay código |
| **1 — Base analista** | 2 sem | Excel avanzado + Power BI (DAX) + Pronóstico → ya usable en fase analista |
| **2 — Ingeniería** | 2 sem | n8n + APIs LLM + Agentes → desbloquea Ingeniería completa |
| **3 — Ciencia** | 1 sem | Prompt engineering → Ciencia completa |
| **4 — Cierre** | 1 sem | Staff: tabla de motores por alumno + reset, docs y `npm run audit:story` ampliada |

## Criterios de salida de PENDIENTE

- `GET /api/automator/capabilities` lista los 7 como `exists`.
- `GET /api/automator/pending-engines` vacío para un alumno demo que pide "Power BI + n8n + Agentes".
- Ruta de prueba: vacante CHRISTUS ("Power BI, SQL") → `MODO_A` con `PowerBISim` y DAX validado; vacante Brick Walling ("n8n, Python, Agent") → `MODO_B` con `AutomationSim` + `AgentSim` y validación `agent`.
- `npm run test` verde (≥ 290 tests) y `npm run audit:story` verde.

---
*Dejar este archivo es la forma auditable de mantener el pendiente: no se crea rama, no se toca `simWorld` ni se añade migración hasta priorizar. Cuando se priorice, cada motor se implementa siguiendo su `buildPlan` (arriba) y la regla de oro R-09.*
