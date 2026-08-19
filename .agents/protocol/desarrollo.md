# Protocolo de Desarrollo y Arquitectura

## 1. Fuente de verdad por capa

- API y lógica de negocio: `backend/`
- Portal estudiantes: `alumnos/`
- Portal staff: `staff/`
- App administrativa: `app/`
- Persistencia estructural: `supabase/schema.sql`
- Sandbox y fallback: `backend/src/lib/memoryDb.ts`

## 2. Cambios de datos

Si cambia el modelo persistente:

1. actualizar `supabase/schema.sql`,
2. revisar seed si aplica,
3. revisar mapeos de `backend/src/lib/memoryDb.ts`,
4. revisar serialización entre snake_case y camelCase en routers.

## 3. Backend con Supabase y fallback

Regla por defecto:

- cuando ya existe patrón `isSupabaseReady()`, conservarlo;
- cuando una ruta solo opera en un modo, documentar el motivo si se amplía o se limita.

No introducir una ruta nueva que rompa el modo sandbox sin necesidad explícita.

## 4. Integraciones externas

Al tocar una integración, revisar su capa completa:

- IA: `providers/ai.ts`
- correo: `providers/email.ts` + `lib/emailQueue.ts`
- TTS: `providers/tts.ts`
- video: `providers/video.ts`
- n8n: `webhooks/n8n.ts`

## 5. Frontends separados

- No compartir por copia manual lógica entre `alumnos/` y `staff/` si se puede mantener con cambios simétricos y explícitos.
- Si cambias contratos API, revisar ambos clientes web y también `app/` si consume esa ruta.

## 6. CodeGraph

Como el repo tiene `.codegraph/`, usar CodeGraph para preguntas de estructura, flujo o blast radius antes de una exploración amplia.

Uso recomendado:

- MCP `codegraph_explore`
- o CLI `codegraph explore "<consulta>"` si está disponible localmente

## 7. Documentación viva

Si el cambio altera arquitectura, flujos o convenciones, actualizar:

- `system_architecture.md`
- `project_overview.md`
- `development_workflows.md`
- `rules/` o `protocol/` si aplica
