# World Bible — Simulador Laboral (R-09 "Lore vivo")

> Fuente técnica: `backend/src/data/worldBible.ts` · Arcos: `backend/src/data/storyArcs.ts`
> Auditoría: `backend/src/services/storyCoherence.ts` + `tests/story-coherence.test.ts`
> Regla de oro: **el lore puede variar; los números, fechas y validaciones NO.**

## Calendario simulado

| Campo | Valor |
|-------|-------|
| HOY sim | `2026-07-08` (miércoles) |
| Ventana | `2026-07-01` .. `2026-07-31` |
| Runs Airflow | `03-jul` → `08-jul` (coherente con AirflowSim/DataOpsSim) |

Prohibido `new Date()` para el mundo simulado: usar `backend/src/lib/simTime.ts`
(espejo backend de `alumnos/src/lib/simTime.ts`).

## Empresas

| Id | Empresa | Ciudad | Tono | Tensión activa |
|----|---------|--------|------|----------------|
| `lno` | Logística del Norte S.A. de C.V. (LNO-080515-TYU) | Ciudad Juárez, Chihuahua | Directo y formal | Caja apretada: los pagos a proveedores no pueden retrasarse |
| `dataflow` | DataFlow Analytics S.A. de C.V. (DFA-220119-KLM) | CDMX + Monterrey | Cercano y técnico | Presión de clientes retail por datos frescos |

## Eventos canónicos (hechos FIJOS, idénticos para todos)

| Evento | Rutas | Fecha | Hechos |
|--------|-------|-------|--------|
| `incidente_05jul` | engineering, science | 05-jul | DAG `lno_sales_pipeline` falló en `dbt_test` → `positive(total_ventas)` sobre `mrt_ventas_por_cliente`; SLA mart incumplido; recuperación = corregir modelo + reprocesar |
| `retraso_transportes_express` | contable, analyst | 02-jul | Proveedor Transportes Express entregó +3 días de retraso |
| `rumor_auditoria_sat` | contable | 15-jul | Rumor de auditoría SAT; sube la exigencia de validación fiscal |
| `presion_cliente_retail` | engineering, science | 06-jul | Cliente retail exige reportes diarios; refuerza urgencia de SLAs |

**Golden data**: mart `mrt_ventas_por_cliente` total = **128350** (calculado por
`compileModelSql`, verificado en `tests/de-motors.test.ts`).

## NPCs y modelo de comportamiento (reglas, no IA)

| Id | Nombre | Empresa | Ruta | Paciencia | Formalidad | Aversión riesgo | Memoria |
|----|--------|---------|------|:---:|:---:|:---:|:---:|
| `lic_gomez` | Lic. Gómez | lno | contable | 1 | 2 | 2 | sí |
| `sandra_mora` | Ing. Sandra Mora | dataflow | engineering | 2 | 1 | 1 | sí |
| `tesoreria` | Tesorería | lno | contable | 1 | 1 | 2 | no |
| `maria_lopez_rrhh` | María López | lno | contable | 2 | 1 | 0 | no |
| `cliente_comercial_norte` | Comercial del Norte | lno | contable | 0 | 1 | 0 | sí |
| `proveedor_transportes_express` | Transportes Express | lno | contable | 1 | 1 | 1 | no |
| `ana_analista` | Ana García | dataflow | analyst | 2 | 0 | 0 | sí |

Escaleras de reacción (suben con errores repetidos / tareas vencidas):

- **lic_gomez**: amable → recordatorio → necesitamos_hablar → microarco_capacitacion
- **sandra_mora**: amable → nota_tecnica → revision_urgente → microarco_capacitacion
- **tesoreria**: aviso → recordatorio_pago → escalada_direccion
- **cliente_comercial_norte**: pregunta_factura → reclamo → amenaza_moroso
- **proveedor_transportes_express**: aviso_demora → recordatorio_pago → suspension_servicio

## Arcos por ruta

| Ruta | Arcos |
|------|-------|
| contable | `contable_primer_mes` (facturación → conciliación con cheque sin cobrar → nómina) → `contable_cierre_mes` (pólizas → estados) → `contable_auditoria` (CFDI/tax ante rumor SAT) |
| analyst | `analyst_mart` (acceso al mart → alerta de calidad) → `analyst_churn` (caso compartido con ciencia) |
| engineering | `engineering_incidente` (05-jul) → `engineering_propiedad` (DAG + review) → `engineering_slas` |
| science | `science_churn` (EDA → baseline → evaluación, features degradadas por el 05-jul) |

Los arcos **no definen montos ni golden**: solo contexto; los números los pone el
`caseGenerator` con los motores (`autoEntries`, `paymentMatching`, `compileModelSql`).

## Auditoría de coherencia (gate)

Todo caso/escena generada debe pasar los 9 checks de `storyCoherence.auditCase`:

1. `datesInSimCalendar` — fechas ≤ HOY sim y dentro de la ventana del arco
2. `entitiesExist` — clientes/proveedores/productos en `persistentData`, datasets en `DBT_DATASETS`, conceptos en `NARRATIVE_ENTITIES`
3. `balancedEntry` — montos > 0 (asiento cuadra con `autoEntries`)
4. `goldenFromEngine` — golden calculados por motor (mart total = 128350)
5. `slaConsistent` — coherente con la matriz DataOps y runs Airflow (fallo 05-jul)
6. `npcAuthorized` — NPC de la empresa/ruta de la escena (Lic. Gómez nunca en data)
7. `noCrossRoute` — sin tareas contables en rutas data (regresión FALLA #1)
8. `seedReproducible` — misma semilla → payload idéntico
9. `noMojibake` — sin secuencias corruptas en textos (regresión FALLA #2)

Comando: `npm run audit:story` (50 semillas × 4 rutas, 0 casos inválidos).