# R-11 — Flywheel de datos reales (calidad transversal)

> Estado: **COMPLETO (19-ago-2026)** — T1-T7 implementados, gates en verde.
> Anexo obligatorio a R-09/R-10. Aplica a todas las capas (mercado, diagnóstico,
> simulador, experiencia, resultados reales).
> Diferenciador central: *un curso es contenido estático; este simulador aprende de
> cada interacción real y convierte errores reales en mejor contenido.*

## 0. Principio

Cada etapa **extrae** datos útiles y cada dato **regresa** como mejora concreta.
Ciclo cerrado:

```
uso real → telemetría → agregación → insight → ticket → aprobación staff/agent → contenido mejorado → mejor aprendizaje
```

Nada se despliega automático sin gate (auditorías R-09 + aprobación staff).

## 1. Hallazgos de auditoría (19-ago-2026) — piezas asumidas vs reales

| Pieza asumida por R-11 | Realidad |
|---|---|
| `learningAnalytics.ts` | No existe → crear (núcleo del servicio) |
| `assessmentGenerator.ts` | **No existe**. La Etapa 1 de R-10 usa `matchScorer.ts` + `stage1Service.ts` (prueba rápida de gaps). El consumo T5 debe apuntar a estos. |
| `interviewEngine.ts` | **No existe**. R-08 usa `interview.ts` (`startInterview`, `evaluarRespuesta`, `completarEntrevista`). El consumo T5 debe apuntar a `interview.ts`. |
| `deValidation.ts` / `workflowEngine.ts` / `caseGenerator.ts` / `taskPlanner.ts` | ✅ Existen (OK) |
| Staff panel | `staff/src/App.tsx` → `StaffControlCenter` con sidebar de 3 secciones (ControlPanel, StudentsManager, AdminSection). QualityPanel sería una 4ª sección. |
| Auth staff | `staff.ts` usa service role en producción; `requireSupabaseAuth` en `/api/sim/*`. |

## 2. Modelo de datos — migración `20260819020000_quality_flywheel.sql`

Tablas (tal como en el reporte):
- `sim_events` — telemetría cruda sin PII (`user_hash`, `stage` 0-4, `type`, `ref jsonb`, `data jsonb`, `ts`).
- `item_stats` — agregados por tarea/pregunta (`ref_id`, attempts, fail_rate, avg_time_s, learning_gain, discrimination).
- `misconceptions` — patrones de error reales (skill_id, pattern, example_anon, frequency, feedback_propuesto, status pendiente).
- `improvement_tickets` — cola de mejora (origen, severidad, descripcion, ref, status abierto→aprobado→desplegado, resuelto_por).
- `outcome_tracking` — resultados reales con consentimiento explícito (applied, interviews, hired, skills_entrevista).

Todas con RLS (salvo las que solo toca staff vía service role) y `user_hash` irreversible.

## 3. Servicios y endpoints

- `backend/src/services/learningAnalytics.ts` (nuevo): ingesta batch, agregación, detección de misconceptions (clustering simple por skill+patrón), creación de tickets por umbrales.
- `backend/src/services/piiScrubber.ts` (nuevo, o función dentro de learningAnalytics): remueve emails/teléfonos/RFC/CP/tarjetas antes de persistir; test obligatorio de "cero PII".
- `POST /api/sim/telemetry` (batch, `user_hash` en backend, nunca PII).
- `GET /api/staff/quality` (tablero: top fallos, ganancias, demanda vs cobertura, salud del generador).
- `GET /api/staff/tickets`, `POST /api/staff/tickets/:id/approve|reject` (gate humano).
- `DELETE /api/staff/users/:hash/data` (derecho a supresión).
- Routers: `simEngine.ts` (telemetry) + `staff.ts` (quality/tickets/supresión).

## 4. Puntos de consumo (T5) — mapeo real

| Consumo R-11 | Archivo real |
|---|---|
| dificultad calibrada + drills prioritarios | `taskPlanner.ts` |
| plantillas de trampa desde misconceptions aprobadas | `caseGenerator.ts` (debe pasar auditoría `story-coherence`) |
| filtrar preguntas con mala discriminación | `stage1Service.ts` + `matchScorer.ts` (prueba de gaps) |
| mensajes de feedback por misconception aprobada | `deValidation.ts` / `workflowEngine.ts` |
| pregunta por errores reales frecuentes del rol | `interview.ts` |
| `coverage_gap` (demanda vs cobertura) → nuevas rutas | `careerPath.ts` + `vacancyAnalyzer.ts` |

## 5. Emisión de eventos (T2) por capa

- **L0** `vacancyAnalyzer.ts` → evento `vacancy_analyzed` (skills/senioridad/tools; PII removida).
- **L1** `stage1Service.ts` → `question_answered` (score, tiempo, discriminación), `assessment_submitted`.
- **L2** `workflowEngine.ts` / `deValidation.ts` → `task_fail`, `trap_missed`, `hint_used`, `response_incorrect` (con la respuesta exacta anonimizada).
- **L3** `caseGenerator.ts` / `storyState.ts` → `case_regen`, `incident_resolved`, `arc_decision`, `coherence_fail`.
- **L4** `outcome_tracking` + UI (R-08 Carrera) → `outcome` (aplicado/entrevistado/contratado, consentido).

## 6. Staff — QualityPanel

4ª sección en `StaffControlCenter` (`staff/src/components/QualityPanel.tsx`):
- KPIs: fail_rate por tarea, ganancia de aprendizaje, trampas falladas, regeneraciones, demanda vs cobertura.
- Cola de tickets con flujo abierto → aprobado → desplegado.
- Vista de misconceptions con ejemplo anon y feedback propuesto.
- Sidebar: añadir tab `'quality'` en `App.tsx`.

## 7. Tests (T7) — `tests/analytics.test.ts`

- Agregaciones correctas (fail_rate, gain, discrimination).
- Ticket se crea con `fail_rate > 0.7` y `gain < 0.2`.
- **Cero PII** en eventos (test del scrubber).
- Nada se despliega sin aprobación staff (gate).
- Trampa derivada de error real pasa `story-coherence`.
- Anti-mojibake y suite root/backend en verde.

## 8. Criterios de aceptación

1. Panel de Calidad muestra top-5 tareas con peor fail_rate y ganancia tras N sesiones.
2. Misconception frecuente → ticket → aprobado → feedback nuevo aparece en el simulador.
3. Trampa nueva derivada de error real pasa auditoría y entra al rotador de `taskPlanner`.
4. Vacantes nuevas actualizan taxonomía y proponen `coverage_gap` en staff.
5. Alumno contratado (consentido) cierra el ciclo: su ruta pesa más.

## 9. Privacidad (no negociable)

- Consentimiento explícito en onboarding, revocable.
- `user_hash` irreversible; PII nunca en `data`; scrubber en ingesta; vacantes pasan por removedor de PII en L0.
- Staff solo ve agregados; ejemplos anonimizados; derecho a supresión.

## 10. Plan de trabajo

| # | Tarea | Archivos |
|---|-------|----------|
| T1 | Migración + scrubber + ingesta telemetry | `20260819020000_quality_flywheel.sql`, `learningAnalytics.ts`, `piiScrubber.ts`, `server.ts` |
| T2 | Emisión de eventos en todas las capas | `vacancyAnalyzer`, `stage1Service`, `workflowEngine`, `deValidation`, `caseGenerator`/`storyState`, `Onboarding` |
| T3 | Agregaciones + misconceptions + tickets | `learningAnalytics.ts` |
| T4 | Panel de Calidad staff | `QualityPanel.tsx`, `staff.ts`, `App.tsx` |
| T5 | Consumo: feedback, trampas, drills, preguntas, specs | `deValidation`, `caseGenerator`, `taskPlanner`, `stage1Service`/`matchScorer`, `interview.ts`, `careerPath` |
| T6 | Outcome tracking (consentido) | `outcome_tracking`, UI R-08 Carrera |
| T7 | Tests + gates + `agents.md` | `tests/analytics.test.ts`, suite completa |

**Regla de oro (R-09/R-10/R-11)**: el lore/texto puede variar; números, umbrales (fail_rate>0.7, gain<0.2), taxonomía y coverage_gap salen de motores/reglas o agregación de datos reales. Ninguna trampa/feedback se despliega sin aprobación staff + auditoría `story-coherence`.