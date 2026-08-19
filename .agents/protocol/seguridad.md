# Protocolo de Seguridad y Roles

## 1. Separación de portales

- `alumnos/` solo acepta `student`.
- `staff/` solo acepta `instructor` y `admin`.
- La app Android administrativa debe tratarse como interfaz de `admin` salvo ampliación explícita.

No mezclar accesos “por conveniencia” en UI.

## 2. Autenticación backend

- Endpoints protegidos usan `requireSupabaseAuth`.
- Endpoints públicos deben ser pocos y estar justificados.
- No confiar en el rol enviado por el cliente cuando el backend puede derivarlo del JWT.

## 3. Sandbox local

Los bypass de mock solo son válidos cuando:

- `ENABLE_DOCKER_MOCKS` está activo,
- y no se exige auth real con `REQUIRE_REAL_AUTH`.

Nunca documentar estos bypass como comportamiento de producción.

## 4. OTP, recuperación y contraseñas temporales

- OTP y `mustChangePassword` son parte del flujo operativo actual.
- Si se toca autenticación, revisar también recuperación y aprobación de cuentas.
- No dejar un camino donde una contraseña temporal pueda reutilizarse sin forzar cambio cuando el flujo lo exige.

## 5. Webhooks y firmas

- Webhooks n8n deben validar HMAC cuando el entorno no está en bypass local.
- La comparación de firmas debe seguir siendo segura en tiempo.
- Mantener control de idempotencia para `pipelineId`.

## 6. CORS y secretos

- Los orígenes permitidos salen de variables de entorno y localhost de desarrollo.
- No hardcodear secrets, tokens o keys reales.
- Revisar siempre `backend/src/server.ts` si una nueva superficie necesita acceso CORS.
