# Guion de Seguimiento — Especialidad Data (Árbol de Rutas)

> Calendario simulado: HOY = miércoles 08-jul-2026 · Runs Airflow: 03→08 jul.
> Fuente técnica: `backend/src/data/storyData.ts`. Auditoría: `tests/story-coherence.test.ts`.

## Árbol de Rutas

```
          [ ANALISTA DE DATOS ]         ← nodo raíz (entrada única)
           /              \
[ INGENIERÍA DE DATOS ]   [ CIENCIA DE DATOS ]
    (ya existe)              (nueva)
```

- Ingreso siempre como **Analista de Datos**.
- Al alcanzar `UNLOCK_PCT = 40` (`practicePct >= 40`) se desbloquean **ambas** ramas.
- La elección es **irreversible** para el alumno (solo staff puede resetear).

## Arco Analista (semanas 1–2) — llegada, acceso al mart, primera alerta

| Scene | Fecha sim | NPC | Dataset | Tarea |
|-------|-----------|-----|---------|-------|
| `ana-llegada` | 01-jul | Ing. Sandra Mora | raw_ventas | sql_query |
| `ana-mart` | 02-jul | Ing. Sandra Mora | mrt_ventas_por_cliente | sql_query |
| `ana-alerta` | 03-jul | Sistema de Monitoreo | stg_clientes | data_quality |
| `ana-profile` | 06-jul | Ana García (Analista) | int_ventas_cliente | sql_query |

## Arco Ingeniería (semana 4) — incidente del 05-jul

| Scene | Fecha sim | NPC | Dataset | Tarea |
|-------|-----------|-----|---------|-------|
| `eng-incidente` | 05-jul | Sistema de Monitoreo | mrt_ventas_por_cliente | incident_recovery |
| `eng-dag` | 06-jul | Ing. Sandra Mora | raw_ventas | airflow_dag |
| `eng-pipeline` | 07-jul | Ing. Sandra Mora | stg_ventas | etl_pipeline |
| `eng-review` | 08-jul | Ing. Sandra Mora | stg_ventas | code_review |

**Coherencia de mundo**: el incidente `lno_sales_pipeline` del 05-jul
(`dbt_test` / `positive(total_ventas)`, SLA mart incumplido) degrada las
features del caso de Ciencia → coherencia cruzada con el Arco Ciencia.

## Arco Ciencia — caso churn de Comercial del Norte

| Scene | Fecha sim | NPC | Dataset | Tarea |
|-------|-----------|-----|---------|-------|
| `sci-churn` | 07-jul | Ing. Sandra Mora | int_ventas_cliente | eda_churn |
| `sci-baseline` | 08-jul | Ing. Sandra Mora | int_ventas_cliente | modelo_baseline |
| `sci-eval` | 08-jul | Ing. Sandra Mora | mrt_ventas_por_cliente | eval_metricas |

**Coherencia**: las features del churn se degradan por el incidente 05-jul;
evaluar contra el mart **recuperado** (`recovered`).

## Reglas de auditoría (`npm run audit:story`)

1. Toda tarea data de `taskPlanner` tiene `sceneId` existente en `storyData`.
2. Fechas de escena dentro del calendario sim y coherentes con runs 03→08 jul.
3. `dataset` referenciado existe en `SOURCES/MODELS` de `DBTSim.tsx`.
4. NPC correcto por rama (Sandra Mora en data; Lic. Gómez exclusivo de contabilidad).
5. Tareas analistas no aparecen en agendas de rama elegida (y viceversa).
6. `practicePct` no cambia al activar demo override (inmutable).
7. Apps contables jamás visibles en cualquier estado data (regresión FALLA #1).
