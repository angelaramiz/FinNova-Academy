# Análisis de Coherencia, Consistencia y Realismo — Especialidad Data Engineering

> Generado a partir de la ejecución del plan de pruebas (2026-08-09) + auditoría de código (DesktopShell, AirflowSim, DataOpsSim, CatalogSim, GitSim, NotebookSim, Tutorial, taskPlanner, dataEngineeringWorkflows, DBTSim).
> Objetivo: que el simulador se sienta como un trabajo real: un solo calendario, una sola empresa/equipo, números que cuadran y estados coherentes entre apps.

---

## A. Incoherencias de fecha — la más grave (S1)

| # | Hallazgo | Evidencia | Impacto |
|---|----------|-----------|---------|
| A1 | **Dos calendarios distintos coexisten**: AirflowSim usa el reloj real (runs 03/08–08/08, fallo en 07/08) mientras DataOpsSim/CloudSim/BiSim/Notebook/ApiClient usan julio 2026 fijo | `AirflowSim.tsx` `todayStr(Date.now()-...)` vs `DataOpsSim.tsx` `DAYS = ['01-jul'…'06-jul','hoy']` | Un estudiante que cruce "la corrida que falló" entre apps verá 07-ago en Airflow y 03-jul en DataOps. Contradicción directa. |
| A2 | DataOpsSim dice "La corrida del **03-jul** falló en dbt_test (**ver AirflowSim**)" pero AirflowSim muestra el fallo en **07/08** | comentario L35 DataOpsSim vs seedRuns offset===2 Airflow | La referencia cruzada explícita hace la incoherencia innegable. |
| A3 | El header del escritorio muestra la **fecha real del reloj del PC** (vier 08 ago, hora actual) sobre datos de julio | `DesktopShell.tsx` `new Date().toLocaleDateString(...)` | Misma sensación de "todo pasó en otra época". |
| A4 | El DAG `start_date=datetime(2026,1,1)` + `catchup=False` y 6 runs mostrados sin días no laborables | `DAG_CODE` | Un pipeline diario sin runs de fin de semana es sospechoso entre agosto real y julio simulado. |

**Fix propuesto**: crear un **reloj de simulación único** (`SIMULATOR_DATE = 06-jul-2026`, o derivable por especialidad) centralizado en `alumnos/src/lib/simTime.ts`:
- `seedRuns()` de Airflow → runs del **30-jun al 06-jul**, con fallo (dbt_test) el **03-jul** y recovery confirmado el 04-jul (coincide con DataOps matrix: rojo 03-jul, verde 04-jul en adelante).
- Header del desktop → fecha de simulación (jue 02 jul 2026 al estilo "hoy = 06-jul").
- Trigger run → sella fecha sim "hoy 06-jul" + hora real.
- Run del 03-jul además podría mostrar el retry del pipeline fallido como estado realista.

---

## B. Incoherencias de rol y personas (S1/S2)

| # | Hallazgo | Evidencia | Fix |
|---|----------|-----------|-----|
| B1 | La **oficina 3D muestra "AUXILIAR CONTABLE"** para el perfil DE (remanente del BUG-02): `SimuladorLaboral` toma el job del `memoryDb.simJobs`, que **solo contiene jobs contables** (Auxiliar Contable, Analista de Cuentas por Pagar). No existe job "Ingeniero de Datos Jr" ni empresa DataFlow en memoryDb | `memoryDb.ts` simJobs; snapshot oficina "AUXILIAR CONTABLE" con usuario DE | Agregar `simJobs` DE (Ing. de Datos Jr → DataFlow Analytics) o derivar el título desde `specialties.ts` cuando specialty=data_engineering |
| B2 | **"Ing. Sandra Herr"** en CatalogSim `dim_fechas` vs "Ing. Sandra Mora" en todo lo demás | `CatalogSim.tsx` L31 | Corregir typo → "Sandra Mora" |
| B3 | PR del estudiante es **#13** mientras el equipo tiene PR #8 y #9 (Karla/Dan): 4 PRs inexistentes entre medias | GitSim ("Mis PRs" → PR #13; Reviews → PR #8/#9) | Renumerar: estudiante = **#10** (consecutivo de 8, 9) |
| B4 | `raw_clientes` certificate ✓ en Catalog pero `dim_cliente`… (revisar certificación Gold vs silvers) | CatalogSim | Auditar consistencia de certificados entre Catalog y DataOps (solo mrt gold certificado, coherence con SLA) |

---

## C. Tareas y correo en modo DE — contenido contable filtrado (S1)

| # | Hallazgo | Evidencia | Fix |
|---|----------|-----------|-----|
| C1 | El **escritorio DE muestra tareas contables**: "Pago de Almacenes del Bajío · payment registration" | Snapshot DesktopShell en modo DE | El endpoint `today-tasks` ya recibe `?specialty=` (SimuladorLaboral L1113) pero el flujo demo no la está propagando a la carga de tareas que alimenta `DesktopShell.tasks`; verificar `taskPlanner.getTodayTasks(specialty)` y forzar specialty DE en la selección |
| C2 | El **Correo (bandeja)** en DE debería traer tickets de **Ing. Sandra Mora** (dbt, ingestas, tests) y no correos del Lic. Gómez | `EmailInbox`/engines.ts (template contable) | Elegir plantillas del branch DE (ya existen en `dataEngineeringWorkflows.ts` y `engines.ts`) cuando specialty=data_engineering |

---

## D. Más hallazgos numéricos: coherencia parcial + detalles falsos (S2/S3)

| # | Hallazgo | Evidencia | Fix |
|---|----------|-----------|-----|
| D1 | **Duración de runs perfectamente lineal** (3m0s, 6m12s, 9m24s…) y formato inválido **"18m 60s"** en el run 6 | `AirflowSim.tsx` RunsTable `{(i+1)*3}m {i*12}s` | Duraciones seed fijas y variadas (4m12s, 4m38s, 5m02s, 4m55s, 5m30s, 4m48s) + formateador que cargue 60s → 1m. El run fallido puede ser el más lento (consistente con retries) |
| D2 | Notebook imprimió "Total facturado del mes: **128350** MXN" sin separador vs BI "$128,350" / "35,900" | NotebookSim Out[4] vs BiSim | Formatear prints de kernel con `toLocaleString('es-MX')` |
| D3 | DataOps dice **"SLA 30d: 98%"** pero la matriz visible es de **7 días** | DataOpsSim L69 + MATRIX 7 cols | O renombrar "SLA 7d" o expandir matriz a 30 días (recomendado: mantener 7d y etiquetar "SLA 7d") |
| D4 | Costos: Redshift **$168.40/mes @ $0.24/h ≈ 701 h/mes (~23 h/día)** — plausible para warehouse siempre-on, pero conviene documentar la fórmula (slots% × horas × tarifa) para que el estudiante pueda replicarlo | CloudSim Billing vs DataOps $0.24/h, 42% slots | Añadir tooltip/fórmula visible en Billing |
| D5 | `WarehouseSim` presenta `fact_venta`/`dim_producto` que **no existen en dbt** (solo stg_ventas, stg_clientes, int_ventas_cliente, mrt_ventas_por_cliente) | WarehouseSim vs MODELS de DBTSim | Mapear WarehouseSim a los 4 modelos dbt reales (o marcar dims como "fuentes externas" igual que CatalogSim los marca externos) |
| D6 | `fact_cobranza` (12 rows) **no tiene pipeline asociado** — CatalogSim ya lo trata como externo ✓ | CatalogSim L29 | Coherente ya; documentar en AGENTS.md como dataset externo intencional |
| D7 | **RFCs inventados** ("LNO-080515-TYU", "CTR-550505-TUV") — el formato RFC mexicano real es letras+6 dígitos fecha+homoclave (4+6+3). | `persistentData.ts` | Formato RFC real: "LOG860428TY1" (contabilidad, baja prioridad) |

---

## E. Estados y UX que rompen la ilusión de "trabajo real" (S2/S3)

| # | Hallazgo | Evidencia | Fix |
|---|----------|-----------|-----|
| E1 | Tras crear el PR, el **ticket sigue visible con radios + botón "Commit + abrir PR"**, permitiendo re-crear PRs duplicados | snapshot GitSim tras "🌿 Commit + abrir PR" | Marcar ticket como completado (ocultar radios, mostrar estado "PR #10 abierto") |
| E2 | `logs_airflow_dbt` con freshness 09:00 vs último run 08:00 — chequear si el log de 03-jul (fallo) se refleja en el SLA (debería estar rojo en logs también) | DataOpsSim DATASETS vs MATRIX | Alinear: logs_airflow_dbt también falló el 03-jul (o justificar por qué el log existe pese al fallo) |
| E3 | MonitorSim debe mostrar el **mismo run fallido de 03-jul** que Airflow/DataOps (verificar los 6 runs) | MonitorSim | Alinear estados/semáforo con el calendario único de julio |
| E4 | ApiClient POST `/api/ingesta/ventas` es cosmético: no altera conteos posteriores (dbt sigue con 8 filas). Realista sería reflejar el +1 en lineage | ApiClientSim/DBTSim | (opcional) estado de ingesta local versionada |

---

## F. Lo que YA es coherente (mantener)

- Total **$128,350** cuadra en BI, Notebook (sum y print), describe (mean 25,670 = 128,350/5) y API Client.
- **TechCorp $35,900** consistente en BI, Notebook, Catalog (mrt rows 5) y dbt mart preview.
- **5 tests dbt** = TESTS_LABELS de DataOps (2+1+1+1) = DBTSim build ✓.
- **Owner de datasets** coincide con el equipo (Karla Ruiz → stg, Sandra Mora → gold) ✓.
- **Karla Ruiz (staging)** en GitSim con PR de `c.sector` → misma persona dueña de stg_ventas en DataOps ✓.
- Incidente 03-jul → mrt incumple SLA → DataOps rojo; tests fallaron en Airflow; recovery el 04-jul ✓ (una vez unificadas las fechas de la sección A).
- x-trace-id "lno-" en API Client coherente con el cliente servido (LNO es el cliente de DataFlow) ✓.

---

## G. Plan de acción priorizado

| Fase | Items | Esfuerzo |
|------|-------|----------|
| **FASE 1 — Coherencia crítica (S1)** | A1+A2+A3 reloj único de simulación en `lib/simTime.ts`; B1 oficina rol DE (jobs DE en memoryDb); C1+C2 tareas y correo DE reales | ~4h |
| **FASE 2 — Consistencia entre apps (S2)** | B3 PR #10; D1 duraciones Airflow; D5 WarehouseSim→modelos dbt; E1 GitSim ticket completado; E2/E3 Monitor+logs alineados | ~3h |
| **FASE 3 — Pulido realismo (S3)** | B2 typo Sandra Herr; D2 formato print; D3 label SLA 7d; D4 fórmula costos; D7 RFCs reales; E4 ingesta viva | ~2h |

**Criterio de aceptación final**: con un solo arranque, un estudiante puede seguir la historia "el 03-jul el pipeline falló en dbt_test y el mrt no cumplió SLA; lo detectamos en DataOps, lo revisamos en Airflow (grafo rojo), el PR que lo arregló pasó review con Sandra, y hoy (06-jul) todo está verde" — sin contradicciones de fecha, rol ni número.