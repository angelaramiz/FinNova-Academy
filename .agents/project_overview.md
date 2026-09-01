# Descripción General del Proyecto

`academicFinace` es una plataforma de educación financiera con operación multi-superficie. El sistema combina aprendizaje en clips cortos, ejercicios evaluados, gestión académica de cuentas y una capa administrativa separada.

## Superficies activas del producto

### 1. Portal de alumnos

- Inicio de sesión para perfiles `student`.
- Consumo de cursos y clips aprobados.
- Seguimiento de progreso por clip y curso.
- Resolución de ejercicios con retroalimentación y puntos.
- Utilidades extra visibles en UI, como exportación de CV y laboratorio/simuladores.

### 2. Portal de staff

- Inicio de sesión para perfiles `instructor` y `admin`.
- Panel de instructores para:
  - gestionar cursos y clips,
  - responder dudas de alumnos,
  - revisar items de pipeline.
- Panel de administración para:
  - aprobar o rechazar solicitudes de cuenta,
  - administrar correos permitidos,
  - revisar usuarios y cambiar rol/KYC,
  - operar recuperación de acceso.

### 3. App Android administrativa

- Login de administradores.
- Verificación OTP.
- Gestión de solicitudes de registro.
- Polling con WorkManager para notificaciones de nuevas solicitudes.

## Actores del sistema

### `student`

- Consume cursos publicados.
- Completa clips y ejercicios.
- Acumula `pointsEarned`.
- Puede generar preguntas para instructores.

### `instructor`

- Crea y edita cursos.
- Gestiona clips, estructura y material.
- Responde preguntas de estudiantes.
- Revisa pipelines automatizados.

### `admin`

- Aprueba cuentas y restablecimientos.
- Administra el directorio de correos permitidos.
- Puede mutar roles y estados de verificación.
- Opera desde web y desde Android.

## Modelo de datos operativo

El proyecto funciona en dos modos:

1. Supabase/Postgres cuando hay credenciales reales.
2. `MemoryDatabase` en [`backend/src/lib/memoryDb.ts`](file:///c:/Users/angel/Desktop/academicFinace/backend/src/lib/memoryDb.ts) como sandbox y fallback local.

El esquema persistente base vive en [`supabase/schema.sql`](file:///c:/Users/angel/Desktop/academicFinace/supabase/schema.sql).

## Entidades importantes

### `profiles`

- Identidad del usuario.
- Rol: `student`, `instructor`, `admin`.
- Puntos de gamificación.
- En el flujo actual también se usan campos operativos como OTP y `mustChangePassword`.

### `allowed_emails`

- Directorio de cuentas autorizadas.
- Se usa en altas controladas por administración.
- Relaciona email, nombre y rol esperado.

### `account_requests`

- Solicitudes de alta y solicitudes de recuperación de acceso.
- Estados: `pending`, `approved`, `rejected`.
- En la práctica soporta también casos especiales como `PASSWORD_RESET`.

### `courses`

- Unidad principal de agrupación académica.
- Incluye dificultad, categoría, ruta de aprendizaje y publicación.

### `clips`

- Lecciones individuales asociadas a un curso.
- Incluyen URL de video, duración, orden, sección y formato.
- El estado operativo visible es `draft`, `reviewing`, `approved`.

### `exercises`

- Evaluaciones ligadas a clips.
- Tipos: `multiple_choice`, `formula`, `ratio_calculation`, `portfolio_weight`.
- Pueden usar rúbricas para evaluación híbrida.

### `exercise_attempts`

- Historial de intentos por estudiante.
- Guarda score, tipo de evaluación y feedback.

### `user_progress`

- Registro de visualización y completitud por clip.
- Alimenta el porcentaje de avance del curso.

### `pipeline_reviews`

- Cola/revisión de materiales generados o simulados por pipeline.
- Estados: `pending_ingredients`, `tts_generated`, `video_composited`, `awaiting_approval`, `approved`, `rejected`.

### `student_questions`

- Canal de preguntas de alumno hacia instructor.
- Incluye reply opcional y timestamps de respuesta.

## Situación real del proyecto

La documentación antigua describía una única SPA con backend embebido en Vite. El estado real ya no es ese: el backend está separado, hay dos frontends web independientes y existe una app Android de administración. **Además, el dominio central es el SIMULADOR LABORAL 3D** (no solo clips/cursos).

### Simulador Laboral 3D — Especialidades y flujos vigentes (2026-08)

| # | Especialidad | Empresa | Stack / Empresa |
|---|-------------|---------|-----------------|
| 1 | Contador General Junior | Logística del Norte S.A. | Odoo, Excel, CFDI 4.0, SAT |
| 2 | Ingeniero de Datos Jr | DataFlow Analytics (CDMX) | Foundry, SQL, Python, AWS (S3/Redshift/Airflow) |
| 3 | **NUEVA** `practicas` — Prácticas Profesionales | Logística del Norte (conta. guiada) | Módulos por pasos (`mod-cfdi`…`mod-cierre`), burbujas Guía por campo |

**Flujo contable (12 workflows + 1 nuevo `business_expense`)**: invoice_emission, payment_registration, supplier_invoice, bank_reconciliation (con trampa cheque $3,500), payroll (tarifa progresiva, no 15% fijo), journal_entry (depreciación), business_expense (ticket restaurante La Parrilla LPN-880707-ABC), etc. Cada workflow tiene `Guides` por campo y validación con `workflowId` + `workflowStore` (TTL 30m) para coherencia GET→validate.

**Flujo Data Engineering (Analista → Ingeniería / Ciencia)**: árbol de rutas `careerPath.ts` (`practicePct=0.45*tasks+0.35*sims+0.20*cases`, desbloqueo 40, irreversible). Apps por fase: Analista (SQL/Notebook/Catalog/BI/Excel/Stats/ML), Ingeniería (Foundry/dbt/Airflow/Cloud/Git/BI/ApiClient/DataOps + n8n/LLM/Agente), Ciencia (Forecast/Prompt). **R-15** añade 7 motores avanzados: Excel avanzado (XLOOKUP/UNIQUE/FILTER,pivot), Power BI/DAX (CALCULATE/SUMX sobre 128350), Pronóstico (media móvil/MAPE), n8n, APIs LLM, Agentes, Prompt — todos cableados como `exists` en `engineCapabilities.ts` (quedó `erp` como único `missing`).

**Prácticas profesionales — Capas 0 + Ecosistema (R-15)**: cada especialidad tiene una **Capa 0** de fundamentos por herramienta (15 mini-módulos, cierre por criterio, `NOT countsAsCase` pero cuenta como `sims.validated`) → **Capa 1 Ecosistema** (herramientas juntas, `countsAsCase`) → Capstone. Por rama: DA (excel→sql→catalog→bi), DE (python→foundry→airflow→git→monitor), DS (stats→ml→metricas). Métrica `computePracticeBreakdown` ya no es hardcodeada (8/12/3) sino derivada del plan real; `task-plan`/`today-tasks` leen `?route` para filtrar por rama.

### Simulador como máquina de estado vivo (R-09)
`worldBible.ts` + `storyArcs.ts` (8 arcos por ruta, 9 checks `storyCoherence.ts`: `goldenFromEngine` 128350, `balancedEntry`, `slaConsistent`, etc.) + `caseGenerator.ts` (seed `hash(userId:weekKey:arcId)`, PRNG mulberry32, auditCase) + `chronicle.ts`/`storyState.ts` persistidos en `sim_story`. La Oficina 3D (`SimuladorLaboral.tsx`, React Three Fiber) muestra el banner de arco/es/cena y el Documento real (La Parrilla LPN) vs el portal Odoo.

Toda nueva documentación debe partir de esta realidad.
