# Reporte de Ejecución — Plan QA Producción Capa 0

> **Plan base:** `docs/plan-qa-produccion-capa0.md` (R-15, 26-ago-2026)  
> **Ejecución:** 2026-08-26 · usando **Chrome DevTools** (Network/Console/Elements/Application) + `fetch` vía DevTools Console  
> **Entornos:** Backend `https://finnova-back.onrender.com` · Frontend `https://finnova-academy.onrender.com`  
> **Cuenta:** `student_tester@gmail.com` / `demo1234` (`specialty: practicas`; data vía toggle DEMO rutas)  
> **Gates de entrada:** Build backend `458ffc8` · Frontend bundle `BOqFr3Pz` · Suite 301 / audit 106 verdes

| Bloque | Descripción | Estado |
|--------|-------------|--------|
| A | Autenticación y perfil | ⬜ Pendiente |
| B | Task-planner por rama (Capa 0 / Ecosistema) | ⬜ Pendiente |
| C | Workflows Capa 0 (12 fundamentos) | ⬜ Pendiente |
| D | Ecosistema avanzado (3 + 7) | ⬜ Pendiente |
| E | Motores reales (golden) | ⬜ Pendiente |
| F | Progreso y desbloqueo | ⬜ Pendiente |
| G | Frontend / UI | ⬜ Pendiente |
| H | Anti-regresión | ⬜ Pendiente |

---

## Bloque A — Autenticación y perfil
> **Objetivo:** login, token, specialty hereda de DB sin hardcode, banner sin Analista stale

| # | Paso (Chrome DevTools) | Esperado | Resultado | Evidencia |
|---|------------------------|----------|-----------|-----------|
| A1 | `POST /api/auth/login-credentials` vía Console `fetch` | `200` + token |  |  |
| A2 | `GET /api/auth/me` con token | `practicas` |  |  |
| A3 | `GET /api/sim/my-profile` | `specialty:practicas`, `assignedJob:Practicante` (select * hereda) |  |  |
| A4 | Navegar `/student` y revisar `Elements` `🏢 OFICINA VIRTUAL — PRACTICANTE... / Logística del Norte` | sin Analista stale |  |  |

**Conclusión Bloque A:** ⬜

---

## Bloque B — Task-planner por rama (Capa 0 / Ecosistema)
> Objetivo: `?route` filtra fundamentos→ecosistema en orden Capa 0→Capa 1 (no calendario)

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| B1 | `GET /api/sim/task-plan/6/2026?specialty=data_engineering&route=analyst` (Console fetch) | `excel_basico,sql_basico,catalog_basico,bi_basico,ecosistema_da,powerbi_dax,forecast_sales,excel_advanced` |  |  |
| B2 | idem `route=de` | `python_basico,foundry_basico,airflow_basico,git_basico,monitor_basico,ecosistema_de,automation_etl,llm_integration,agent_task` |  |  |
| B3 | idem `route=ds` | `stats_basico,ml_basico,metricas_basico,ecosistema_ds,prompt_engineering` |  |  |
| B4 | Sin `route` → orden Capa 0(week2) antes de Ecosistema(week3) | week 2 = fundamentos |  |  |

**Conclusión Bloque B:** ⬜

---

## Bloque C — Workflows Capa 0 (12 fundamentos: inputs correctos → outputs correctos, sin 0/0)

| # | Tipo | Validador | Tool.app | Resultado | Evidencia |
|---|------|-----------|---------|-----------|-----------|
| C1 | `excel_basico` | `basic_read` | `excel` (SpreadsheetSim) | ⬜ |  |
| C2 | `sql_basico` | `sql` | `sql` | ⬜ |  |
| C3 | `catalog_basico` | `quality_decision` | `catalog` | ⬜ |  |
| C4 | `bi_basico` | `bi` | `bi` | ⬜ |  |
| C5 | `python_basico` | `etl_clean` | `notebook` | ⬜ |  |
| C6 | `foundry_basico` | `etl_clean` | `pipeline` | ⬜ |  |
| C7 | `airflow_basico` | `basic_read` | `airflow` | ⬜ |  |
| C8 | `git_basico` | `review` | `git` | ⬜ |  |
| C9 | `monitor_basico` | `basic_read` | `monitor` | ⬜ |  |
| C10 | `stats_basico` | `eda` | `stats` | ⬜ |  |
| C11 | `ml_basico` | `model` | `ml` | ⬜ |  |
| C12 | `metricas_basico` | `metrics` | `bi` | ⬜ |  |

Cada fila: `GET /workflow/<tipo>` 200 (email→tool→form→result) + `POST /validate` correcto 10/10 vs incorrecto fail + `renderTool` no dice "Herramienta no disponible".

**Conclusión Bloque C:** ⬜

---

## Bloque D — Ecosistema avanzado (3+7)

| # | Tipo | Validator | Tool | Resultado |
|---|------|-----------|------|-----------|
| D1 | `ecosistema_da` | `dax` | `powerbi` | ⬜ |
| D2 | `ecosistema_de` | `automation` | `automation` | ⬜ |
| D3 | `ecosistema_ds` | `forecast` | `forecast` | ⬜ |
| D4 | `excel_advanced` | `excel` (XLOOKUP/UNIQUE/FILTER/pivot) | `excel` | ⬜ |
| D5 | `powerbi_dax` | `dax` (CALCULATE+SUMX → 128350) | `powerbi` | ⬜ |
| D6 | `forecast_sales` | `forecast` (media móvil, MAPE<10) | `forecast` | ⬜ |
| D7 | `automation_etl` | `automation` (trigger+nodos) | `automation` | ⬜ |
| D8 | `llm_integration` | `llm_api` (system prompt+params) | `api` | ⬜ |
| D9 | `agent_task` | `agent` (tools+loop+memoria) | `agent` | ⬜ |
| D10 | `prompt_engineering` | `prompt` (few-shot+formato) | `prompt` | ⬜ |

**Conclusión Bloque D:** ⬜

---

## Bloque E — Motores reales (golden)

| # | Motor | Valor esperado | Resultado |
|---|-------|----------------|-----------|
| E1 | DAX total ventas | `128350` | ⬜ |
| E2 | Forecast serie MAPE | `[112400,118900,124150,128350]`; MAPE<10 | ⬜ |
| E3 | `sims.total` derivado | no 8 fijo; `getSpecialty(...).workflowTypes.length` | ⬜ |
| E4 | `countsAsCase` | ecosistemas `true`, fundamentos `undefined` | ⬜ |

**Conclusión Bloque E:** ⬜

---

## Bloque F — Progreso y desbloqueo

| # | Paso | Esperado | Resultado |
|---|------|----------|-----------|
| F1 | `POST /validate` 4 fundamentos DA → `sims.validated` +4 | `practicePct` sube (no satura) | ⬜ |
| F2 | `GET /api/sim/career-path` | `unlocked.data_engineering=true` al cruzar 40% | ⬜ |
| F3 | `demoOverride` true → `unlocked` true pero `practicePct` inmóvil | `practicePct` inmutable | ⬜ |
| F4 | `GET /api/sim/story/state?route=analyst` | `arcId` válido, sin fugas contables | ⬜ |

**Conclusión Bloque F:** ⬜

---

## Bloque G — Frontend / UI (Chrome DevTools)

| # | Paso (DevTools) | Esperado | Resultado | Evidencia |
|---|-----------------|----------|-----------|-----------|
| G1 | Console al cargar escritorio + abrir cada app | 0 errores JS |  | screenshot |
| G2 | Network: `/api/workflows/*` y `/api/sim/progress/record` | 200 sin 4xx/5xx |  | HAR |
| G3 | Elements: `data-guide` en portal + `data-guide="ticket"` en documento | sin "Herramienta no disponible" |  | DOM |
| G4 | Application/LocalStorage: `sim_specialty` coherente | practicas/data según perfil |  | Storage |
| G5 | Agenda Capa 0 / Ecosistema | bloques según `ECOSYSTEM_SLOTS` / `ANALYST_SLOTS` |  | screenshot |
| G6 | Lighthouse (accesibilidad) | sin errores críticos |  | report |

**Conclusión Bloque G:** ⬜

---

## Bloque H — Anti-regresión

| # | Check | Resultado |
|---|-------|-----------|
| H1 | Ningún `*_basico`/`ecosistema_*` con `maxPossible=0` | ⬜ |
| H2 | `GET /api/automator/capabilities` → 7 avanzados `exists`; `pending-engines` vacío | ⬜ |
| H3 | `audit:story` (106) + suite (301) verdes | ⬜ |
| H4 | Mojibake: sin `â/ð/Ã` en UI nueva | ⬜ |

**Conclusión Bloque H:** ⬜

---

## Resumen final

| Bloque | Veredicto | Defectos | Severidad |
|--------|-----------|----------|-----------|
| A | ⬜ | — | — |
| B | ⬜ | — | — |
| C | ⬜ | — | — |
| D | ⬜ | — | — |
| E | ⬜ | — | — |
| F | ⬜ | — | — |
| G | ⬜ | — | — |
| H | ⬜ | — | — |

**Go-live Capa 0:** ⬜ NO (pendiente)

> Evidencias (screenshots / HAR / Console logs) se adjuntan en `docs/qa-evidencias/` por bloque.
