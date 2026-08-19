# Flujos de Desarrollo y Pruebas

## Estructura de trabajo

No existe un único `npm run dev` en la raíz que represente todo el proyecto actual. El desarrollo se hace por superficie:

- `backend/`
- `alumnos/`
- `staff/`
- `app/`

## Variables de entorno relevantes

Las más importantes hoy son:

| Variable | Uso |
| --- | --- |
| `SUPABASE_URL` | Endpoint de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso admin del backend |
| `SUPABASE_JWT_SECRET` | Firma/validación de JWT HS256 |
| `ENABLE_DOCKER_MOCKS` | Activa fallback local y usuarios simulados |
| `REQUIRE_REAL_AUTH` | Obliga auth real |
| `GEMINI_API_KEY` | Evaluación IA y simulador |
| `N8N_WEBHOOK_SECRET` | Firma de webhooks y correo |
| `N8N_EMAIL_WEBHOOK_URL` | Salida de correos vía n8n |
| `ALUMNOS_URL` | CORS permitido del portal alumnos |
| `STAFF_URL` | CORS permitido del portal staff |
| `TTS_PROVIDER` | Selección de voz/TTS |
| `VIDEO_PROVIDER` | Selección del proveedor de video |

## Comandos por módulo

### Backend

```bash
cd backend
npm install
npm run dev
```

Otros scripts:

- `npm run start`
- `npm run build`

### Portal de alumnos

```bash
cd alumnos
npm install
npm run dev
```

Validación:

```bash
npm run lint
npm run build
```

### Portal de staff

```bash
cd staff
npm install
npm run dev
```

Validación:

```bash
npm run lint
npm run build
```

### Android

```bash
cd app
.\gradlew.bat assembleDebug
```

Para release o instalación, seguir el flujo específico del proyecto/dispositivo disponible.

## Docker Compose

[`docker-compose.yml`](file:///c:/Users/angel/Desktop/academicFinace/docker-compose.yml) levanta:

- PostgreSQL
- Redis
- backend

Uso típico:

```bash
docker-compose up -d --build
```

Nota: el compose refleja una estrategia de entorno local, pero parte del backend actual opera pensado para Supabase real. No asumir que PostgreSQL del compose reemplaza automáticamente toda la configuración de Supabase.

## Verificación mínima antes de cerrar trabajo

Para cambios web/backend:

```bash
cd backend && npm run build
cd alumnos && npm run lint && npm run build
cd staff && npm run lint && npm run build
```

Para cambios Android:

```bash
cd app
.\gradlew.bat assembleDebug
```

## Pruebas funcionales manuales recomendadas

### Alumno

1. login correcto,
2. acceso solo a rol `student`,
3. carga de cursos,
4. progreso de clip,
5. envío de ejercicio.

### Staff

1. login correcto,
2. denegación a roles no permitidos,
3. aprobación/rechazo de solicitudes,
4. CRUD de cursos o clips si fue afectado,
5. preguntas/respuestas si fue afectado.

### Android

1. login admin,
2. OTP,
3. carga de solicitudes,
4. aprobar/rechazar.
