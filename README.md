# SIMULADOR LABORAL 3D — FinNova Academy

Prácticas profesionales simuladas de **Contabilidad** (ruta `practicas`) y carrera **Data**
(Analista → Ingeniería / Ciencia de Datos) en una oficina 3D con escritorio virtual,
motores de validación reales y mundo simulado coherente (HOY sim = **08-jul-2026**).

## Stack

| Capa | Tec |
|------|-----|
| Backend | Node.js + Express + TypeScript (`backend/`, puerto **3001**) |
| Alumnos | React 19 + Vite + Tailwind + React Three Fiber (`alumnos/`, puerto **3000**) |
| Staff | React + Vite (`staff/`, Centro de Control) |
| DB | Supabase (PostgreSQL, migraciones en `supabase/`) |

## Arranque local

```powershell
.\start-dev.ps1            # backend :3001 + alumnos :3000
npm run test               # suite raíz (vitest)
npm run audit:story        # auditoría de coherencia del mundo simulado
```

## Documentación

- **`docs/INDICE.md`** — mapa de toda la documentación (vigente vs histórica).
- **`agents.md`** — bitácora técnica acumulativa (arquitectura, R-07…R-15, decisiones).
- **`docs/world-bible.md`** — canon del mundo simulado (calendario, empresas, NPCs).
- **`docs/schema_db/`** — esquema de BD (solo lectura; los cambios van en `supabase/migrations/`).
- **`docs/backlog-futuro.md`** — módulos en pausa (R-10/R-11/R-12) y criterio de reactivación.
- **`docs/legacy/`** — planes ejecutados, QA cerrado e incidencias resueltas (histórico, no editar).

## Ramas y rutas

- `practicas` — Prácticas Profesionales de Contabilidad (6 módulos + tracker + cursos + pruebas).
- `data` — Árbol: Analista (raíz) → Ingeniería / Ciencia (desbloqueo al 40% de práctica, elección irreversible).
