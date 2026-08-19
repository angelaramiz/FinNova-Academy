# Bitácora de Memoria del Agente (`memory_logs.md`)

Este archivo sirve como registro histórico vivo y diario de trabajo. Cada agente de codificación de Inteligencia Artificial que inicie sesión en este proyecto debe leer las entradas previas antes de realizar cambios y documentar sus propias modificaciones al finalizar la sesión.

---

## 🗒️ Registro de Sesiones

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
