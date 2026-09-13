# Plan de Ejecucion — Simulador Laboral 3D (FinNova Academy)

> **Fecha del diagnostico**: 12-ago-2026 (hora real) | **Simulacion**: 08-jul-2026 (semana 2, dia 3)  
> **Metodo**: Analisis codigo-real full-stack (codegraph + grep + tsc + vitest + inspeccion navegador)  
> **Alcance**: 27 componentes frontend, 13 servicios backend, 5 rutas, 38 endpoints  
> **Ultima actualizacion**: 12-ago-2026 — P0.1 COMPLETADO (trampas contables funcionales)

---

## 0. PROGRESO DE EJECUCION

| Item | Estado | Nota |
|------|:------:|------|
| P0.1 — Trampas contables | ✅ **COMPLETADO** | 4 generadores con trampa + store determinista + endpoint trap-scenarios + tests (23) |
| Bug critico G8 (nuevo) | ✅ **CORREGIDO** | GET y POST /validate generaban workflows aleatorios distintos → el estudiante que llenaba las pistas del form obtenía 0%. Solución: `workflowStore` en memoria (30 min TTL) + `workflowId` en el validate |
| P0.2 — Workflows DE code_review + soporte_datos | ✅ **COMPLETADO** | Generadores propios en dataEngineeringWorkflows.ts + registro en DE_WORKFLOWS (7/7) |
| P0.3 — Validacion workflows DE | ✅ **COMPLETADO** | POST /validate usa `getDEWorkflow` para tipos DE (antes generaba contable genérico) |
| P1.1 — Workflows depreciation + financial_statements | ✅ **COMPLETADO** | Generadores + agregados a `accountingTypes` (antes devolvían 400) |
| P1.2 — Fix IMSS → PTU | ✅ **COMPLETADO** | Cuenta nueva `2-08 IMSS por pagar` en catálogo + autoEntries usa la cuenta correcta |
| P0-1 — Trampas DE (3) | ✅ **COMPLETADO** | `applyDETrap` + email con el error + regla `de` marcada: `sql_sin_group_by`, `pipeline_datos_perdidos`, `alerta_calidad_ignorada` |
| P0-2 — Validación DE por resultado real | ✅ **COMPLETADO** | `deValidation.ts`: validadores `sql`/`etl_clean`/`quality_decision`/`review`/`incident` analizan el código del estudiante y dan feedback de lead (sustituyen reglas `exact` de strings) |
| P0-4 (mínimo) — Mundo vivo (simWorld) | ✅ **COMPLETADO** | `simWorld.ts` (estado por usuario: pipeline 05-jul, SLAs, acciones) + endpoints `GET /api/sim/world`, `POST /world/action`, `POST /world/reset` + workflow DE `incident_recovery` (diagnóstico con validador `incident`) + side effect en `/validate` (aprobar recupera el mundo) + banner de estado del pipeline en DesktopShell DE |
| P0-3 — Tarea ↔ herramienta real (paso `tool`) | ✅ **COMPLETADO** | Cada workflow DE incluye un paso `tool` entre email y spreadsheet que embebe la app real (SQL→SQLSim, ETL→Notebook, calidad/ontología→Catalog, review→Git, airflow/incidente→Airflow, soporte→Warehouse). DesktopShell renderiza la herramienta con botón "He terminado → ir a la respuesta". Las trampas y la validación `de` se conservan. |
| P1-5 — Jornada guiada DE | ✅ **COMPLETADO** | Agenda del día en DesktopShell (solo DE): bloques fijos (09:00 Standup, 09:30 Monitoreo, 12:00 Almuerzo, 16:00 Aprendizaje, 17:30 Cierre) + tareas intercaladas en franjas según su tipo (10:00-11:30 desarrollo, 13:00 modelado/review, 14:00 orquestación/soporte). Hora actual marcada. |
| P1-6 — Progresión DE (12 semanas) | ✅ Parcial | Semanas 1-4 del taskPlanner DE ya respetan la progresión (sem 1 fundamentos SQL/ETL/calidad → sem 4 orquestación/incidente). Falta extender a meses 2-3 (Foundry/cloud/integrador). |
| P1-8 — Módulo de aprendizaje | ✅ **COMPLETADO** | `LearningSim.tsx` (app nueva): 6 lecciones (SQL, pandas, dbt, Airflow, AWS, Foundry) con intro, puntos clave y mini-quiz de 2 preguntas con explicación. Progreso persistido en localStorage (0-6). Integrado en DesktopShell (icono "📚 Aprendizaje") y el bloque 16:00 de la agenda abre el módulo. |
| P2-9 — Persistencia Supabase (sim_world) | ✅ **COMPLETADO** | Migración `20260812083736_persist_sim_world.sql` (tabla `sim_world`: user_id PK, state jsonb, updated_at, RLS por usuario) **APLICADA al proyecto activo** `nhcgclqiihvioyqwqjlf` (finnova, ACTIVE_HEALTHY). `simWorld.ts` persiste en Supabase (`upsert onConflict user_id`) con fallback a memoria. Verificado end-to-end con el service key real (upsert 201, select 200). Conexión de aplicación vía pooler `aws-1-us-east-1` (session 5432 para DDL; transaccional 6543 para runtime). |
| P2-10 — Staff panel | ✅ **COMPLETADO** | `backend/src/routes/staff.ts` + `GET /api/staff/students` (alumnos con progreso agregado + mundo simulado; fuente Supabase en producción, demo en local). `StaffDashboard` (staff) muestra la tabla "Simulador — Progreso de alumnos" con score, trampas y estado del pipeline. Test unitario de `buildDemoStudents`. |
| P2-11 — Tests motores DE | ✅ **COMPLETADO** | `tests/de-motors.test.ts` importa el motor real dbt del frontend (`compileModelSql`/`SOURCES`/`MODELS`/`topoOrder`): compila staging/intermediate/marts, verifica el total del mart = suma de stg (128350) y el orden topológico. Sumado a `deValidation.test.ts` (validadores) y `workflowEngine.test.ts`. |
| P2-12 — Deploy readiness | ✅ **COMPLETADO** | `npm run build` pasa en los 3 servicios (backend tsc, alumnos vite+PWA, staff vite). `render.yaml` ya define los 3 servicios. Deploy real en Render pendiente de credenciales. |
| P2-13 — Persistencia del progreso (sim_progress) | ✅ **COMPLETADO** | Migración `20260812092933_persist_sim_progress.sql` (tabla `sim_progress`: user_id+specialty PK, data jsonb, RLS) **APLICADA al proyecto activo** (SQL Editor). `progressTracker.ts` ahora es async y persiste las completaciones con fallback a memoria; endpoints `/progress/*` con `await`; `staff.ts` lee `sim_progress`. Verificado con el service key real (upsert 201 / select 200) y en local (record → month/quick/all). |
| P2.x — Tests, staff, cobertura | ✅ **P2 completo** | Suite root: **79 tests** (8 archivos); backend **70 tests**; tsc y builds de los 3 servicios limpios. Queda fuera de alcance: cobertura testsprite 80% (requiere configurar vitest de alumnos) y deploy real en Render (requiere credenciales). |

**Verificado en navegador (12-ago-2026):**
- Trampa SQL: query sin GROUP BY → "SUM() sin GROUP BY agrega TODAS las filas..."; corregida → +15
- Trampa ETL: `dropna()` → "pierdes registros"; `fillna` → +8
- Trampa Calidad: "ignorar" → fail; "corregir/escalar" → +10
- Flujo normal SQL/ETL sin trampa → 100%
- **Mundo vivo**: incident_recovery aprobado → pipeline 05-jul `failed→recovered`, SLA `breached→met`, acción registrada; validación incorrecta → sigue `failed`

**Verificado en navegador (12-ago-2026):**
- Banner de trampa + campo de detección visible en tarea "Pago mal aplicado"
- Detección correcta = +5 pts / 75-100%; sin detección = 50%
- Trampa IVA: `?trap=iva_incorrecto` → email "IVA al 10%", campo ivaRate, validate 100% con respuestas correctas
- Trampa conciliación: reglas recalculadas con cheque de $3,500
- Trampa nómina: fila 'Método ISR aplicado' = '15% fijo'
- `GET /api/workflows/depreciation|financial_statements|code_review|soporte_datos` → 200 (antes 400/SQL default)
- `POST /validate` con DE workflow → 100% (antes generaba workflow contable)

### Detalle de lo implementado en P0.1

**Archivos modificados:**
- `backend/src/services/workflowEngine.ts` — `Workflow.isTrap/trapId/trapDescription`, `TRAP_SCENARIOS`, `applyTrap()` (4 mutadores), `registerWorkflow()/getStoredWorkflow()/workflowIdOf()` (store determinista), `generateWorkflow(taskType, userId, trap?)`
- `backend/src/routes/workflows.ts` — GET propaga `?trap=`, POST `/validate` acepta `trap` + `workflowId`
- `backend/src/routes/simEngine.ts` — `/trap-scenarios` devuelve los 4 escenarios (antes `[]`)
- `backend/src/services/taskPlanner.ts` — `trapId` en las 7 plantillas de trampa (4 contables + 3 DE)
- `alumnos/src/components/DesktopShell.tsx` — `TaskInfo.isTrap/trapId`, URL con `?trap=`, banner "⚠ Tarea con posible error", envía `trap`+`workflowId` al validate
- `alumnos/src/components/SimuladorLaboral.tsx` — `SimTask.isTrap/trapId`, propagación al DesktopShell
- `backend/src/services/workflowEngine.test.ts` — 23 tests nuevos (4 trampas + escenarios + store)

**Mecanismo de las trampas:** el email muestra el documento con el error visible (IVA 10%, comprobante de otro cliente, cheque de $3,500 faltante, ISR fijo 15%); el form/spreadsheet agrega un campo de detección (choice/exact); la validación premia la detección (+5 pts) con feedback explicativo.

**Verificado en navegador:** banner de trampa, campo de detección, detección correcta = 75-100%, sin detección = 50%.

---

## 1. Diagnostico Actual

### 1.1 Lo que SI funciona (verificado)

| Capa | Componente | Estado | Evidencia |
|------|-----------|:------:|-----------|
| **Frontend** | 27 componentes alumnos | **100% implementado** | 11,869 LOC, 55 hooks, 0 stubs |
| **Frontend** | TSC compila limpio | `npx tsc --noEmit` sin errores |
| **Backend** | 12 workflows contables | **100% implementado** | workflowEngine.ts genera email+form+validacion por cada tipo |
| **Backend** | Catálogo de cuentas (38) | Completo | Reportes BG/ER/BC funcionales |
| **Backend** | Auto-asientos contables | Completo | 5 generadores (factura/pago/proveedor/nomina/diario) |
| **Backend** | TaskPlanner (33 tareas/mes) | Completo | Plan semanal 1-4 contable + 5-8 DE |
| **Backend** | ProgressTracker | Completo | Rachas, categorias, dificultades por usuario |
| **Backend** | Datos persistentes | Completo | 5 clientes, 4 proveedores, 8 productos |
| **DB** | Supabase schema/seed | Completo | schema.sql + 5 migraciones |
| **Infra** | Render deploy (3 servicios) | Configurado | render.yaml |
| **Tests** | 5 tests API | Todos pasan | vitest 5/5 en 3.4s |
| **Coherencia** | Reloj unico `simTime.ts` | Todas las apps DE usan `simSlash()` | HOY = 08-jul-2026 |
| **Coherencia** | Incidente 05-jul | Consistente en Airflow/DataOps/Monitor/Cloud | Fix reciente en plan y DataOpsSim |

### 1.2 Lo que NO funciona (gaps criticos)

| # | Gap | Impacto | Ubicacion |
|---|-----|---------|-----------|
| **G1** | **4 trampas contables no se renderizan** | Un estudiante que recibe una trampa ve un formulario **correcto** (sin error visible). La deteccion de trampas es imposible. | `workflowEngine.ts` — no existen `generateInvoiceWorkflowWithTrap()` ni variantes; `GET /api/sim/trap-scenarios` devuelve `[]` |
| **G2** | **2 workflows DE sin generador** | `code_review` y `soporte_datos` caen al default SQL (generan un formulario irrelevante) | `dataEngineeringWorkflows.ts:284` — el `default` del switch va a `generateSQLQueryWorkflow()` |
| **G3** | **2 tipos de tarea contable sin workflow** | `depreciation` y `financial_statements` estan en taskPlanner pero **no estan en `accountingTypes` de workflows.ts:14** → el GET devuelve **HTTP 400 "Tipo no valido"**. La tarea de semana 4 es **irresoluble** para el estudiante. | `workflows.ts:14` (lista fija) + `workflowEngine.ts:862` (default genérico nunca alcanzado) |
| **G4** | **Validacion DE ausente** | `POST /api/workflows/validate` solo valida workflows contables. Si un alumno DE completa una tarea, no recibe puntaje. | `workflows.ts:60-92` — el switch de `taskType` solo tiene casos contables |
| **G5** | **Bug: IMSS mapeado a PTU** | La cuenta `2-05 PTU por pagar` recibe aportaciones IMSS en vez de una cuenta especifica | `autoEntries.ts:79` — `generatePayrollEntries()` |
| **G6** | **Cobertura de tests casi nula** | Solo 5 tests de health-check. 0 tests de workflow, formularios, trampas, o simuladores DE. testsprite.config pide 80% — estamos en <5%. | Solo `server.test.ts` y `tests/health.test.ts` |
| **G7** | **Staff panel minimo** | Solo 4 componentes (AdminPanel, InstructorPanel, Login, RegisterRequest). No hay dashboard de seguimiento de alumnos, ni reportes de progreso, ni gestion de tareas. | `staff/src/components/` |
| **G8** | **GET y POST /validate generan workflows aleatorios distintos** (bug preexistente corregido en P0.1) | Las pistas del formulario (`correct`) no coincidian con las reglas del validate → 0% aunque el estudiante acertara todo. **CORREGIDO** con `workflowStore` (TTL 30 min) + `workflowId`. | `workflowEngine.ts` + `workflows.ts` |

---

## 2. Plan de Ejecucion por Prioridad

### PRIORIDAD 0 — CRITICO (impide funcionamiento educativo)

#### P0.1 — Implementar trampas contables en workflowEngine.ts (~16h)

**Problema**: Las 4 trampas existen como metadata en `taskPlanner.ts` pero el motor de workflows no genera formularios "equivocados". El estudiante jamas ve el error.

**Solucion**: Crear variantes de generadores en `workflowEngine.ts` + mecanismo de activacion:

| Trap | Funcion nueva | Que cambia vs la version correcta |
|------|---------------|-------------------------------------|
| #1: IVA 10% | `generateInvoiceWorkflowWithTrap()` | El form pre-llena IVA=10% en vez de 16%. La validacion debe aceptar la trampa como "incorrecta" y explicar por que. |
| #2: Pago mal aplicado | `generatePaymentWorkflowWithTrap()` | El selector de factura muestra la factura del cliente B aunque el pago es de A. |
| #3: Cheque sin cobrar | `generateBankReconciliationWorkflowWithTrap()` | El extracto bancario omite un cheque emitido hace 45 dias. |
| #4: ISR fijo 15% | `generatePayrollWorkflowWithTrap()` | La tabla de ISR se sustituye por flat 15%. |

**Mecanismo de activacion**: el taskPlanner ya marca `isTrap: true` en la tarea; el frontend pide `GET /api/workflows/:taskType?trap=<id>` y la ruta debe pasar el parametro a `generateWorkflow(taskType, userId, trapId)`.

**Ubicacion**: `backend/src/services/workflowEngine.ts` — agregar 4 funciones + actualizar switch `generateWorkflow()` con parametro `trap?: string`. Actualizar `workflows.ts:20` para propagar el query param.

**Endpoint**: `GET /api/sim/trap-scenarios` debe devolver los 4 escenarios con descripciones (actualmente `[]`).

**Verificacion**: 
- Crear test: `workflows.trap.test.ts` con 4 casos (uno por trampa)
- Navegar semana 1 dia 3 → tarea `invoice_emission` debe mostrar IVA=10%
- Validar que el estudiante pueda detectar la trampa y recibir feedback

---

#### P0.2 — Implementar workflows DE faltantes (~10h)

**Problema**: `code_review` y `soporte_datos` no tienen generadores. El estudiante DE recibe un formulario SQL irrelevante.

**Solucion** — Agregar a `dataEngineeringWorkflows.ts`:

```
generateCodeReviewWorkflow():
  email de Sandra Mora con link a PR en GitSim
  form: checklist de revision (nombres de columna, refs rotos, SELECT *)
  result: feedback del motor de reglas de GitSim (analyzeDiff)

generateSoporteDatosWorkflow():
  email de un analista pidiendo datos especificos
  form: escribir query SQL o usar CatalogSim para encontrar el dataset
  result: datos correctos + feedback
```

**Verificacion**: `GET /api/workflows/code_review` y `/api/workflows/soporte_datos` deben devolver workflows completos.

> **Nota (verificado)**: Ademas de las 4 trampas contables, existen **3 trampas DE** (metadata en `taskPlanner.ts:202-204` + `specialties.ts:94`): `pipeline_datos_perdidos` (etl_pipeline), `sql_sin_group_by` (sql_query), `alerta_calidad_ignorada` (data_quality). Mismo problema: el generador no produce el error. Se resuelven con variantes trap de los generadores DE en el mismo P0.

---

#### P0.3 — Implementar validacion de workflows DE (~6h)

**Problema**: `POST /api/workflows/validate` solo tiene casos para `invoice_emission`, `tax_calculation`, etc. Si el `taskType` es `sql_query` o cualquier DE, la validacion falla silenciosamente.

**Solucion**: Agregar rama `data_engineering` en el switch de `validateWorkflow()` en `workflows.ts` que evalua respuestas DE:

| taskType DE | Que valida |
|-------------|-----------|
| `sql_query` | La query SQL es sintacticamente correcta y devuelve las columnas esperadas |
| `etl_pipeline` | Los pasos del pipeline estan en orden correcto |
| `data_quality` | El checklist de calidad esta completo |
| `ontology_modeling` | Las entidades y relaciones son validas |
| `airflow_dag` | Las dependencias del DAG son correctas |
| `code_review` | Se detectaron los issues del PR |
| `soporte_datos` | La query o dataset seleccionado es correcto |

---

### PRIORIDAD 1 — ALTO (degrada experiencia)

#### P1.1 — Workflows contables faltantes (~4h)

**Problema**: `depreciation` y `financial_statements` estan en taskPlanner pero el GET devuelve 400.

**Solucion**:
1. En `workflowEngine.ts`:
2. En `workflows.ts:14` — **agregar ambos tipos a `accountingTypes`** (sin esto el generador nunca se alcanza; es la causa raiz del 400)

```
generateDepreciationWorkflow():
  email de Lic. Gomez con datos de activos a depreciar
  form: calcular depreciacion anual (metodo linea recta, 3 activos)
  result: tabla de depreciacion acumulada + asiento contable

generateFinancialStatementsWorkflow():
  email pidiendo preparar estados financieros trimestrales
  spreadsheet: completar BG y ER con datos de cuentas
  result: estados financieros correctos
```

---

#### P1.2 — Corregir bug IMSS → PTU (~1h)

**Problema**: `autoEntries.ts:79` mapea IMSS a `2-05 PTU por pagar` (utilidades). Debe ir a una cuenta de pasivo laboral especifica para IMSS.

**Solucion**: Agregar cuenta `2-08 IMSS por pagar` al catalogo y actualizar `generatePayrollEntries()`.

---

### PRIORIDAD 2 — MEDIO (calidad y robustez)

#### P2.1 — Suite de tests (~20h)

**Situacion actual**: 5 tests, solo health checks. Cero tests de negocio.

**Plan de tests minimos**:

| Archivo de test | Que cubre | Cantidad tests |
|----------------|-----------|:--------------:|
| `workflowEngine.test.ts` | 12 workflows generan datos validos, 4 trampas contienen errores | 16 |
| `dataEngineeringWorkflows.test.ts` | 7 workflows DE (incluyendo los 2 nuevos) | 7 |
| `workflowValidate.test.ts` | Validacion contable (6 tipos) + DE (7 tipos) | 13 |
| `autoEntries.test.ts` | 5 generadores de asientos, bug IMSS corregido | 5 |
| `taskPlanner.test.ts` | Plan semanal genera tareas coherentes, trampas en semanas correctas | 6 |
| `simEngine.test.ts` | Endpoints reportes, chart-of-accounts, progress | 8 |
| **TOTAL** | | **55** |

---

#### P2.2 — Staff dashboard (~12h)

**Problema**: Staff tiene solo login y paneles vacios (AdminPanel, InstructorPanel de ~50 LOC cada uno).

**Solucion**: Panel de instructor con:
- Lista de alumnos por especialidad
- Progreso semanal de cada alumno (datos de progressTracker)
- Tasa de deteccion de trampas
- Leaderboard por puntaje

**Archivos**: `staff/src/components/StudentList.tsx`, `staff/src/components/ProgressView.tsx`, endpoints nuevos en `backend/src/routes/staff.ts`.

---

#### P2.3 — Cobertura de testsprite al 80% (~8h)

Config actual (`testsprite.config.json`) pide 80% de cobertura en 6 archivos target. Resultado actual: <5%.

**Accion**: Tras implementar P2.1, re-ejecutar `npm run test:testsprite` y ajustar tests hasta alcanzar 80%.

---

### PRIORIDAD 3 — BAJO (nice-to-have)

#### P3.1 — Documentacion de APIs (~4h)

Endpoint `GET /api/sim/trap-scenarios` documentado como "devuelve escenarios de trampa" pero devuelve `[]`. Actualizar doc tras P0.1.

#### P3.2 — Mejoras UI menores (~4h)
- Tooltip en el KPI "1 fallo historico (05-jul)" de DataOpsSim explicando que fue dbt_test
- Scroll infinito en AccountingSystem para +100 asientos (actual: limitado a ~20)
- Loading skeleton en CloudSim S3 (tarda ~1s en compilar modelos)

#### P3.3 — Plan de capacitacion DE (~2h)
- Agregar tooltips en DesktopShell con los 7 dias de cada semana DE
- Conectar el ProgressDashboard con las fases del capstone (7 fases)

---

## 3. Cronograma

| Semana | Tareas | Horas est. | Entregable |
|:------:|--------|:----------:|------------|
| **1** | P0.1 — Trampas contables (4 generadores + tests + endpoint) | 16h | Trampas visibles y detectables |
| **1** | P1.2 — Fix IMSS → PTU | 1h | Bug corregido |
| **2** | P0.2 — Workflows DE code_review + soporte_datos | 10h | 7/7 DE con generador |
| **2** | P0.3 — Validacion workflows DE | 6h | POST validate cubre DE |
| **3** | P1.1 — Workflows depreciation + financial_statements | 4h | 14/14 workflows contables |
| **3** | P2.1 — Suite de tests (inicio: workflowEngine, autoEntries) | 10h | ~25 tests |
| **4** | P2.1 — Suite de tests (fin: simEngine, taskPlanner, validate) | 10h | 55 tests total |
| **5** | P2.2 — Staff dashboard | 12h | Panel instructor funcional |
| **6** | P2.3 — Cobertura 80% testsprite | 8h | Umbral cumplido |
| **6** | P3.x — Docs, UI, plan DE | 10h | Pulido final |

**Total estimado**: ~77 horas (3-4 semanas a dedicacion parcial)

---

## 4. Verificacion Final (checklist)

- [ ] `POST /api/sim/tasks/:id/complete` con `isTrap=true` asigna puntaje de deteccion (no solo completado)
- [ ] `POST /api/workflows/validate` acepta `taskType: "sql_query"` y devuelve `{ score, feedback }`
- [ ] `GET /api/workflows/code_review` devuelve formulario de revision de PR
- [ ] `GET /api/workflows/depreciation` y `/financial_statements` devuelven **200** (hoy: 400)
- [ ] `GET /api/workflows/invoice_emission?trap=iva_incorrecto` pre-llena IVA=10%
- [ ] `GET /api/sim/trap-scenarios` devuelve 4 objetos con `{ id, description, taskType, week, day }`
- [ ] Cuenta `2-08 IMSS por pagar` existe en chartOfAccounts y `generatePayrollEntries` la usa
- [ ] `npm run test` ejecuta 55+ tests, todos pasan
- [ ] `npx tsc --noEmit` limpio en alumnos/ y backend/
- [ ] `npm run test:testsprite` reporta >=80% cobertura
- [ ] Flujo narrativo: sem1/dia3 → factura con IVA 10% → alumno lo detecta → +puntos
- [ ] Staff panel: instructor ve progreso semanal de alumnos, tasa de deteccion de trampas
