# Reglas de Seguridad

1. Toda ruta protegida debe derivar identidad y rol desde JWT o middleware, no desde el body.
2. No exponer secretos ni credenciales en código o docs.
3. Validar payloads mutables con `zod`.
4. Mantener separación estricta por rol entre alumnos, staff y admin móvil.
5. Revisar CORS cuando se agregue una nueva superficie cliente.
6. Conservar HMAC e idempotencia en webhooks n8n.
