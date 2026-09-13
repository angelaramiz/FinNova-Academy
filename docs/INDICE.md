# Índice de documentación — Simulador Laboral 3D

> Última reorganización: **12-sep-2026** (limpieza docs → `docs/legacy/`). Ver `docs/DELETION_LOG.md`.

## Documentos vigentes (`docs/`)

| Archivo | Categoría | Estado | Descripción |
|---------|-----------|--------|-------------|
| `world-bible.md` | Mundo vivo (canon) | ✅ Vigente | Calendario sim, empresas, eventos canónicos, NPCs. Espejo de `backend/src/data/worldBible.ts` |
| `guion-seguimiento-data.md` | Mundo vivo (canon) | ✅ Vigente | Árbol de rutas data + 3 arcos. **Lo lee `tests/story-coherence.test.ts` — no mover** |
| `backlog-futuro.md` | Roadmap | ✅ Vigente | R-10/R-11/R-12 en pausa autorizada; qué se conserva y criterio de reactivación |
| `plan-ingesta-datos-reales.md` | Propuesta | 📋 Pendiente | Diseño multi-fuente (CSV/Kaggle/API/BD/S3). No implementado |
| `schema_db/` | Referencia | ✅ Vigente | Backup legible del esquema Supabase (`esquema-base-datos.md` + `.sql`). Regla: el cambio real va en `supabase/migrations/` |
| `incidencias/` | Incidencias | 📂 Activas | Incidencias abiertas (vacío = ninguna). Las cerradas van a `legacy/incidencias-cerradas/` |

## Evidencia (se queda donde está)

- `demo-screenshots/`, `ruta-practicante/`, `test-cursos/`, `test-practica/`, `verificacion/` — capturas de QA/demos.
- `vacabtes prueba/PM.pdf` — vacante real de prueba (R-12).
- `android-app/README.md` — cómo compilar la app staff Android (colocado junto al código).
- `alumnos/src/data/capacitaciones/README.md` — módulo Capacitaciones Contalink (colocado junto a los datos).
- `roles/plan-de-rol.md` — plantilla viva: se genera antes de cada modificación compleja (regla en `agents.md`).

## Archivo histórico (`docs/legacy/`)

| Carpeta | Contenido | Por qué se archivó |
|---------|-----------|-------------------|
| `proyecto-original/` | README finmicro + análisis de coherencia + plan de pruebas local + plan de ejecución | Describen el proyecto anterior (micro-aprendizaje) o diagnósticos de ago-2026 ya resueltos; `agents.md` es la referencia actual |
| `planes-implementados/` | R-10 v2, R-11, R-12, capas-0, carrera-data, integración-prácticas, presentación-socios | Planes ejecutados al 100% (o pausados con resumen vigente en `backlog-futuro.md`); valor histórico |
| `qa-historico/` | `qa-capa0-2026-08-26.md` (plan + ejecución + re-validación consolidados) | QA del 26-ago cerrado con GO; fusionado de 2 archivos en 1 |
| `incidencias-cerradas/` | R14-001 + auditoría módulos 2-6 | Bugs corregidos (R-14, ago-2026) |
| `simulab-v2-pausado/` | Prompt SIMULAB v2 + ejemplo encargado-almacén + `roadmaps/` | R-12 en pausa (ver `backlog-futuro.md`); el registro vigente vive en código (`engineCapabilities.ts`) |

**Regla:** nada en `legacy/` se edita. Si un tema se reactiva, se crea un documento nuevo en `docs/` que lo referencie.
