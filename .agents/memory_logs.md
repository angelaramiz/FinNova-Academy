# Bitácora de Memoria del Agente (`memory_logs.md`)

Este archivo sirve como registro histórico vivo y diario de trabajo. Cada agente de codificación de Inteligencia Artificial que inicie sesión en este proyecto debe leer las entradas previas antes de realizar cambios y documentar sus propias modificaciones al finalizar la sesión.

---

## 🗒️ Registro de Sesiones

### 📅 Sesión: 2026-08-26
* **Agente**: Muse Spark (opencode) — sesión R-14/R-15, Capa 0 + Ecosistema
* **Objetivo de la Sesión**: (1) Corregir la integración práctica R-14 (INC-001 auto-aprueba en `business_expense`, INC-002 nómina 15% fijo) y dejarla verificada en producción; (2) completar la carrera data (de 12 a 19 motores) y (3) aplicar el plan `plan-capas-0-ecosistema.md` (Capa 0 fundamentos por herramienta + Capa 1 ecosistema por rama) al pie de la letra y validarlo sin fugas.
* **Acciones Realizadas**:
  * **Integración práctica R-14 (auditada en profundidad en 6 módulos)**:
    * Auditados `mod-cfdi` (invoice_emission OK), `mod-gastos`→`business_expense` **corregido**: de 6 filas con validación sobre filas calculadas (nunca enviadas → `maxPossible=0 → passed=true`, auto-aprueba) a **9 filas editables** (`Empresa/RFC/Folio/Subtotal/Propina + IVA/Total/Deducible/Acreditable`) con validación real 9 reglas; doc der. pasa a **ticket real** La Parrilla LPN-880707-ABC con `→ campo X`.
    * Reescritos `payroll` (de 15% fijo a **tarifa progresiva** `0–6k:0, 6k–30k:115.2+6.4%, 30k+:1651.2+10.88%`, 19 filas por empleado `bruto/ISR/IMSS/neto + totales`) y `bank_reconciliation`/`cash_cut` (editables + validación real por campo). **Guías dedicadas** añadidas para **todos los campos** de los 6 módulos (invoice 9, payment 5, supplier 7, business_expense 10+ticket-extract, payroll 5, bank 5; `GuideBubbles` inline split `ticketGuides/formGuides`).
    * **Comprobación de tarea** en `tests/practicas-modules.test.ts` (“COMPROBACIÓN DE TAREA” — módulo↔actividad, no-auto-aprueba, payroll tarifa). Suite 282 tests.
    * Verificado en prod: `my-profile→practicas/Practicante` (hereda de DB), `SimuladorLaboral.checkOnboarding` sync de `selectedJob`, payroll ISR tarifa (Ana 1331…), `bank_reconciliation`/`cash_cut` editables, frontend BOqFr3Pz inline.
  * **R-15 Carrera data completa (7 motores avanzados)**:
    * Creado `advancedDataEngines.ts` (validadores `excel/dax/forecast/automation/llm_api/agent/prompt` + 7 workflows con tipo `advanced`, golden `MART 128350`), cableado en `workflows.ts` (`advancedTypes` + fallback `/validate` para evitar 0/0), `engineCapabilities.ts` (los 7 a `exists`), `taskPlanner` (`ADVANCED_WEEKS` por rama + `FUNDAMENTALS_WEEKS`/`ECOSYSTEM_WEEKS` en `generateMonthPlan` con `merge()` para no sobrescribir semanas), `specialties.ts` (15 tipos). Frontend: `PowerBISim`/`ForecastSim`/`AutomationSim`/`AgentSim`/`PromptSim` + `renderTool` + apps por fase + `DE/ANALYST/DS_SLOTS`. `SpreadsheetSim` extendido con `XLOOKUP/BUSCARX/SUMIFS/COUNTIFS/UNIQUE/FILTER` (Bloque 6 VBA→Modelo de Datos Power Pivot/DAX).
    * **Fixes de corrección detectados en re-validación**: `renderTool` sin `case excel`→`SpreadsheetSim`, `/validate` sin fallback `advancedTypes` (auto-aprueba), accented field-keys (`Fórmula/Parámetros`) vs PowerShell encoding. Suite 295 tests / audit 106 / build limpios.
  * **Capa 0 + Ecosistema 3×2 (este plan)**:
    * `fundamentals.ts` (12 `*_basico` + 3 `ecosistema_*` con `FUNDAMENTAL_TYPES`/`getFundamentalWorkflow`, validadores `bi`/`basic_read`+`concept` en `deValidation.ts`), `FUNDAMENTALS/ECOSYSTEM_WEEKS` por rama, `?route` en `task-plan`/`today-tasks`/`week-tasks` (`simEngine.ts`), `sims.total`/`cases.total` derivados del plan (no hardcodeados 8/3) y `countsAsCase` persistido (DesktopShell→`progress/record`→`recordCompletion`), `ECOSYSTEM_SLOTS` + `renderTool` `stats/ml/monitor`, `docs/simulab-v2-guess-encargado-almacen.json` (c/buildPlan densidad, cierre por criterio, oral 5m). Verificado prod: `task-plan?route=analyst` lista fundamentos→ecosistema, `excel_basico`/`bi_basico` 10/10.
  * **Planes de ingesta real y QA**: `docs/plan-ingesta-datos-reales.md` (motor `real_ingest` en backlog) y `docs/plan-qa-produccion-capa0.md` (bloques A–H, Chrome DevTools). Ejecución QA A–H **PASS** (re-validación detectó y corrigió 3 bugs; ver `reporte-qa-capa0-ejecucion.md`). Bundle `89mSrKRo` verificado.
  * **Documentación**: ampliado `project_overview.md` con simulador 3D + 3 especialidades + ciclo contable + Capa 0/Ecosistema + métrica; `system_architecture.md` con backend (8 dominios), `alumnos` (14 Sims + 5 avanzados), persistencia dual, integraciones; `agents.md` (R-14/R-15). Fix `.agents/README.md` no se usa como memoria viva (fuente es `agents.md` + `.codegraph`).
* **Decisiones Importantes**:
  * Capa 0 = fundamentos por herramienta (mini-módulos, cierre por criterio, `NOT countsAsCase` pero `sims.validated`) → Capa 1 = ecosistema (countsAsCase) → Capstone. Por cada rama DA/DE/DS. `fundamentals` usa `concept` (keyword por herramienta) y `validateConcept` lee el `rule.field` real para evitar desalineación field↔validator; + `bi`/`basic_read` para BI/monitor. Ecosistemas alinean claves a validadores advanced.
  * Regla de oro R-09 intacta: `lore` variable, números/golden siempre de motores. `workflowStore` TTL 30m cohere GET→validate.
* **Siguientes Pasos Recomendados**:
  * Implementar `ingestService` (`real_ingest`) y un primer motor de Capa 0 con dataset pre-cargado (ej. excel_básico con 200 filas en `SpreadsheetSim`) para que la hoja no quede vacía al abrir la herramienta.
  * Añadir `input.md` con el objetivo actual y `tasks.md` con los pendientes reales (ERP `missing` único pendiente data).

### 📅 Sesión: 2026-07-03
* **Agente**: Codex
* **Objetivo de la Sesión**: Actualizar la documentación y memoria operativa del proyecto para alinearla con la estructura real del repositorio.
* **Acciones Realizadas**:
  * **Realineación de documentación núcleo**:
    * Actualizados [`README.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/README.md), [`project_overview.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/project_overview.md), [`system_architecture.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/system_architecture.md), [`coding_standards.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/coding_standards.md) y [`development_workflows.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/development_workflows.md).
    * La documentación dejó de describir el monolito inicial y ahora refleja el estado actual con `backend/`, `alumnos/`, `staff/` y `app/`.
  * **Actualización de protocolos y reglas**:
    * Ajustados los archivos en [`protocol/`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/protocol/) y [`rules/`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/rules/) para incluir separación real de superficies, fallback Supabase/MemoryDatabase, uso de CodeGraph y control de roles/OTP.
  * **Actualización de operación del agente**:
    * Revisados [`tasks.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/tasks.md), [`input.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/input.md), [`commands/`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/commands/), [`roles/`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/roles/) y los README de `history/`, `skills/` y `suggestions/`.
  * **Ajuste de `.codegraph/`**:
    * Preparada la carpeta local de CodeGraph para poder documentar su uso sin perder el comportamiento de ignore en Git.
* **Decisiones Importantes**:
  * La memoria del proyecto debe tratar a `backend/`, `alumnos/`, `staff/` y `app/` como arquitectura oficial vigente.
  * n8n y algunas áreas de pipeline deben documentarse como integración parcial/simulada donde todavía no exista un flujo productivo cerrado.
* **Siguientes Pasos Recomendados**:
  * Consolidar el workflow real de n8n y reflejarlo tanto en código como en `agent_memory/`.
  * Endurecer la documentación y el esquema real de Supabase para auth, solicitudes y cola de correos.

### 📅 Sesión: 2026-06-17
* **Agente**: Antigravity
* **Objetivo de la Sesión**: Resolver problemas de sintaxis y compilación en los componentes de inicio de sesión de alumnos/staff y validar de extremo a extremo el flujo de registro, aprobación, cambio forzado de contraseña y código OTP.
* **Acciones Realizadas**:
  * **Corrección de Componentes de Inicio de Sesión**:
    * En [`alumnos/src/components/Login.tsx`](file:///c:/Users/angel/Desktop/academicFinace/alumnos/src/components/Login.tsx): Corregido el cierre del bloque de `handleSelectMock` que causaba la anidación errónea del `return` principal. Agregados los iconos `Sparkles` y `Lock` a la importación de `lucide-react`.
    * En [`staff/src/components/Login.tsx`](file:///c:/Users/angel/Desktop/academicFinace/staff/src/components/Login.tsx): Se aplicó la misma corrección de llave en `handleSelectMock`, eliminando además brackets duplicados/huérfanos al final del archivo. Agregados los iconos `Sparkles` y `Lock`.
  * **Corrección de Diseño en Layout de Staff**:
    * En [`staff/src/App.tsx`](file:///c:/Users/angel/Desktop/academicFinace/staff/src/App.tsx): Protegido el bloque de información del usuario en el header con un condicional `{profile && ( ... )}` para evitar que falle al renderizar páginas públicas sin sesión activa, resolviendo el crash en la ruta `/register`.
  * **Verificación de Compilación**:
    * Se compiló estáticamente tanto en `alumnos/` como en `staff/` usando `npx tsc --noEmit` de forma exitosa.
  * **Validación de Flujos**:
    * Se creó un script de prueba automatizado `scratch/test_flow.js` y `scratch/test_otp.js` para simular y validar con éxito cada API contra el servidor en memoria (solicitud de registro -> aprobación -> inicio con contraseña temporal -> cambio obligatorio -> login de segundo factor -> OTP simulado).
* **Siguientes Pasos Recomendados**:
  * Implementar las pestañas solicitadas para instructores (Atención al Alumno estilo chat-whatsapp por lección, y administración de Cuentas/Cursos con diseño tipo carpetas).
  * Continuar expandiendo la base de datos simulada en memoria conforme se introduzcan más funcionalidades interactivas de alumnos.

### 📅 Sesión: 2026-06-08
* **Agente**: Antigravity
* **Objetivo de la Sesión**: Analizar a profundidad el proyecto y crear el sistema de memoria para agentes de desarrollo.
* **Acciones Realizadas**:
  * **Análisis de Infraestructura**: Se auditó [`vite.config.ts`](file:///c:/Users/angel/Desktop/academicFinace/vite.config.ts) para comprender el cargador dinámico de API Express (`express-api-plugin`).
  * **Análisis del Backend y Seguridad**: Se revisó la autenticación JWT y sandbox fallback en [`src/middleware/auth.ts`](file:///c:/Users/angel/Desktop/academicFinace/src/middleware/auth.ts) y la verificación criptográfica HMAC con firmas de tiempo seguras e idempotencia en [`src/webhooks/n8n.ts`](file:///c:/Users/angel/Desktop/academicFinace/src/webhooks/n8n.ts).
  * **Análisis del Modelo de Datos**: Se mapeó la base de datos simulada en memoria ([`src/lib/memoryDb.ts`](file:///c:/Users/angel/Desktop/academicFinace/src/lib/memoryDb.ts)) y el esquema PostgreSQL de Supabase ([`supabase/schema.sql`](file:///c:/Users/angel/Desktop/academicFinace/supabase/schema.sql)).
  * **Creación de la Carpeta de Memoria (`agent_memory/`)**:
    * Creado [`agent_memory/README.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/README.md): Establece las pautas generales y el protocolo de uso obligatorio de la memoria.
    * Creado [`agent_memory/project_overview.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/project_overview.md): Mapea casos de uso y modelos/atributos de datos (Clips, Courses, Attempts, etc.).
    * Creado [`agent_memory/system_architecture.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/system_architecture.md): Documenta la comunicación Vite/Express, capa de proveedores desacoplados y validación HMAC.
    * Creado [`agent_memory/coding_standards.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/coding_standards.md): Define las normas de estilo de Tailwind CSS v4, animaciones, tipado de TypeScript y logging estructurado en Express.
    * Creado [`agent_memory/development_workflows.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/development_workflows.md): Detalla scripts npm, docker-compose, configuración de variables de entorno y pruebas en sandbox.
    * Creado [`agent_memory/memory_logs.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/memory_logs.md): Esta bitácora interactiva inicializada con la primera entrada.
* **Siguientes Pasos Recomendados**:
  * Para cualquier tarea futura de desarrollo, modificación de frontend o backend, leer primero el [`agent_memory/README.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/README.md) y seguir las pautas de estilo de [`agent_memory/coding_standards.md`](file:///c:/Users/angel/Desktop/academicFinace/agent_memory/coding_standards.md).
  * Mantener esta bitácora actualizada con la fecha, cambios clave y decisiones de diseño al cerrar cada sesión.
