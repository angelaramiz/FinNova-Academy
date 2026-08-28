# Plan de QA en Producción — Carrera Data (Capa 0 → Ecosistema) — PENDIENTE DE EJECUTAR

> Objetivo: validar con **Chrome DevTools** que todo el flujo de la carrera data desde la **Capa 0** esté integrado: inputs reciben datos correctos, outputs devuelven resultados correctos, sin bugs, y el ciclo completo (fundamentos → ecosistema → progreso → desbloqueo) sea funcional.

## Alcance
- Especialidad `data_engineering`, ramas **analyst / de / ds**.
- Flujo: **Capa 0** (fundamentos) → **Ecosistema** (herramientas juntas) → **Capstone** → **progreso/desbloqueo** (`careerPath`).
- Backend `https://finnova-back.onrender.com` · Frontend `https://finnova-academy.onrender.com`.
- Cuenta demo: `student_tester@gmail.com` / `demo1234` (specialty `practicas`; para data usar el toggle DEMO de rutas).

## Herramientas (Google)
- **Chrome DevTools** (Network, Console, Elements, Application/LocalStorage, Lighthouse).
- `fetch` vía DevTools Console para validar APIs (UTF-8, sin artefactos PowerShell).

## Criterio de entrada (gate)
`npm run test` (301) verde, `npm run audit:story` (106) verde, builds limpios. Deploy backend `458ffc8` / frontend `a9e67cd` **live**.

---

## Bloque A — Autenticación y perfil
| # | Paso (DevTools) | Esperado | Cómo validar |
|---|-----------------|----------|--------------|
| A1 | `POST /api/auth/login-credentials` | `200` + token | Console `fetch` |
| A2 | `GET /api/auth/me` con token | devuelve `practicas` o role correcto | Console |
| A3 | `GET /api/sim/my-profile` | `specialty` hereda de DB (no hardcode), `assignedJob` coherente | Console |
| A4 | Onboarding → oficina 3D → escritorio | banner "OFICINA VIRTUAL" no muestra Analista stale | Elements/Console |

## Bloque B — Task-planner por rama (Capa 0 / Ecosistema)
| # | Paso | Esperado | Cómo validar |
|---|------|----------|--------------|
| B1 | `GET /api/sim/task-plan/6/2026?specialty=data_engineering&route=analyst` | types incluyen `excel_basico,sql_basico,catalog_basico,bi_basico,ecosistema_da,powerbi_dax,forecast_sales,excel_advanced` | Console (JSON) |
| B2 | idem `route=de` | `python_basico,foundry_basico,airflow_basico,git_basico,monitor_basico,ecosistema_de,automation_etl,llm_integration,agent_task` | Console |
| B3 | idem `route=ds` | `stats_basico,ml_basico,metricas_basico,ecosistema_ds,prompt_engineering,eda_churn,modelo_baseline,eval_metricas` | Console |
| B4 | Sin `route` (analista puro) | semana 2 = fundamentos, semana 3 = ecosistema (orden Capa 0→Capa 1) | Console |

## Bloque C — Workflows Capa 0 (input correcto → output correcto)
Por cada `*_basico` (`excel,sql,catalog,bi,python,foundry,airflow,git,monitor,stats,ml,metricas`):
| # | Paso | Esperado |
|---|------|----------|
| C1 | `GET /api/workflows/<tipo>` | `200`, steps `email→tool→form→result`, `tool.app` mapea a herramienta real |
| C2 | `POST /api/workflows/validate` con respuesta **correcta** | `passed=true`, `maxPossible>0` (NO 0/0) |
| C3 | idem con respuesta **incorrecta** | `passed=false` |
| C4 | `tool.app` renderiza la app correcta en DesktopShell (`renderTool`: excel→Spreadsheet, sql→SQLSim, stats→StatsSim, ml→MLSim, monitor→MonitorSim, powerbi→PowerBISim…) | Elements: no "Herramienta no disponible" |

Validadores verificados: `sql`(A), `etl_clean`(python/foundry), `quality_decision`(catalog), `review`(git), `incident`/`basic_read`(monitor), `bi`(bi), `eda`(stats), `model`(ml), `metrics`(metricas), `basic_read`(excel/airflow).

## Bloque D — Workflows Ecosistema (integración)
| # | Tipo | Validator | Output golden |
|---|------|-----------|---------------|
| D1 | `ecosistema_da` | `dax` | CALCULATE+SUMX → 20/20 |
| D2 | `ecosistema_de` | `automation` | trigger+nodos → 20/20 |
| D3 | `ecosistema_ds` | `forecast` | media móvil+MAPE → 20/20 |
| D4 | `powerbi_dax` / `forecast_sales` / `automation_etl` / `llm_integration` / `agent_task` / `prompt_engineering` | advanced | correcto 20/20, incorrecto fail |

## Bloque E — Motores reales (golden)
| # | Motor | Valor esperado | Cómo validar |
|---|-------|----------------|--------------|
| E1 | `daxTotalVentas` | `128350` | `GET /api/workflows/powerbi_dax` + validate |
| E2 | Forecast media móvil | serie `[112400,118900,124150,128350]`, MAPE<10 | `ForecastSim` |
| E3 | `computePracticeBreakdown` | `sims.total` derivado (no 8 fijo) | `GET /api/sim/world` → careerPath.breakdown |
| E4 | `countsAsCase` | ecosistema cuenta como caso; fundamentos NO | tras validar un ecosistema, breakdown.cases sube |

## Bloque F — Progreso y desbloqueo
| # | Paso | Esperado |
|---|------|----------|
| F1 | Validar 4 fundamentos DA | `sims.validated` +4; `practicePct` sube (no satura) |
| F2 | `GET /api/sim/career-path` | `practicePct` ≥ umbral → `unlocked.data_engineering=true` |
| F3 | `POST /api/sim/career-path/demo-override` | `demoOverride.enabled=true`, `practicePct` **NO cambia** (inmutable) |
| F4 | `GET /api/sim/story/state?route=analyst` | `arcId` correcto, sin fugas contables |

## Bloque G — Frontend / UI (Chrome DevTools)
| # | Paso | Esperado |
|---|------|----------|
| G1 | **Console**: 0 errores JS al cargar escritorio + abrir cada app | sin `TypeError`/`Cannot read` |
| G2 | **Network**: las llamadas a `/api/workflows/*` y `/api/sim/progress/record` → 200 | sin 4xx/5xx |
| G3 | **Elements**: cada tool embebida (`iframe`/componente) con `data-guide` donde aplique | sin "Herramienta no disponible" |
| G4 | **Application/LocalStorage**: `sim_specialty`=practicas/data correcto; sin `sim_assigned_job` Analista stale | coherente con perfil |
| G5 | **Agenda**: semana muestra bloques Capa 0 / Ecosistema según fase | `ANALYST_SLOTS`/`ECOSYSTEM_SLOTS` |
| G6 | **Lighthouse** (accesibilidad) | sin errores críticos |

## Bloque H — Anti-regresión
| # | Check |
|---|-------|
| H1 | Ningún workflow `*_basico`/`*_ecosistema` tiene `maxPossible=0` (auto-aprueba) |
| H2 | `GET /api/automator/capabilities` → 7 avanzados `exists`; `pending-engines` no los lista |
| H3 | `audit:story` (106) y suite (301) siguen verdes |
| H4 | Mojibake: sin `â/ð/Ã` en la UI de las apps nuevas |

## Registro de ejecución
| Bloque | Fecha | Resultado | Defectos |
|--------|-------|-----------|----------|
| A | — | ⬜ | — |
| B | — | ⬜ | — |
| C | — | ⬜ | — |
| D | — | ⬜ | — |
| E | — | ⬜ | — |
| F | — | ⬜ | — |
| G | — | ⬜ | — |
| H | — | ⬜ | — |

## Criterio de salida (go-live Capa 0)
- Bloques A–H todos ✅ con evidencias (capturas/screenshots de DevTools).
- Sin `0/0` auto-aprueba; inputs y outputs correctos en los 15 workflows.
- Progreso/desbloqueo funcional: 4 fundamentos → `practicePct` sube y `unlocked=true`.
- Sin errores de consola ni 4xx/5xx en el flujo completo.

---
*Este plan se ejecuta con Chrome DevTools en producción. Al completar cada bloque se marca ✅ y se adjunta evidencia (Network/Console/Elements).*