# SIMULADOR LABORAL 3D — Centro de Control

## Especialidades Disponibles

| # | Especialidad | Empresa | Stack Principal |
|---|-------------|---------|-----------------|
| 1 | **Contador General Junior** | Logística del Norte S.A. | Odoo, Excel, CFDI, SAT |
| 2 | **Ingeniero de Datos Jr** | DataFlow Analytics S.A. | Palantir Foundry, SQL, Python, AWS |

---

## ESPECIALIDAD 1: Contador General Junior

### Contexto de la Empresa
- **Empresa**: Logística del Norte S.A. de C.V. (LNO)
- **RFC**: LNO-080515-TYU
- **Giro**: Transporte y logística de carga en el norte de México
- **Ubicación**: Av. Industrial 1250, Parque Industrial Santa Teresa, C.P. 32575, Ciudad Juárez, Chihuahua
- **Tamaño**: ~50 empleados, 4 sucursales
- **Sistema contable**: ERP similar a Odoo (módulo Contabilidad)
- **Moneda**: MXN

### Perfil del Estudiante
- **Rol**: Contador General Junior (recién egresado o con 1-2 años de experiencia)
- **Jefe directo**: Lic. Gómez (Contador General)
- **Horario**: Lunes a viernes, 9:00 - 18:00
- **Nivel**: Básico-Intermedio en contabilidad mexicana (NIF, CFDI, SAT)

### Responsabilidades Diarias del Rol
1. **Facturación (CFDI)**: Emitir facturas electrónicas a clientes por servicios de transporte/logística
2. **Cobranza**: Registrar pagos de clientes y aplicarlos a facturas
3. **CFDI de proveedores**: Registrar facturas recibidas de proveedores (transportistas, papelería, servicios, combustibles)
4. **Conciliación bancaria**: Verificar movimientos bancarios contra registros internos
5. **Nómina**: Calcular nómina mensual (sueldo bruto, ISR, IMSS, PTU, neto)
6. **Corte de caja**: En oficina principal, corte diario de efectivo
7. **Pólizas de diario**: Registrar ajustes contables (depreciación, provisiones)
8. **Notas de crédito**: Emitir notas por devoluciones o correcciones
9. **Pagos a proveedores**: Programar dispersión de pagos
10. **Reportes**: Preparar balance general, estado de resultados, balanza de comprobación

### Flujo de Trabajo Típico (1 día)
```
09:00 - Revisar correo → tareas pendientes del Lic. Gómez
09:30 - Emitir facturas pendientes del día
11:00 - Registrar pagos recibidos de clientes
12:00 - Registrar CFDI de proveedores
14:00 - Conciliación bancaria (si hay extracto)
15:00 - Calcular nómina (fin de mes) o pólizas de ajuste
16:00 - Preparar reportes si se solicita
17:00 - Corte de caja (si aplica)
18:00 - Cerrar turnos, pendientes para mañana
```

---

## ESPECIALIDAD 2: Ingeniero de Datos Junior (Palantir Foundry)

### Contexto de la Empresa
- **Empresa**: DataFlow Analytics S.A. de C.V.
- **Giro**: Consultoría y análisis de datos para empresas de retail y logística
- **Ubicación**: Av. Insurgentes Sur 1234, Col. Del Valle, C.P. 03100, CDMX
- **Tamaño**: ~30 empleados, 2 oficinas (CDMX + Monterrey)
- **Stack**: Palantir Foundry, AWS (S3, Redshift, Airflow), Python, SQL
- **Moneda**: MXN

### Perfil del Estudiante
- **Rol**: Ingeniero de Datos Junior (recién egresado o con 1-2 años de experiencia)
- **Jefe directo**: Ing. Sandra Mora (Lead Data Engineer)
- **Horario**: Lunes a viernes, 9:00 - 18:00
- **Nivel**: Básico-Intermedio en SQL, Python, ETL/ELT

### Responsabilidades Diarias del Rol
1. **Desarrollo de Transforms**: Escribir código Python/SQL en Palantir Foundry para procesar datos
2. **Monitoreo de pipelines**: Verificar ejecuciones diarias, reprocessar jobs fallidos
3. **Calidad de datos**: Profiling, validaciones y atención a alertas de datos
4. **Ingesta de datos**: Conectar nuevas fuentes (APIs, bases de datos, archivos CSV)
5. **Ontología**: Contribuir al modelado semántico del negocio
6. **Code reviews**: Revisar código del equipo y documentar datasets
7. **Soporte**: Responder solicitudes de datos de analistas y otras áreas
8. **Aprendizaje**: 30-60 min diarios de cursos (Foundry Academy, cloud)

### Flujo de Trabajo Típico (1 día)
```
09:00 - Standup diario con el equipo
09:30 - Revisar ejecuciones de pipelines y alertas
10:00 - Desarrollo de Transforms (Python/SQL)
12:00 - Almuerzo
13:00 - Code reviews y documentación
14:00 - Soporte a analistas / integración de nuevas fuentes
16:00 - Aprendizaje (Foundry Academy / cloud)
17:30 - Revisión final y cierre de tareas
```

### Plan de Capacitación (12 semanas)

| Semana | Tema | Entregable |
|:------:|------|------------|
| 1-3 | SQL (joins, window functions), Python pandas, ETL/ELT | Ejercicios SQL + script pandas |
| 4-5 | Palantir Academy: Connections, Transforms | Pipeline de ingesta básico |
| 6-7 | Ontología, Contour, Workshop | Modelo semántico + tablero |
| 8-9 | Cloud (AWS): S3, Redshift, Airflow | Deploy en cloud |
| 10-12 | Proyecto integrador | Caso end-to-end completo |

### Meses de Progreso

| Mes | Fase | Entregable |
|:---:|------|------------|
| 1 | Absorción | Primer pipeline bajo supervisión |
| 2 | Ejecución guiada | Módulo propio en producción |
| 3 | Autonomía | Proyecto integrador completo |
| 4-6 | Consolidación | Propiedad de módulos + onboarding de nuevos

## Stack Tecnológico del Proyecto
*   **Backend**: Node.js, Express, TypeScript, tsx, MemoryDatabase (`memoryDb.ts`) + Supabase (PostgreSQL).
*   **Frontend Alumnos**: React 19, Vite, TailwindCSS, **React Three Fiber** (motor 3D web), puerto 3000.
*   **Reloj de simulación**: `alumnos/src/lib/simTime.ts` — HOY sim = **miércoles 08-jul-2026**. Todas las apps DE/contables usan fechas simuladas (Airflow/DataOps/header escritorio); la hora real solo se muestra junto a la fecha sim. No usar `new Date()` para fechas del mundo simulado.
*   **Frontend Staff**: React, Vite, TailwindCSS, puerto **3001**.
*   **Base de Datos**: Supabase (PostgreSQL), migraciones en `supabase/`.
*   **Infra**: Render (3 servicios: backend, alumnos, staff).
*   **Motor de simulación**: 12 workflows contables (invoice, payment, tax, bank_reconciliation, journal, payroll, supplier, payment_scheduling, ap_reconciliation, cfdi_reception, credit_note, cash_cut).

## Arquitectura del Simulador

### Componentes Principales

| Componente | Archivo | Función |
|------------|---------|---------|
| **SimuladorLaboral** | `SimuladorLaboral.tsx` | Escena 3D de oficina + controlador de vistas |
| **DesktopShell** | `DesktopShell.tsx` | Escritorio virtual con 10 aplicaciones |
| **OfficeScene** | `SimuladorLaboral.tsx` | Muebles 3D (escritorio, monitor, silla, estantería, lámpara) |
| **DBTSim** | `DBTSim.tsx` | Clon de dbt (Data Build Tool): models SQL con `{{ ref() }}`/`{{ source() }}`, motor de compilación con JOIN/GROUP BY/ORDER BY, tests (not_null/unique/positive), `dbt build`, docs y lineage |
| **CatalogSim** | `CatalogSim.tsx` | Data Catalog: búsqueda, filtros por dominio/certificados/míos/favoritos, metadata (owner, tags, freshness), calidad (completitud/validez), lineage reutilizando el DAG de DBTSim |
| **NotebookSim** | `NotebookSim.tsx` | Jupyter Notebook: celdas code/markdown, kernel Python simulado (pandas: head/tail, describe, dtypes, shape, sort_values, groupby, filtros booleanos, agregaciones, f-strings), variables en memoria, ▶ Run All / ⭮ kernel, datos reales del pipeline dbt |
| **AirflowSim** | `AirflowSim.tsx` | Orquestador tipo Airflow: DAG `lno_sales_pipeline` (ingesta → dbt run → tests → export Redshift) con grafo SVG, grid de ejecuciones diarias, trigger runs en vivo, vista de código Python del DAG |
| **CloudSim** | `CloudSim.tsx` | Consola AWS simulada: Dashboard, S3 (buckets raw/staging/logs con objetos reales del pipeline), Redshift (tablas dbt con filas compiladas), IAM (usuarios/políticas), Billing (Cost Explorer mensual) |
| **GitSim** | `GitSim.tsx` | Cliente Git con NPCs: repo `lno-dbt` (archivos reales de DBTSim), motor de reglas que analiza diffs (SELECT *, refs rotos, tests con columna inexistente, hardcode de datos) → review inline de Ing. Sandra Mora (rechaza/aprueba con línea exacta y mensaje), PRs del equipo para code review con consecuencias |
| **BiSim** | `BiSim.tsx` | BI estilo Looker Studio sobre el warehouse real (compile dbt): KPIs, barras por cliente, donut por sector, serie diaria SVG, tabla top con filtro por sector, detalle por transacción |
| **CapstoneSim** | `capstoneSim.tsx` | Proyecto integrador: 7 fases end-to-end (ingesta → transform → calidad → catálogo → orquestación → cloud → BI) con checkpoints, puntaje por intentos, README de arquitectura con datos reales del pipeline |
| **ApiClientSim** | `ApiClientSim.tsx` | REST/API client estilo Postman: endpoints de ingesta reales (ventas, estado del DAG, ingesta POST), JSON viewer con syntax highlight, historial, códigos HTTP (200/201/404) |
| **DataOpsSim** | `DataOpsSim.tsx` | Consola DataOps: semáforos de cómputo/costo en Redshift (slots por hora, costo/h, alertas, recomendación de size) + tab de SLAs de calidad consolidados (matriz 7 días 03-08-jul, tests dbt 5/5, incidente 05-jul coherente con AirflowSim) |
| **PipelineSim** | `PipelineSim.tsx` | Palantir Foundry Transforms (editor Python/SQL, @transform, build, preview, lineage) |
| **SQLSim** | `SQLSim.tsx` | Motor SQL real (SELECT/INSERT/UPDATE/DELETE/JOIN/GROUP BY/ORDER BY) |
| **MonitorSim** | `MonitorSim.tsx` | Monitoreo de pipelines: 6 runs del DAG `lno_sales_pipeline` (03/07→08/07), 1 fallido (05/07, dbt_test), datos de `simSlash()` |
| **WarehouseSim** | `WarehouseSim.tsx` | Visor de modelos dbt reales: 4 tablas (compileModelSql), capas staging/intermediate/marts, lineage, queries con filas golden |
| **SpreadsheetSim** | `SpreadsheetSim.tsx` | Hoja de cálculo tipo Excel con 40+ fórmulas |
| **AccountingSystem** | `AccountingSystem.tsx` | Sistema contable tipo Odoo (pólizas, catálogo, reportes) |
| **AccountingForm** | `AccountingForm.tsx` | Formularios validados con auto-cálculo |
| **CalendarWidget** | `CalendarWidget.tsx` | Calendario con modal de eventos y recordatorios |
| **Dashboard** | `Dashboard.tsx` | Dashboard ejecutivo con KPIs en tiempo real |
| **ProgressDashboard** | `ProgressDashboard.tsx` | Seguimiento mensual de progreso |
| **PaymentMatcher** | `PaymentMatcher.tsx` | Matching automático de pagos con facturas |
| **EmailInbox** | `EmailInbox.tsx` | Bandeja de entrada con correos por tarea (remitentes/previews por especialidad: DE → Sandra Mora/DataFlow; prop `specialty`) |
| **BankingPortal** | `BankingPortal.tsx` | Portal bancario con CSV |
| **Calculator** | `Calculator.tsx` | Calculadora con expresiones |
| **Onboarding** | `Onboarding.tsx` | Wizard de bienvenida |

### Servicios Backend

| Servicio | Archivo | Función |
|----------|---------|---------|
| **TaskPlanner** | `taskPlanner.ts` | Generador de tareas coherentes (33/mes, 4 trampas) |
| **WorkflowEngine** | `workflowEngine.ts` | 12 workflows contables con validación |
| **PersistentData** | `persistentData.ts` | Datos coherentes (clientes, proveedores, productos) |
| **ChartOfAccounts** | `chartOfAccounts.ts` | Catálogo jerárquico (40 cuentas) |
| **AutoEntries** | `autoEntries.ts` | Auto-generación de asientos contables |
| **PaymentMatching** | `paymentMatching.ts` | Matching de pagos con score |
| **ExcelExercises** | `excelExercises.ts` | 7 ejercicios Excel puros |
| **ProgressTracker** | `progressTracker.ts` | Seguimiento de progreso mensual |

### Endpoints API

```
# Autenticación
POST /api/auth/login-credentials
GET  /api/auth/me

# Simulador
GET  /api/sim/task-plan/:month/:year
GET  /api/sim/today-tasks/:month/:year/:week/:day
GET  /api/sim/month-stats/:month/:year
GET  /api/sim/task-knowledge/:taskType
GET  /api/sim/trap-scenarios

# Workflows
GET  /api/workflows/:taskType
POST /api/workflows/validate

# Sistema Contable
GET  /api/sim/chart-of-accounts
GET  /api/sim/journal
POST /api/sim/journal
POST /api/sim/generate-entries
GET  /api/sim/reports/balance-general
GET  /api/sim/reports/estado-resultados
GET  /api/sim/reports/balanza-comprobacion

# Matching de pagos
POST /api/sim/suggest-matches
POST /api/sim/confirm-match
GET  /api/sim/pending-invoices

# Datos persistentes
GET  /api/sim/company
GET  /api/sim/clients
GET  /api/sim/suppliers
GET  /api/sim/products

# Ejercicios Excel
GET  /api/sim/exercises
GET  /api/sim/exercises/:id
GET  /api/sim/exercises/type/:type
GET  /api/sim/exercises/difficulty/:level

# Progreso
POST /api/sim/progress/record
GET  /api/sim/progress/month/:month/:year
GET  /api/sim/progress/quick

# Health
GET  /api/health
```

### Datos Persistentes

| Entidad | Cantidad | Ejemplo |
|---------|:--------:|---------|
| **Clientes** | 5 | Comercial del Norte, Transportes Rápidos |
| **Proveedores** | 4 | Transportes Express, Papelería del Norte |
| **Productos** | 8 | Flete express, Almacenaje, Carga especializada |
| **Cuentas contables** | 40 | 13 Activo, 7 Pasivo, 3 Capital, 3 Ingreso, 7 Gasto |

### Workflows Contables

| # | Workflow | Dificultad | Trap |
|---|----------|:----------:|:----:|
| 1 | Emisión de Factura | 1 | No |
| 2 | Registro de Pago | 1 | No |
| 3 | Cálculo de IVA | 2 | No |
| 4 | Conciliación Bancaria | 2 | Sí (#3) |
| 5 | Póliza de Diario | 2 | No |
| 6 | Nómina | 2 | Sí (#4) |
| 7 | Factura de Proveedor | 1 | No |
| 8 | Programación de Pagos | 1 | No |
| 9 | Conciliación AP | 2 | No |
| 10 | Recepción de CFDI | 1 | No |
| 11 | Nota de Crédito | 2 | Sí (#7) |
| 12 | Corte de Caja | 2 | Sí (#8) |

### Trampas (Errores Intencionales)

| # | Trampa | Error | Riesgo real |
|---|--------|-------|-------------|
| 1 | IVA incorrecto | IVA al 10% en vez de 16% | Multa SAT |
| 2 | Pago mal aplicado | Pago de cliente A en factura de B | Saldos incorrectos |
| 3 | Conciliación no cuadra | Cheque sin cobrar no registrado | Diferencias bancarias |
| 4 | Nómina con ISR mal calculado | ISR fijo 15% en vez de tabla | demandas laborales |

**Mecanismo de trampas (implementado 12-ago-2026)**: `GET /api/workflows/:taskType?trap=<trapId>` inyecta el error en el email/documento y agrega un campo de detección al form/spreadsheet (ej. `ivaRate`, `applyToClient`, `row_Cheques sin cobrar`, `row_Método ISR aplicado`); la validación premia la detección con feedback explicativo. `GET /api/sim/trap-scenarios` lista los escenarios. **Coherencia GET→validate**: `workflowStore` en memoria (TTL 30 min) — el GET registra el workflow por `taskId` y el POST `/validate` lo recupera vía `workflowId` para que las pistas del formulario (`correct`) coincidan con las reglas (`expected`). `taskPlanner` marca `isTrap`+`trapId` en las tareas (7 plantillas: 4 contables + 3 DE) y `DesktopShell` propaga `?trap=` y envía `workflowId` al validar.

**Trampas DE y validación por resultado real (12-ago-2026)**: 3 trampas DE (`sql_sin_group_by`, `pipeline_datos_perdidos`, `alerta_calidad_ignorada`) inyectan el error en el email y marcan la regla `de` correspondiente. La validación DE usa `backend/src/services/deValidation.ts` (`runDEValidator`) en vez de comparar strings exactos: analiza el código/query/decisión del estudiante (`sql`, `etl_clean`, `quality_decision`, `review`, `incident`) y devuelve feedback técnico de lead (ej. "SUM() sin GROUP BY agrega TODAS las filas", "dropna() pierde 200 registros"). Los workflows DE (`sql_query`, `etl_pipeline`, `data_quality`, `code_review`, `incident_recovery`) usan reglas `type: 'de'` con `validator`; `getDEWorkflow(type, trap?)` aplica la trampa.

**Mundo simulado vivo (12-ago-2026)**: `backend/src/services/simWorld.ts` mantiene el estado global por usuario (`pipeline` del 05-jul, SLAs, registro de acciones) y lo **persiste en Supabase** (tabla `sim_world`, migración `supabase/migrations/20260812083736_persist_sim_world.sql`, RLS por usuario) con fallback a memoria si no hay credenciales o falla la conexión. **La migración está aplicada al proyecto activo `nhcgclqiihvioyqwqjlf` (finnova)**: conexión vía pooler `aws-1-us-east-1.pooler.supabase.com` (5432 session / 6543 transaccional), usuario `postgres.nhcgclqiihvioyqwqjlf`. Endpoints `GET /api/sim/world`, `POST /api/sim/world/action`, `POST /api/sim/world/reset`. El workflow DE `incident_recovery` (semana 4 DE) pide diagnosticar el fallo de `dbt_test`/`positive(total_ventas)`; aprobar en `/validate` llama `recoverIncident` → el pipeline pasa a verde y el SLA a cumplido (side effect observable). DesktopShell (modo DE) muestra un banner con el estado del pipeline que se refresca al completar tareas.

**Integración tarea ↔ herramienta real (12-ago-2026)**: cada workflow DE incluye un paso `type: 'tool'` (entre email y spreadsheet) con `data.app` que mapea a la herramienta real embebida en DesktopShell: `sql→SQLSim`, `notebook→NotebookSim`, `git→GitSim`, `airflow→AirflowSim`, `catalog→CatalogSim`, `bi→BiSim`, `warehouse→WarehouseSim`, `pipeline→PipelineSim`. El paso tool es contexto de trabajo; la respuesta se entrega en el spreadsheet siguiente y se valida con los validadores DE (`runDEValidator`). La trampa no altera el paso tool.

**Jornada guiada DE (12-ago-2026)**: DesktopShell (modo DE) muestra una agenda del día con bloques fijos del rol (09:00 Standup, 09:30 Monitoreo, 12:00 Almuerzo, 16:00 Aprendizaje, 17:30 Cierre) y las tareas del día intercaladas en franjas según su tipo (`DE_SLOTS`: incident→09:30, sql→10:00, etl→10:30, quality→11:00, ontology→13:00, review→13:30, airflow→14:00, soporte→14:30), marcando la hora actual.

**Módulo de aprendizaje (12-ago-2026)**: `LearningSim.tsx` (app en DesktopShell DE, icono "📚 Aprendizaje" y bloque 16:00 de la agenda) — 6 lecciones (SQL, pandas, dbt, Airflow, AWS, Foundry) con intro, puntos clave y mini-quiz de 2 preguntas con explicación; progreso 0-6 persistido en `localStorage('learning_progress')`.

**Staff — seguimiento de alumnos (12-ago-2026)**: `backend/src/routes/staff.ts` → `GET /api/staff/students` devuelve alumnos con progreso agregado y el estado de su mundo simulado (fuente Supabase en producción vía service role; demo en local). `staff/src/App.tsx` (`StaffDashboard`) muestra la tabla "Simulador — Progreso de alumnos" con especialidad, completadas, score, trampas y estado del pipeline.

**Staff — Centro de Control completo (13-ago-2026)**: `staff/src/App.tsx` ahora renderiza `StaffControlCenter` con sidebar de 3 secciones. **Panel de Control** (`ControlPanel.tsx`): KPIs agregadas (alumnos totales, por especialidad, tareas completadas, score promedio, trampas, pipeline OK, SLAs cumplidos) + distribución por especialidad. **Alumnos** (`StudentsManager.tsx`): tabla con búsqueda, filtros por especialidad, y modal de detalle (mundo simulado, últimas completaciones, resumen) con acciones de admin (reset mundo, reset progreso, cambiar especialidad). **Administración** (`AdminSection.tsx`, solo admin): aprobación de solicitudes de registro + directorio de cuentas autorizadas. Backend nuevo en `staff.ts`: `GET /api/staff/stats`, `GET /api/staff/students/:id`, `POST /api/staff/students/:id/reset-world`, `POST /api/staff/students/:id/reset-progress`, `POST /api/staff/students/:id/specialty`. Se agregó `resetProgress(userId, specialty)` en `progressTracker.ts`. El proxy dev de `staff/vite.config.ts` apunta a `localhost:3001` (backend).

**Tests de motores DE (12-ago-2026)**: `tests/de-motors.test.ts` importa el motor dbt real del frontend (`compileModelSql`, `SOURCES`, `MODELS`, `topoOrder` de `alumnos/src/components/DBTSim.tsx`) y verifica la compilación staging→intermediate→marts, el total del mart (128350) y el orden topológico. Suite completa: root 79 tests / backend 70 tests.

**Fix anti-mojibake (15-ago-2026)**: `alumnos/src/components/PipelineSim.tsx` (módulo Foundry) estaba guardado con doble codificación UTF-8→CP1252→UTF-8 (mojibake: `â†'`, `ðŸ"Š`, `Â·`). Se re-decodificó correctamente (UTF-8 → CP1252 → UTF-8 sin BOM) restaurando los 21 emojis/símbolos de la UI (flechas, 🔀, ⚡, 📁, 📋, 🐍, 📊, ⚙️, ✅, ➤, ·, ×) y los acentos del texto (construcción, catálogo, ejecución, aquí). Escaneo global con `rg` confirmó que **ningún otro archivo del repo** tiene secuencias mojibake. Se agregó test anti-regresión `tests/anti-mojibake.test.ts` que recorre todos los `.ts/.tsx/.js/.jsx/.json/.html/.css/.md` de `alumnos/src` y `staff/src` y falla si aparece cualquier firma (`â†`, `ðŸ`, `Â·`, `âš`, `â€`, `Ã`, `ï¸`, etc.). Charset ya estaba correcto: `<meta charset="UTF-8">` en ambos `index.html` y Express/static con `charset=utf-8`.

**Persistencia del progreso (12-ago-2026)**: `backend/src/services/progressTracker.ts` ahora es async y persiste las completaciones en Supabase (tabla `sim_progress`, migración `supabase/migrations/20260812092933_persist_sim_progress.sql`, PK user_id+specialty, RLS, **aplicada al proyecto activo**) con fallback a memoria. Endpoints `/api/sim/progress/*` usan `await`. `staff.ts` lee `sim_progress` para el resumen de alumnos.

**Árbol de Rutas Data (15-ago-2026, R-07)**: la especialidad data es un árbol `Analista de Datos` (raíz) → `Ingeniería de Datos` / `Ciencia de Datos`. Servicio `backend/src/services/careerPath.ts`: `practicePct = 100*(0.45*tasks + 0.35*sims + 0.20*cases)`; desbloqueo a `UNLOCK_PCT=40` (ambas ramas); `chooseBranch` **irreversible** (solo staff resetea); `applyDemoOverride` fuerza unlocked en vista **sin mutar practicePct** (persiste en `localStorage('demo_routes_override')` + evento en history). Integrado en `simWorld.ts` (campo `careerPath`), migración `supabase/migrations/20260815100000_career_path.sql` (columnas `career_path` y `breakdown`). Endpoints: `GET/POST /api/sim/career-path`, `POST /api/sim/career-path/choose`, `POST /api/sim/career-path/demo-override`, `POST /api/staff/students/:id/reset-career`. Frontend: DesktopShell con título dinámico por fase, toggle DEMO junto al título, `RoutesPanel` (árbol 3 nodos + barra de práctica + requisitos), apps por fase (analyst: SQL/Notebook/Catalog/BI; engineering: set actual; science: +StatsSim/MLSim) y agendas por fase (`ANALYST_SLOTS`/`DS_SLOTS`). Rama ciencia: `StatsSim.tsx` (estadística sobre mart real, golden 128350), `MLSim.tsx` (baseline churn degradado por incidente 05-jul), `dsValidation.ts` (`runDSValidator`: eda/model/metrics), workflows DS (`eda_churn`, `modelo_baseline`, `eval_metricas`) en `dataEngineeringWorkflows.ts` con `type:'ds'`. Guion de seguimiento: `backend/src/data/storyData.ts` + `docs/guion-seguimiento-data.md` (3 arcos: analista/ingeniería con incidente 05-jul/ciencia con churn degradado). Auditoría: `tests/story-coherence.test.ts` + `npm run audit:story` (verifica taskType→sceneId, fechas sim, datasets en SOURCES/MODELS, NPC por rama, fases en agendas, demo inmutable, nunca apps contables en data). `taskPlanner.ts` agrega `phase` y `countsAsCase`; `progressTracker.computePracticeBreakdown` expone el breakdown.

**Resiliencia producción — anti-reset y WebGL (15-ago-2026)**: fallo crítico en prod: al entrar al main, el contexto WebGL se perdía (`THREE.WebGLRenderer: Context Lost.` ×3 por montajes repetidos sin dispose), el crash remontaba `/student` completo y, como el onboarding no estaba persistido, la app regresaba a la bienvenida (loop). Fix en `SimuladorLaboral.tsx`: `StableCanvas` envuelve el Canvas R3F con `gl.shadowMap.type = THREE.PCFShadowMap` (elimina warn deprecado por frame), listeners `webglcontextlost`/`webglcontextrestored`, `forceContextLoss()+dispose()` al desmontar, y `ErrorBoundary` con fallback `OfficeScene2D` ("Modo sin 3D") que NO reinicia el flujo. Anti-reset: `Onboarding.handleStart` persiste `sim_specialty`/`sim_assigned_job`/`sim_visited` en `localStorage` ANTES de `¡Empezar!`; `checkOnboarding` reanuda desde localStorage SOLO si `sim_visited === '1'` (usuario que completó el onboarding) y la API no responde — un usuario nuevo sin `sim_visited` SIEMPRE ve la bienvenida y la selección de especialidad. Rol del main: header de oficina muestra `Analista de Datos · DataFlow Analytics` para specialty data (nunca default contable). Tests: `tests/resilience.test.ts` (10 tests: PCFShadowMap, contextlost/restored, dispose, fallback 2D, ErrorBoundary, anti-reset gated por sim_visited, persistencia previa a API, bienvenida no se salta para usuarios nuevos, rol data).

**CV Institucional de egreso (16-ago-2026)**: módulo de perfil de egreso con marca. `backend/src/services/skillProfile.ts` interpreta `sim_progress` como dimensiones de habilidad (mapeo taskType→dimensión por rama: SQL/ETL/calidad/orquestación/ML/facturación/fiscal...; niveles Básico/Intermedio/Avanzado; overall; fortalezas/gaps) y expone `buildDemoSkillProfile(role)` para el modo DEMO. `backend/src/services/cvProfile.ts`: guarda datos extra del alumno (contacto, educación, idiomas, proyectos) en Supabase (tabla `cv_profiles`, migración `20260816090000_cv_profiles.sql`, RLS) o memoria; genera el `.tex` moderncv para Overleaf (escapado LaTeX). `backend/src/services/cvPdf.ts`: genera **PDF semántico** con `pdfkit` (texto seleccionable, metadata ATS Title/Subject/Keywords/Creator, marca institucional azul + ámbar, barras de habilidad, pie con disclaimer "validación académica simulada"). Endpoints: `GET/POST /api/sim/cv-profile`, `GET /api/sim/cv/pdf`, `GET /api/sim/cv/tex` — los tres soportan `?demo=analyst|engineering|science|accounting` para generar el CV "como si ya hubiera completado" esa especialidad (sin tocar el progreso real). Frontend: `CvBuilderSim.tsx` (app "Mi CV" en DesktopShell en todas las fases/ramas): formulario de datos extra, resumen de desempeño (práctica/dominio/habilidades con barras), guardar, descargar PDF semántico y `.tex`, ver fuente LaTeX; con el toggle DEMO activo muestra un selector de perfil (Mis datos reales / Analista / Ingeniero / Científico / Contador) que previsualiza el CV de cada especialidad completada. **Modo DEMO de rutas**: en DesktopShell (data), al activar el toggle DEMO aparecen **pestañas de rutas** (🧭 Analista / 🔀 Ingeniería / 🧪 Ciencia) junto al título que cambian `appSet`/`roleTitle` y la agenda para previsualizar cada fase sin `chooseBranch` (irreversible). Tests: `tests/cv-profile.test.ts` (7 tests: .tex moderncv, PDF válido con metadata ATS, escapado LaTeX, datos vacíos, perfiles demo por rol, .tex demo engineering).

### Ejercicios Excel Puros

| # | Ejercicio | Dificultad | Tipo |
|---|-----------|:----------:|------|
| 1 | Balanza de Comprobación | 1 | balanza_comprobacion |
| 2 | Pólizas de Diario Múltiples | 2 | poliza_diario_multi |
| 3 | Estado de Resultados | 2 | estado_resultados |
| 4 | Conciliación Bancaria | 2 | conciliacion_bancaria |
| 5 | DIOT | 3 | diot |
| 6 | Depreciación de Activos | 2 | depreciacion |
| 7 | Edad de Saldos por Cobrar | 3 | cuentas_por_cobrar |

### Fórmulas Excel Soportadas (40+)

**Matemáticas**: SUM/SUMA, AVG/PROMEDIO, COUNT/CONTAR, MAX, MIN, ABS, ROUND/REDONDEAR, POWER/POTENCIA, SQRT/RAIZ, MOD, INT/ENTERO, RAND, RANDBETWEEN

**Lógicas**: IF/SI, AND/Y, OR/O, NOT

**Texto**: UPPER/MINUSC, LOWER/MAXUSC, PROPER/NOMPROPIO, LEN/LARGO, LEFT/IZQUIERDA, RIGHT/DERECHA, MID/EXTRAE, TRIM/ESPACIOS, VALUE/VALOR, CONCAT/CONCATENAR

**Fechas**: NOW/AHORA, TODAY/HOY, DATE/FECHA, YEAR/AÑO, MONTH/MES, DAY/DIA

## Diseño UI/UX

### Fases de Diseño Completadas

| Fase | Features | Estado |
|------|----------|:------:|
| **FASE 1** | Theme tokens (success/error/warning/info), fuentes accesibles (10-13px), loading skeletons, error states, empty states | ✅ |
| **FASE 2** | Animaciones slide-in, Dashboard datos reales, persistir asientos, autocomplete cuentas | ✅ |
| **FASE 3** | Virtual scrolling Excel, context menu, CSV export, pagination asientos | ✅ |

### Mejoras de Diseño

- **Fuentes**: Mínimo 10px (antes 5.25px) — accesibilidad WCAG
- **Theme tokens**: 10 colores semánticos (success, error, warning, info + backgrounds)
- **Loading states**: Skeletons pulsantes en DesktopShell y Dashboard
- **Error handling**: Banners de error visibles en AccountingSystem
- **Animaciones**: Transiciones slide-in en todas las pantallas
- **Oficina 3D**: Materiales metálicos, teclado/mouse/café, silla ergonómica, ventana con marco, pizarra, libros/planta/trofeo

## Comandos Disponibles

*   `/sugerencias`: Analiza código reciente, tareas y genera reportes en `agent_memory/suggestions/`.
*   `/reunion`: Inicia/finaliza una reunión estructurada usando las plantillas de `agent_memory/meetings/`.
*   `/protocol`: Audita el código frente a los lineamientos de desarrollo y seguridad en `agent_memory/protocol/`.

## Comandos de Desarrollo

```bash
# Backend
cd backend
npx tsx src/server.ts          # Iniciar backend en puerto 3001

# Frontend
cd alumnos
npx vite --port=3000 --host=0.0.0.0  # Iniciar frontend

# Tests
npm run test                   # Ejecutar todos los tests (9)
npm run test:watch             # Modo watch durante desarrollo
```

## Reglas Básicas de Operación

1. **No asumir**: Siempre verificar el estado local antes de proceder.
2. **Planificación de Roles**: Generar `roles/plan-de-rol.md` antes de cualquier modificación compleja.
3. **Memoria**: Sincronizar decisiones críticas en el historial.
4. **Ahorro de Tokens**: Limitar la lectura de archivos innecesarios; usar resúmenes estructurados.
5. **Separación de Lógica**: Backend y frontend estrictamente separados.

## Protocolo de Desarrollo

### Protocolos Obligatorios
- **Análisis Completo**: Identificar todas las referencias afectadas.
- **Descomposición Jerárquica**: Dividir cada requerimiento en tareas atómicas.
- **Investigación Automática**: Buscar archivos, componentes y funciones.
- **Trazabilidad**: Indicar qué archivos/componentes afecta cada tarea.

### Reglas de Ejecución
1. **Antes de codificar**: Generar la lista completa de archivos/componentes afectados.
2. **Priorización**: Ordenar tareas por dependencias.
3. **Migración**: Si cambias la estructura de datos, incluir script de migración.
4. **Testing**: Verificar la integridad compilando y realizando pruebas. `npm run test` debe pasar.
5. **Documentación**: Mantener actualizado este archivo `agents.md` con los cambios arquitectónicos.

**R-08 Fase 1 — Expediente verificable (17-ago-2026)**: el simulador convierte logros reales en evidencia comprobable. Backend: `backend/src/services/expediente.ts` genera logros cuantificados desde `sim_progress` + mundo simulado (tareas aprobadas score>=70, trampas detectadas, incidente 05-jul recuperado; categorías facturacion/datos/incidente/proyecto; resumen: tareas, score, racha, horas, trampas, incidentes). Tabla `verification_links` (migración `20260817090000_verification_links.sql`, RLS, aplicada): slug único, activo, revocable. Endpoints: `GET /api/sim/expediente` (logros + link activo), `POST /api/sim/expediente/link` (mínimo 3 logros, revoca anteriores), `POST /api/sim/expediente/link/revoke`, y página pública `GET /api/sim/expediente/:slug` (sin auth) con **sello de verificación** ✓, métricas y logros — HTML generado por `renderExpedientePublicPage`. Frontend: sección "Expediente Verificable" en `CvBuilderSim.tsx` (resumen de logros, botón generar link, copiar al portapapeles, revocar, sello activo). Tests: `tests/expediente.test.ts` (4 tests: slug, estructura, categorías, incidente).

**R-08 Fase 2 y 3 — Entrevista entrenada y práctica a la medida (17-ago-2026)**: ackend/src/services/interview.ts genera preguntas de entrevista sobre los logros reales del alumno (incidente 05-jul, SQL, calidad, ETL, facturación, conciliación) con rúbrica técnica y calificación por conceptos clave (stems tolerantes a conjugación). Endpoints: `POST /api/sim/interview/start` (genera hasta 5 preguntas, requiere logros), `POST /api/sim/interview/submit` (califica y devuelve feedback). Frontend: `InterviewSim.tsx` (app "🎤 Entrevista" en DesktopShell, todas las fases): contexto del logro, pregunta, rubrica visible, navegación y resultados con puntaje + feedback por respuesta. `backend/src/services/reforzamiento.ts` detecta habilidades <65 en el perfil y asigna micro-ejercicios concretos con evidencia esperada (SQL, calidad, ETL, orquestación, facturación, conciliación, fiscal, ML). Endpoint `GET /api/sim/refuerzo`. Frontend: bloque "🎯 Práctica a la medida" en `CvBuilderSim.tsx`. Tests: `tests/interview.test.ts` (3) + `tests/reforzamiento.test.ts` (3).

**R-09 Fase 1 — Lore vivo: world bible, arcos y auditoría de coherencia (18-ago-2026)**: convierte el simulador de catálogo de tareas a mundo vivo coherente. `backend/src/data/worldBible.ts` (fuente única NARRATIVA): calendario sim (HOY 2026-07-08, ventana 01→31-jul), empresas (LNO caja apretada / DataFlow presión retail), eventos canónicos fijos (`incidente_05jul` = DAG `lno_sales_pipeline` falló en `dbt_test`/`positive(total_ventas)` SLA incumplido, `retraso_transportes_express`, `rumor_auditoria_sat`, `presion_cliente_retail`) y NPCs con rasgos/escalera (lic_gomez/Sandra Mora/tesoreria/maria_lopez_rrhh/cliente_comercial_norte/proveedor_transportes_express/ana_analista). `backend/src/data/storyArcs.ts`: 8 arcos por ruta (contable A1-A3, analyst 2, engineering 3, science 1) con escenas `{sceneId, route, ventanaSim, npc, entidades, taskTypes, trigger, consecuencia}` — sin montos ni golden. `backend/src/data/dbtCatalog.ts`: proyección backend del pipeline dbt (datasets, tests, MART_TOTAL=128350) para que el backend NO dependa de alumnos/. `backend/src/lib/simTime.ts`: espejo backend del reloj sim. `backend/src/services/storyCoherence.ts`: GATE con 9 checks (`datesInSimCalendar`, `entitiesExist` con match parcial vs persistentData+DBT_DATASETS+NARRATIVE_ENTITIES, `balancedEntry`, `goldenFromEngine` mart=128350, `slaConsistent`, `npcAuthorized` por empresa LNO=dataflow, `noCrossRoute` FALLA#1, `seedReproducible`, `noMojibake` FALLA#2) + `auditLore` para escenas/eventos. Regla de oro: lore variable, números/fechas/validaciones SIEMPRE de motores (autoEntries, paymentMatching, compileModelSql/simTime). Tests: `tests/story-coherence.test.ts` ampliado a 32 tests (world bible, arcos, 9 checks, catálogo vs DBTSim real); `tests/anti-mojibake.test.ts` ahora escanea backend/src con exclusión del definidor de patrones. Espejo legible: `docs/world-bible.md`. `npm run audit:story` (story-coherence + case-generator + career-path + de-motors + anti-mojibake). Suite: root 161 tests / backend 70 tests.

**R-09 Fase 2 — Generador de casos con semilla y NPCs (18-ago-2026)**: `backend/src/services/caseGenerator.ts` — `seed = hash(userId:weekKey:arcId:attempt)`; PRNG determinístico mulberry32 (`makeRng`/`pickRng`/`folio`); elige escena del arco activo (`pickScene`), la parameteriza con `persistentData` (clientes/proveedores/productos) y calcula los golden values con los MOTORES (`generateInvoiceEntries`/`generatePaymentEntries`/`generateJournalEntryForType` de autoEntries, `suggestMatches` de paymentMatching, `MART_TOTAL=128350` de dbtCatalog). Generadores por taskType (`SCENE_GENERATORS`: invoice_emission, bank_reconciliation, payment_registration, journal_entry, payroll, sql_query, data_quality, incident_recovery, eda_churn/modelo_baseline/eval_metricas). Cada caso se valida con `auditCase` (9 checks); si falla regenera con attempt+1 (máx 5, luego plantilla canónica segura). `caseSignature` para reproducibilidad. `backend/src/services/npcEngine.ts` — modelo por reglas (sin LLM en decisiones): `NpcState{npcId, trust 0-100, nivelEscalera, erroresRepetidos, actions}`, `freshNpcState`/`freshNpcWorld`; `applyNpcEvent` con `NpcEventType` (trap_detected +5, task_failed −4, task_overdue −6, incident_recovered +10, arc_completed +8, error_repeated −3); plantillas de correo por formalidad (0/1/2) y escalera del NPC; memoria: mismo trapId 2 veces → `microArco=capacitacion_<trapId>`; trust ≥ 80 + arco/incidente → `escenaEspecial` (cierre_cliente contable / propiedad_modulo data). Tests: `tests/case-generator.test.ts` (14: reproducibilidad, usuarios distintos, 4 rutas×20 auditados, asiento cuadra, mart golden, escena del arco, NPC por ruta, PRNG, escalera, memoria, formalidad, mundo). `npm run audit:story` lo incluye. Suite: root 161 tests / backend 70 tests.

**R-09 Fase 3 — Persistencia y endpoints del mundo vivo (18-ago-2026)**: `backend/src/services/chronicle.ts` — log de hitos `{sceneId, fechaSim, resultado, npc, detail}` persistido en `sim_story` (fuente de logros de R-08). `backend/src/services/storyState.ts` — estado por usuario (caso del día con semilla, arco activo, `NpcWorld`, crónica, correos pendientes); `getStoryState`/`getActiveCase` (cachea por weekKey+arcId)/`completeScene` (dispara npcEngine + crónica)/`resetStory`. Tabla `sim_story` (migración `20260818234617_sim_story.sql`, RLS por usuario, aplicada a Supabase). Endpoints en `simEngine.ts`: `GET /api/sim/story/state`, `GET /api/sim/story/case`, `GET /api/sim/story/chronicle`, `POST /api/sim/story/scene/complete`, `POST /api/sim/story/reset`. Staff: `GET /api/staff/students/:id/story` (reproducir semillas) + `POST /api/staff/students/:id/reset-story`. Tests: `tests/story-state.test.ts` (8: inicialización, cacheo por semana, caso data audited, completeScene→crónica+trust, fallida+trampa→escalera, reset, crónica acumulada, reproducibilidad staff). `npm run audit:story` lo incluye. Suite: root 169 tests / backend 70 tests.

**R-09 Fase 4 — UI lore (18-ago-2026)**: `alumnos/src/components/ChronicleSim.tsx` (app "📖 Crónica" en DesktopShell, todas las fases): timeline de hitos con NPC/fecha sim/resultado desde `/api/sim/story/chronicle`. `DesktopShell.tsx`: banner púrpura "📖 Arco: <nombre>" + escena activa (se carga con `loadStory` según appSet → route analyst/engineering/science/contable). `EmailInbox.tsx`: sección "📖 Mensajes del mundo vivo" que muestra los correos NPC pendientes (`events` con `correo`) sobre la bandeja de tareas. `staff/src/components/StudentsManager.tsx`: bloque "Mundo vivo · Crónica" en el modal de alumno con "Reproducir semilla" (`GET /api/staff/students/:id/story` — muestra arco, escena, NPCs con trust/nivel y semillas) + botón admin "Reset story" (`POST /api/staff/students/:id/reset-story`). `staff/src/lib/api.ts`: `getSimStudentStory`/`resetSimStudentStory`. Suite: root 169 tests / backend 70 tests.

**R-10 v2 — Plan (documentado 19-ago-2026, NO implementado aún)**: Sistema de 3 Etapas: **Etapa 1** Diagnóstico puro (pegar vacante → extracción IA de skills → prueba → `match_pct` + routing automático), **Etapa 2** Seguimiento de vacante (plan free = 2 simultáneas) con Modo A (≥75%, kit de postulación: CV a la medida + entrevista STAR + checklist) / Modo B (<75%, simulador intensivo con casos aplicados y reevaluación), **Etapa 3** Experiencia comprobable (densidad de experiencia vs años calendario, expediente R-08 como evidencia). **Hallazgos de auditoría (19-ago)**: las piezas que R-10 asumía "reutilizables" de R-09/R-08 NO existen — `aiProvider.ts`→real es `backend/src/providers/ai.ts` (Gemini `evaluateSubmission`), `simBlocks.ts` (nuevo registry), `CareerCenter.tsx` (nuevo, sobre CvBuilderSim+InterviewSim), `portfolio`→real es `expediente.ts`. Google Auth ya existe en `Login.tsx` (`signInWithOAuth google`). Plan por tareas: T1 auth+plans+RLS (`*_auth_plans.sql`, columna `plan` en profiles), T2 Etapa 1 (`vacancyAnalyzer.ts`/`matchScorer.ts`/`stageRouter.ts`, endpoints analyze/submit/reevaluate), T3 tracking+límite free (`vacancyTracker.ts`+`VacancyTracker.tsx`, tabla `vacancy_tracking`), T4 Modo A (`CareerCenter.tsx`), T5 Modo B (`intensivePlanner.ts` con 5 reglas de caso aplicado obligatorias + reevaluación), T6 Etapa 3 (`experienceDensity.ts`), T7 tests (`stage-routing`/`free-limit`/`intensive-cases`/`reevaluation`/`density`). Regla de oro R-09 se mantiene: números/match/densidad de motores o reglas; solo el texto de vacante usa IA con fallback determinístico.

**R-10 v2 — T1-T3 implementado (19-ago-2026)**: migración `20260819010235_auth_plans.sql` (aplicada a Supabase): `profiles.plan` (free|pro) + `profiles.experience_density`; tablas `vacancy_tracking` (límite free=2 activas, 402/409) y `stage1_assessments`, ambas RLS. Etapa 1: `backend/src/services/vacancyAnalyzer.ts` (IA Gemini con fallback determinístico por cláusula — required/weight por contexto "obligatorio/deseable"), `matchScorer.ts` (match ponderado por skill, `top_gaps`/`covered`, UMBRAL_MODO_A=75), `stageRouter.ts` (routing puro: requiere_experiencia && density<0.5 → ETAPA_3; match≥75 → MODO_A; else MODO_B), `stage1Service.ts` (analyze/submit/reevaluate con persistencia en `stage1_assessments` + memoria). Endpoints `POST /api/stage1/analyze|submit|reevaluate` (router `stage1.ts`). Tracking: `vacancyTracker.ts` (trackVacancy con límite free, setVacancyStatus, listVacancies, resetVacancyMem para tests) + `vacancies.ts` router (`GET /`, `POST /track`, `POST /:id/status`). UI: `alumnos/src/components/VacancyTracker.tsx` (app "🎯 Vacantes" en DesktopShell, todas las fases: progreso de status diagnostico→…→cerrada, contador activas/2, mensaje de upgrade al límite). Tests: `tests/stage-routing.test.ts` (12: routing 74/75/76, Etapa 3 con años sin densidad y Modo A con densidad alta, matchScorer gaps/covered, vacancyAnalyzer determinístico por cláusula) + `tests/free-limit.test.ts` (5: 2 OK, 3ª 402, cerrar libera, duplicado 409). Suite: root 186 tests / backend 70 / audit 68.

**R-10 v2 — T4-T6 implementado (19-ago-2026)**: `backend/src/services/simBlocks.ts` (registry skill→herramienta real: SQL→sql, Excel→spreadsheet, dbt→dbt, Python→notebook, ETL→pipeline, Airflow→airflow, BI→bi, Cloud→cloud, CFDI→accounting, Conciliación→banking, Nómina→spreadsheet, Fiscal/Contabilidad→accounting, Calidad→catalog, Incidentes→monitor; `getSimBlock`/`toolForSkill`). `backend/src/services/intensivePlanner.ts` (Modo B): genera un CASO APLICADO por cada gap del alumno con las 5 reglas obligatorias (a) contexto de negocio realista, (b) decisión multi-camino, (c) trampa/restricción oculta (de `TRAP_SCENARIOS`), (d) validable por motor, (e) reflexión "por qué decidiste así"; casos ENCADENADOS (resultado de uno alimenta el siguiente); `auditAppliedCase` verifica las 5 reglas. `backend/src/services/experienceDensity.ts` (Etapa 3): `density = 0.40·casos + 0.20·complejidad + 0.15·variedad + 0.15·incidentes + 0.10·resultados` (0-1), nivel novato→senior, `anos_equivalentes` (density 1 ≈ 3 años), evidencia para expediente R-08, narrativa "la experiencia no se mide solo en años". `backend/src/services/careerCenter.ts` (Modo A): kit de postulación — CV pitch a la medida de la vacante (prioriza fortalezas alineadas), checklist de aplicación, preguntas STAR sobre logros reales, evidencia del expediente R-08 (`buildExpediente`). Endpoints nuevos en `stage1.ts`: `POST /api/stage1/intensive` (plan intensivo desde gaps), `POST /api/stage1/kit` (kit Modo A), `POST /api/stage1/density` (cálculo de densidad). Tests: `tests/intensive-cases.test.ts` (8: 5 reglas por caso, encadenado, sin "ejecución básica", simBlocks registry) + `tests/density.test.ts` (6: densidad crece con casos no con tiempo ocioso, nivel, evidencia, acotada 0-1) + `tests/reevaluation.test.ts` (5: 74→B/75→A, umbral, Etapa 3 con falta densidad). Suite: root 205 tests / backend 70 / audit 104.

**R-10 v2 — Gaps de integración cerrados (19-ago-2026)**: el circuito Etapa 1→2→3 quedó conectado. **UI Diagnóstico**: tab `🔎 Diagnóstico` en `CareerCenter.tsx` — pegar vacante → `POST /api/stage1/analyze` (skills + match + routing) → prueba rápida de gaps → `POST /api/stage1/submit`. **Auto-track**: `submitStage1` llama `ensureTracked` → `trackVacancy` (modo A/B según routing + match_pct + stack); la vacante aparece sola en VacancyTracker. **Reevaluación**: `updateVacancyMode` (`vacancyTracker.ts`) actualiza modo/match de una vacante registrada; `reevaluateStage1` la dispara al migrar B→A; UI botones "Reevaluar" y "Reevaluar tras completar el plan". **Etapa 3 persistida**: `saveDensity` (`stage1Service.ts`) escribe `profiles.experience_density`; `/api/stage1/density` persiste. **Modo B abre herramienta real**: `CareerCenter` recibe `onOpenTool` y DesktopShell navega al screen real (SQLSim/DBTSim/…) desde cada caso. **`GET /api/stage1/assessments`** lista diagnósticos previos. Tests de integración en `stage-routing.test.ts` (updateVacancyMode B→A). Suite: root 207 tests / backend 70 / audit 104.

**R-11 — Flywheel de calidad (completo 19-ago-2026)**: capa transversal de mejora continua sobre R-09/R-10. Ciclo: `uso real → telemetría → agregación → insight → ticket → aprobación staff → contenido mejorado`. Plan completo en `docs/plan-r11.md`. **Hallazgos de auditoría**: `assessmentGenerator.ts`→real es `matchScorer.ts`+`stage1Service.ts`, `interviewEngine.ts`→real es `interview.ts`, `learningAnalytics.ts` y `piiScrubber.ts` son nuevos (creados). Modelo: migración `20260819020000_quality_flywheel.sql` — **`quality_events`** (telemetría; `sim_events` ya existía como event scheduler del mundo en `schema.sql`, se renombró para evitar colisión), item_stats, misconceptions, improvement_tickets, outcome_tracking, RLS, `user_hash` sha256 irreversible + salt, cero PII. Servicios: `backend/src/services/learningAnalytics.ts` (`userHash`, `ingestEvents` batch con scrub PII + gate de privacidad, `aggregateItems`, `detectMisconceptions` freq≥3, `createTicketsFromStats` umbrales fail_rate>0.7 & gain<0.2, `getQualityDashboard`, `persistItemStats`/`persistMisconceptions`, `setTicketStatus` gate staff, `recordOutcome`/`getOutcome` T6 consentido) y `backend/src/services/piiScrubber.ts` (`scrubText`/`scrubData`/`containsPII`/`dataContainsPII`: email/teléfono/RFC/CURP/CP/tarjeta/nombres). **Consumo (T5)**: `backend/src/services/qualityConsumption.ts` (`enrichFeedback` inyecta misconceptions aprobadas al feedback de validación, `getApprovedMisconceptions`, `coverageGap`, `drillFor`, `trapFromMisconception`); conectado en `workflows.ts` (enriquece feedback DE fallido), `reforzamiento.ts` (drills ajustados al error real aprobado) y `interview.ts` (pregunta sobre el error más frecuente). Emisión (T2): `POST /api/sim/telemetry` en `simEngine.ts`; `/api/workflows/validate` emite `task_fail`/`trap_missed`; `submitStage1`/`analyzeVacancyForUser` emiten preguntas fallidas y `vacancy_analyzed` (taxonomía); `completeScene` emite `case_pass`/`trap_missed`; Onboarding emite `consent_given` (consentimiento revocable). Endpoints staff en `staff.ts`: `GET /api/staff/quality`, `GET /api/staff/tickets`, `POST /api/staff/tickets/:id/approve|reject` (gate humano, nada se despliega sin esto), `DELETE /api/staff/users/:hash/data` (derecho al olvido). T6: `GET/POST /api/stage1/outcome` (resultados reales con consentimiento explícito, cierra el ciclo) + tab "🎯 Resultado real" en `CareerCenter.tsx`. Staff: `QualityPanel.tsx` como 4ª sección de `StaffControlCenter` (KPIs trampas/misconceptions/tickets, cola de mejora con aprobar/rechazar, patrón de errores reales, fail_rate/ganancia, bloque de privacidad). Tests: `tests/analytics.test.ts` (7) + `tests/consumption.test.ts` (7: coverageGap, drillFor umbral, trap sin cache, computeMatch gaps, refuerzo degradado, outcome consentido, hash irreversible). Suite: root **221** tests / audit **106** / backend tsc, staff y alumnos builds limpios. Regla de oro extendida: números/umbrales de motores o agregación de datos reales; solo se consume lo APROBADO por staff; nada se despliega sin gate staff + story-coherence.

**R-12 — Agente-automatizador de rutas y auto-extensión de motores (19-ago-2026)**: convierte una **vacante real** en una ruta SIMULAB v2 completa cableada a las 3 Etapas de R-10, y detecta/registra los **motores faltantes** para que el sistema los construya tras cada vacante. `backend/src/services/simulabFormat.ts` (formato estándar: `SimulabV2` con `analisis_requerimientos`, `motor_mapping` skill→taskType/validator/tool/golden, `engine_requirements`, etapas 1-3, `validateSimulabV2`, `simId`). `backend/src/services/engineCapabilities.ts` (registro `ENGINE_CAPABILITIES` que distingue **UI vs MOTOR**: `exists`/`extends`/`missing`; capacidades nuevas: Power BI/DAX, Pronóstico, n8n/Power Automate, APIs LLM, Agentes, Prompt engineering, ERP SAP/Oracle; backlog `ENGINE_BACKLOG` + `resolveCapability`/`registerEngineRequirement`/`pendingEngines` — auto-extensión por vacante). `backend/src/services/roadmapCompiler.ts` (agente: `analyzeVacancy` → `buildSkillProfile`+`computeMatch` → `routeStage` E1→E2/E3 → resuelve capacidades → registra motores faltantes → genera prueba de E1 y tickets de E2; REGLA DE ORO: match/golden/routing salen de los motores reales, el texto del doc es lo único heurístico). `vacancyAnalyzer` ampliado (detecta las nuevas skills: Power BI, Pronóstico, Automatización, APIs LLM, Agentes, Prompt, ERP) y `requires_experience = min_years >= 1` (un puesto que pide experiencia exige acreditar equivalencia → Etapa 3). Router `backend/src/routes/automator.ts`: `GET /api/automator/capabilities`, `GET /api/automator/pending-engines`, `POST /api/automator/compile` (vacante→ruta), `POST /api/automator/validate`, `POST /api/automator/backlog/clear|complete` (admin). Tests `tests/automator-routes.test.ts` (12: capacidades, detección de motores faltantes por vacante real CHRISTUS/Brick Walling, formato v2, compilación E1-E3, dedupe backlog). Suite: root **233** tests / audit **106** / backend tsc limpio.
