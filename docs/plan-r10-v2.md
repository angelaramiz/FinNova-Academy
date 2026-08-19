# R-10 v2 — Sistema de 3 Etapas: Diagnóstico → Seguimiento de Vacante con Simulador → Experiencia Comprobable

> Estado: **PLAN (19-ago-2026)** — documentado, no implementado.
> Fuente de trazabilidad: `agents.md` (sección R-10 v2). Regla de oro R-09 se mantiene:
> números/match/densidad salen de motores o reglas; solo el texto de la vacante usa IA con fallback determinístico.

## Arquitectura (3 Etapas)

```
                      ┌─ requires_experience && density < umbral ──→ ETAPA_3 (densidad)
pegue vacante → IA ──┤
  → skills/años      ├─ match_pct >= 75 ───────────────────────────→ ETAPA_2 MODO A (postulación asistida)
                      └─ else ──────────────────────────────────────→ ETAPA_2 MODO B (simulador intensivo)
```

## Etapa 1 — Diagnóstico puro
- Login rápido (Google Auth, ya existe) → pegar vacante (texto/URL) → extracción IA de skills → prueba + retos prácticos → `match_pct` + desglose + routing.
- Endpoints: `POST /api/stage1/analyze`, `POST /api/stage1/submit`, `POST /api/stage1/reevaluate`.
- Piezas: `vacancyAnalyzer.ts`, `matchScorer.ts`, `stageRouter.ts`.

## Etapa 2 — Seguimiento de vacante + primer punto del simulador
- Tabla `vacancy_tracking(user_id, vacancy_id, stage1_result_id, modo, status, created_at)`.
- Límite plan free: 2 vacantes simultáneas (`status != cerrada`) → 402/409 + upgrade. Columna `plan` en `profiles`.
- **Modo A (≥75%)**: kit de postulación (CV a la medida, entrevista STAR, checklist) — `CareerCenter.tsx`.
- **Modo B (<75%)**: `intensivePlanner.ts` — por skill < umbral → herramienta real (vía `simBlocks.ts`) + casos aplicados.
  - **5 reglas obligatorias de caso aplicado**: (a) contexto de negocio realista, (b) decisión multi-camino, (c) trampa/restricción oculta, (d) resultado validable por motor (`workflowEngine`/`runDEValidator`), (e) reflexión. **Prohibido** "ejecuta la función básica".
  - Agenda intensiva con casos encadenados. Reevaluación → ≥75 migra a Modo A automáticamente.

## Etapa 3 — Experiencia comprobable
- `experienceDensity.ts`: `density = f(casos, complejidad, variedad, incidentes, resultados)` — independiente de años calendario.
- Arcos mediano plazo (reusa R-09) con responsabilidad creciente. Expediente público R-08 presenta densidad como evidencia.
- Narrativa UI: "La experiencia no se mide solo en años: un año resolviendo casos variados puede superar a tres haciendo lo básico".

## Hallazgos de auditoría previa (19-ago-2026)
| Pieza asumida | Realidad |
|---|---|
| `aiProvider.ts` | Existe `backend/src/providers/ai.ts` (Gemini + mock) |
| `simBlocks.ts` | No existe → crear registry (skill → app real: SQLSim/SpreadsheetSim/DBTSim/…) |
| `CareerCenter.tsx` | No existe → crear sobre CvBuilderSim + InterviewSim + expediente |
| `portfolio` | Existe `expediente.ts` + `verification_links` |
| Google Auth | Ya existe en `Login.tsx` (`signInWithOAuth google`) |

## Plan de trabajo
| # | Tarea | Archivos | Reutiliza |
|---|-------|----------|-----------|
| T1 | Auth + plans + RLS | `supabase/migrations/*_auth_plans.sql` | Login.tsx, profiles |
| T2 | Etapa 1 + routing | `vacancyAnalyzer.ts`, `matchScorer.ts`, `stageRouter.ts` | providers/ai.ts, dataExercises |
| T3 | Tracking + límite free | `vacancyTracker.ts`, `VacancyTracker.tsx` | profiles.plan |
| T4 | Modo A kit | `CareerCenter.tsx` | cvProfile, interview, expediente |
| T5 | Modo B intensivo | `intensivePlanner.ts`, `simBlocks.ts`, DesktopShell | taskPlanner, workflowEngine, simWorld |
| T6 | Etapa 3 densidad | `experienceDensity.ts` | arcos R-09, expediente |
| T7 | Tests + gates | `stage-routing`, `free-limit`, `intensive-cases`, `reevaluation`, `density` | vitest, audit:story |

## Tests planeados
- `stage-routing.test.ts`: 74/75/76 → B/A; vacante "3+ años" → Etapa 3.
- `free-limit.test.ts`: 3ª vacante free → rechazo; cerrar una → permite.
- `intensive-cases.test.ts`: todo caso cumple las 5 reglas (sin ejecución básica).
- `reevaluation.test.ts`: completar plan habilita reevaluación; ≥75 migra a Modo A.
- `density.test.ts`: densidad crece con casos/incidentes, no con tiempo ocioso.
