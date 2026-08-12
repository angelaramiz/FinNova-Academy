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

**Tests de motores DE (12-ago-2026)**: `tests/de-motors.test.ts` importa el motor dbt real del frontend (`compileModelSql`, `SOURCES`, `MODELS`, `topoOrder` de `alumnos/src/components/DBTSim.tsx`) y verifica la compilación staging→intermediate→marts, el total del mart (128350) y el orden topológico. Suite completa: root 79 tests / backend 70 tests.

**Persistencia del progreso (12-ago-2026)**: `backend/src/services/progressTracker.ts` ahora es async y persiste las completaciones en Supabase (tabla `sim_progress`, migración `supabase/migrations/20260812092933_persist_sim_progress.sql`, PK user_id+specialty, RLS, **aplicada al proyecto activo**) con fallback a memoria. Endpoints `/api/sim/progress/*` usan `await`. `staff.ts` lee `sim_progress` para el resumen de alumnos.

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
