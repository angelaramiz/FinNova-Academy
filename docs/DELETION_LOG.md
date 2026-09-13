# Code Deletion Log

## [2026-09-12] Limpieza de documentación (Refactor Clean)

Objetivo: compactar la documentación por categoría y archivar lo antiguo/desactualizado
en `docs/legacy/`. **Cero borrado de contenido**: todo se movió con `git mv` (historial
preservado) salvo 1 fusión (2 archivos → 1 con contenido intacto).

### Archivos movidos a `docs/legacy/proyecto-original/` (desactualizados)
- `README.md` → `proyecto-original/README-original-finmicro.md` — describía otro proyecto
  (plataforma de micro-aprendizaje: VideoFeed, ExerciseBlock, webhooks n8n). Reemplazado por
  un README nuevo acorde al Simulador Laboral 3D.
- `analisis-mejoras-coherencia.md` — diagnóstico del 09-ago-2026 (doble calendario, roles);
  causas ya resueltas por R-09/R-15.
- `plan-de-pruebas-local.md` — plan manual del 09-ago (32 KB, credenciales/puertos viejos).
- `plan-ejecucion.md` — tracker de ejecución del 12-ago (todo COMPLETADO, superado por `agents.md`).

### Archivos movidos a `docs/legacy/planes-implementados/` (valor histórico)
- `plan-r10-v2.md`, `plan-r11.md`, `plan-r12.md` — implementados y luego pausados;
  el estado vigente vive en `docs/backlog-futuro.md`.
- `plan-capas-0-ecosistema.md`, `plan-carrera-data-completa.md` — IMPLEMENTADOS (R-15).
- `plan-integracion-practicas-realista.md` — implementado (R-14).
- `plan-presentacion-socios-practicas.md` — guion de demo única (20-ago-2026).

### Consolidación QA → `docs/legacy/qa-historico/qa-capa0-2026-08-26.md`
- `plan-qa-produccion-capa0.md` + `reporte-qa-capa0-ejecucion.md` → **1 archivo**
  (Parte 1 plan + Parte 2 ejecución + Parte 3 re-validación, contenido intacto).
- Originales eliminados con `git rm` (única eliminación real de la sesión).

### Archivos movidos a `docs/legacy/incidencias-cerradas/` (bugs corregidos)
- `incidencias/R14-001-datos-clave-revela-respuestas.md` — corregido en R-14 (26-ago).
- `audit-modulos-practicas.md` — auditoría módulos 2-6 (ago-2026).

### Archivos movidos a `docs/legacy/simulab-v2-pausado/` (R-12 en pausa)
- `prompt-vacante-simulab-v2.md`, `simulab-v2-guess-encargado-almacen.json`, `roadmaps/`
  (3 JSON). El registro vigente vive en código (`engineCapabilities.ts`).

### Archivos creados
- `README.md` (nuevo, raíz) — descripción actual del proyecto + mapa de docs.
- `docs/INDICE.md` — índice por categoría (vigente / evidencia / legacy + regla de no-edición).
- `docs/DELETION_LOG.md` — este archivo.

### Referencias actualizadas (para no romper links)
- `agents.md:408` — 3 rutas → sus ubicaciones en `legacy/`.
- `tests/simulab-prompt.test.ts:2` — comentario → nueva ruta del prompt.

### NO tocados (referencias vivas o colocados junto al código)
- `docs/guion-seguimiento-data.md` — lo lee `tests/story-coherence.test.ts`.
- `docs/world-bible.md`, `docs/backlog-futuro.md`, `docs/plan-ingesta-datos-reales.md` —
  referenciados por `agents.md` / `.agents/`.
- `docs/schema_db/`, `roles/plan-de-rol.md` (regla viva), `android-app/README.md`,
  `alumnos/src/data/capacitaciones/README.md`, screenshots y `vacabtes prueba/PM.pdf`.
- `.agents/` — sistema activo de agentes, fuera del alcance de esta limpieza.

### Impacto
- Raíz: 4 `.md` sueltos → 2 (`README.md`, `agents.md`).
- `docs/`: 15 `.md` sueltos → 5 vigentes (`world-bible`, `guion`, `backlog-futuro`,
  `plan-ingesta`, `INDICE`) + `schema_db/` + `incidencias/` + `legacy/`.
- Archivos movidos: 17 · Fusionados 2→1 · Eliminados (tras fusión): 2 · Creados: 3.
- Contenido perdido: ninguno.

### Testing
- [ ] `npm run test` — debe seguir verde (solo se movieron `.md`; el único test que lee
  docs usa `guion-seguimiento-data.md`, intacto en su ruta).
- [ ] `npm run audit:story` — idem.
- [ ] Verificación pendiente de ejecutar por el usuario (cambios sin commit).
