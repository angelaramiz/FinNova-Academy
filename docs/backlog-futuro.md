# Backlog futuro — R-10 / R-11 / R-12 en pausa autorizada

> **Estado:** PAUSA AUTORIZADA (TPM + Angel, 2026-09-05, TASK-2-2).
> Estos módulos están **implementados, testeados y conservados intactos en el código**; lo que se pausa es su lugar en el roadmap activo (dejan de contaminarlo). Reactivar cualquiera = nuevo ciclo Gate con `input.md` del TPM. Nada se borra.

## R-10 v2 — Vacantes en 3 Etapas (pausado)

Diagnóstico de vacante → seguimiento (Modo A/B) → densidad de experiencia.

| Capa | Archivos (intactos, sin cambios) |
|------|----------------------------------|
| Backend | `services/vacancyAnalyzer.ts`, `matchScorer.ts`, `stageRouter.ts`, `stage1Service.ts`, `vacancyTracker.ts`, `experienceDensity.ts`, `careerCenter.ts`, `intensivePlanner.ts`, `simBlocks.ts`; `routes/stage1.ts`, `routes/vacancies.ts` |
| Frontend | `alumnos/.../VacancyTracker.tsx`, `CareerCenter.tsx` (tabs Diagnóstico/Kit/Intensivo/Resultado), `InterviewSim.tsx` |
| Tests | `stage-routing`, `free-limit`, `intensive-cases`, `density`, `reevaluation` (verdes) |
| Tablas | `vacancy_tracking`, `stage1_assessments`, `profiles.plan`, `profiles.experience_density` |

## R-11 — Flywheel de calidad (pausado, salvo lo conservado)

Telemetría → agregación → misconceptions → tickets → gate staff.

| Capa | Archivos |
|------|----------|
| Pausado | `services/learningAnalytics.ts` (agregación), `services/qualityConsumption.ts` (consumo), `staff/.../QualityPanel.tsx`, endpoints staff quality/tickets, `interview.ts` (pregunta por error frecuente), `reforzamiento.ts` (drills ajustados) |
| **CONSERVADO** | `services/piiScrubber.ts` (`scrubText/scrubData`, cero PII) + `POST /api/sim/telemetry` (`simEngine.ts`, ingesta batch anonimizada a `quality_events`) |
| Tests | `analytics`, `consumption` (verdes) |
| Tablas | `quality_events`, `item_stats`, `misconceptions`, `improvement_tickets`, `outcome_tracking` |

Regla vigente aunque el flywheel esté en pausa: **nada se consume sin gate staff + story-coherence**.

## R-12 — Automatizador de rutas (pausado, salvo registro)

Vacante real → ruta SIMULAB v2 + auto-extensión de motores.

| Capa | Archivos |
|------|----------|
| Pausado | `services/roadmapCompiler.ts` (agente), `services/simulabFormat.ts` (formato v2), `routes/automator.ts` (`/compile`, `/validate`, backlog admin) |
| **VIGENTE** | `services/engineCapabilities.ts` (registro `exists`/`extends`/`missing`, usado por R-15; hoy 19 `exists`, solo `erp` missing) |
| Tests | `automator-routes` (verde) |

## Criterio de reactivación

1. TPM abre ciclo Gate con objetivo y criterios medibles.
2. Se ejecuta por fases con gates verdes.
3. Al cerrar, este archivo se actualiza (qué volvió al roadmap y qué sigue en pausa).
