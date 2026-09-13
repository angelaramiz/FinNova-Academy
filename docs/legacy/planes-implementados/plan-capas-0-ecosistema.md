# Plan — Capas 0 (Fundamentos) + Ecosistema por Especialidad — IMPLEMENTADO

> Estado: **IMPLEMENTADO (R-15, 26-ago-2026)** — los 9 gaps de la auditoría se resolvieron y desplegaron. Backend `458ffc8` / frontend `a9e67cd`. Verificado en prod: `task-plan?route=analyst` lista `excel_basico→sql_basico→catalog_basico→bi_basico→ecosistema_da`; `excel_basico` y `bi_basico` validan 10/10. Suite 301 tests / audit 106 / builds limpios.

> Estado: **PENDIENTE** — diseño para anteponer una **Capa 0** de fundamentos por herramienta antes de la práctica integrada del ecosistema, en cada rama. No se toca `ENGINE_CAPABILITIES` ni se aplica migración hasta priorizar. Encaja en `taskPlanner.ts:352` y `careerPath.ts:15` (`UNLOCK_PCT=40`, `practicePct=0.45*tasks+0.35*sims+0.20*cases`).

## Principio

> **Nunca orquestar sin antes dominar la herramienta.** Capa 0 = concepto mínimo evaluable; Capa 1 = ecosistema (mismo dataset, herramientas juntas, caso real). Capa 0 no cuenta como `countsAsCase` (no infla expediente), pero sí como `sims.validated` y desbloquea la rama.

```
DA:  [Capa0 Excel→SQL→Catalog→BI básico] → [Ecosistema DA: Power Pivot/DAX + UNIQUE/FILTER + pivot + forecast] → Capstone DA (Guess 5k SKUs, 5→2 días)
DE:  [Capa0 Python→Foundry→Airflow→Git→Monitor básico] → [Ecosistema DE: n8n + LLM API + Agente sobre lno_sales_pipeline/05-jul + S3/Redshift] → Capstone DE
DS:  [Capa0 Stats→ML básico→SQL/métricas] → [Ecosistema DS: EDA→baseline→eval→forecast→Prompt sobre mart degradado 128350] → Capstone DS
```

## Capa 0 — Fundamentos por herramienta (tickets cortos, cierre por criterio)

Cada mini-módulo: `type: tool_fundamentals`, `difficulty:1`, `15 min`, `tool` embebida, `validator: de|advanced` básico. No `incident_recovery`.

### DA — Analista (semana 2, antes de ADVANCED_WEEKS.analyst)

> ⚠️ Auditoría 26-ago-2026: el validador `bi` NO existe hoy (deValidation: `sql|etl_clean|quality_decision|review|incident`; dsValidation: `eda|model|metrics`; advanced: `excel|dax|forecast|automation|llm_api|agent|prompt`). Se **debe crear** en Capa 0; no reusar uno inexistente (caería a "Validador desconocido" → siempre reprueba). Alternativa de menor esfuerzo: que `bi_basico` valide con `dax` (ya existe) o crear `bi` como check simple de "modelo→1 visual".

| Id | Herramienta | Ticket SIMULAB v2 (cierre por criterio) | Validator |
|----|-------------|------------------------------------------|-----------|
| `excel_basico` | SpreadsheetSim | Tabla 200 filas, tipos correctos, Power Query sin nulos, cargada como Tabla | `excel` (base SUM/IF) |
| `sql_basico` | SQLSim | `SELECT + WHERE + JOIN + GROUP BY` sobre `ventas×clientes` | `sql` |
| `catalog_basico` | CatalogSim | Linaje `raw→stg→mrt` localizado | `quality_decision` |
| `bi_basico` | BiSim | Un visual (barras por cliente) publicado | `bi` **(nuevo, a crear)** o `dax` |

`FUNDAMENTALS_WEEKS.DA = { week:2, theme:"Fundamentos Analista", tasks:[{excel_basico:1},{sql_basico:1},{catalog_basico:1},{bi_basico:1}] }`

### DE — Ingeniero (semana 2, antes de ADVANCED_WEEKS.engineering)

| Id | Herramienta | Criterio |
|----|-------------|----------|
| `python_basico` | `df.head/describe`, `dropna` | `etl_clean` base |
| `foundry_basico` | `@transform` mínimo (leer→tipos) | `etl_clean` |
| `airflow_basico` | DAG 2 tareas con dependencia | `de` exact |
| `git_basico` | PR sin `SELECT *` | `review` |
| `monitor_basico` | SLA 05-jul localizado | `incident` (solo lectura) |

### DS — Científico (semana 3, antes de ADVANCED_WEEKS.science)

| Id | Herramienta | Criterio |
|----|-------------|----------|
| `stats_basico` | `describe`, distribución, nulos | `eda` base |
| `ml_basico` | `train/test 80/20`, target `churn` | `model` base |
| `metricas_basico` | RMSE/accuracy reportados | `metrics` base |

## Capa 1 — Ecosistema (herramientas + motores en conjunto)

Usa el **mismo dataset/caso** de la Capa 0, pero orquestado.

### DA — Ecosistema (ya existe, es el ticket Guess)

`SIMULAB_guess_encargado_almacen` (`docs/simulab-v2-guess-encargado-almacen.json`, `extends: excel_advanced`) — c/buildPlan:

```json
{
  "simulab_id": "SIMULAB_guess_encargado_almacen",
  "p1_datos":   { "densidad": 0.4,  "ticket": "PQ_Limpieza",  "cierre": "CSV 5k filas Power Query, sin nulos, Tabla Movimientos" },
  "p2_pivot":   { "densidad": 0.2,  "ticket": "PT_ABC",       "cierre": "Dinámica Categoría>SKU, Mes en columnas, % acumulado ABC" },
  "p3_formulas":{ "densidad": 0.15, "ticket": "FR_Cruzada",   "cierre": "SUMAR.SI.CONJUNTO + BUSCARX Físico vs Sistema" },
  "p4_dash":    { "densidad": 0.15, "ticket": "DS_Gerencial", "cierre": "3 segmentadores → 3 gráficos dinámicos" },
  "p5_eval":    { "densidad": 0.1,  "ticket": "EV_Oral",      "cierre": "Oral 5 min flujo + merma" }
}
```

Motores: `SpreadsheetSim (XLOOKUP/BUSCARX, SUMIFS, UNIQUE, FILTER) + Power Pivot/DAX` (`PowerBISim` `CALCULATE/SUMX` sobre `MART_TOTAL=128350`) + `ForecastSim` (media móvil/MAPE).

### DE — Ecosistema

Caso: `lno_sales_pipeline` + `raw_ventas` 1.5k filas → `PipelineSim` (ingesta) → `DBTSim` (mrt 128350) → `AutomationSim` (n8n workflow cron 06:00, nodos HTTP→SQL→notify) → `ApiClientSim` (`llm_api` chat completions `system prompt + temp`) → `AgentSim` (loop tool+memoria) → `DataOpsSim` (SLA 05-jul verde). Validadores `automation/llm_api/agent`.

### DS — Ecosistema

Caso churn degradado (incidente 05-jul) → `StatsSim` (EDA sobre mart) → `MLSim` (baseline) → `ForecastSim` (media móvil sobre serie `[112400,118900,124150,128350]`) → `PromptSim` (few-shot + formato) → re-eval `eval_metricas`. Validadores `eda/model/metrics/forecast/prompt`.

## Integración técnica (cuando se priorice)

| Archivo | Cambio |
|---------|--------|
| `backend/src/services/dataEngineeringWorkflows.ts` | Añadir 12 generadores `fundamentals_*` + 3 `ecosistema_*` (`type: tool_fundamentals / ecosystem`) |
| `backend/src/services/advancedDataEngines.ts` | Validadores ya existen (`excel/dax/forecast/automation/llm_api/agent/prompt`) — Capa 0 usa umbral básico, Capa 1 exige `CALCULATE+XLOOKUP+MAPE<10` |
| `backend/src/services/deValidation.ts` | **(nuevo)** añadir `bi` a `DEValidatorId` + `validateBI` (modelo→1 visual) para `bi_basico` |
| `backend/src/services/taskPlanner.ts` | `FUNDAMENTALS_WEEKS` por rama + `ADVANCED_WEEKS`/`ECOSYSTEM_WEEKS`; `generateMonthPlan` inserta Capa 0 antes de Capa 1 (`week 2 → Capa 0, week 3 → Ecosistema` para cada `route`) |
| `backend/src/services/specialties.ts` | `DE_SPECIALTY.workflowTypes` añade `*_basico` y `*_ecosistema` |
| `alumnos/src/components/DesktopShell.tsx` | `analystApps/engineeringApps/scienceApps` ya tienen las apps; añadir `ECOSYSTEM_SLOTS` y agenda `Capa 0 / Ecosistema` |
| `tests/capa-zero.test.ts` (nuevo) | Fundamentos: cada `*_basico` valida `maxPossible>0` y no puntúa como `countsAsCase` |

## Métrica / Desbloqueo

- Capa 0 completa (4-5 minis) ≈ `sims.validated +4`, `practicePct` +12–15 puntos → empuja hacia `UNLOCK_PCT=40` sin caso.
- Capstone del ecosistema sí es `countsAsCase=true` y alimenta `expediente.ts` (caso integrador).

## Criterios de salida de PENDIENTE

- Un alumno nuevo `data_engineering` en `analyst` ve en semana 2 los 4 minis (Excel→SQL→Catalog→BI) y en semana 3 el ticket Guess completo; al aprobarlos, `practicePct` sube y desbloquea la rama sin haber hecho un caso.
- `npm run test` (≥ 310 tests) verde, `audit:story` verde, y `GET /api/sim/task-plan/6/2026?route=analyst` lista primero los `*_basico`.

## Auditoría de aplicabilidad (26-ago-2026) — RESUELTO (los 9 gaps)

Verificado contra el código real. Los 9 gaps se implementaron y desplegaron (`458ffc8`/`a9e67cd`):

| # | Gap | Resolución |
|---|-----|-----------|
| 1 | Validador `bi` no existe | Creado `validateBI` + `basic_read` en `deValidation.ts` |
| 2 | ~15 workflows nuevos | `fundamentals.ts`: 12 `fundamentals_*` + 3 `ecosistema_*` |
| 3 | ~15 templates + semanas | `taskPlanner`: `FUNDAMENTALS_WEEKS`/`ECOSYSTEM_WEEKS` por rama, fusionadas |
| 4 | Router no conoce los tipos | `workflows.ts` `fundamentalsTypes` en `GET` + fallback `/validate` |
| 5 | `?route` ignorado | `simEngine.ts`: `task-plan`/`today-tasks`/`week-tasks` leen `route` |
| 6 | `sims.total` hardcodeado | `computePracticeBreakdown` deriva del plan; `countsAsCase` persistido |
| 7 | Validadores "solo lectura" | `basic_read` cubre `monitor/airflow` de lectura |
| 8 | Agenda/slots frontend | `ECOSYSTEM_SLOTS` + `renderTool` stats/ml/monitor |
| 9 | Tests | `tests/capa-zero.test.ts` (6) |

---
*Mantener este doc permite auditar la deuda sin construirla; al priorizar, cada Capa 0/Ecosistema se implementa siguiendo su `buildPlan` y la regla de oro R-09.*
