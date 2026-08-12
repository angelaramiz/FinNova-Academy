# Plan de Pruebas Local — Simulador Laboral 3D (DataFlow Analytics / LNO)

> Alcance: validación manual + automática de los 2 frontends, backend y los **15 simuladores de la especialidad Ing. de Datos** + apps contables core, sobre datos coherentes conocidos ("golden data").
> Fecha: 2026-08-09 · Entorno: Windows 11, PowerShell 5.1, Node.js (proyecto Vite 6 + React 19 + TS strict).

---

## 1. Prerrequisitos

| Requisito | Detalle |
|-----------|---------|
| Node.js (proyecto) | `node_modules/` deben existir en **raíz**, `alumnos/` y `backend/`. Si no: `npm install` en cada carpeta. |
| Variables de entorno | `backend/.env.local` debe existir (copiar de `.env.example` si falta). El simulador funciona con `MemoryDatabase` sin Supabase, pero el arranque requiere el archivo. |
| Puertos libres | **3000** (alumnos), **3001** (backend). El server staff usa 3001 también → **no levantar staff y backend a la vez** (ver §10). |
| Credenciales de acceso | Local: `demo@simulador.com` / `test123` · Producción (si backend apunta a Supabase): `prueba@demo.com` / `test123` |
| Git | Repo limpio salvo modificaciones en curso (sin commits de la sesión actual). |

---

## 2. Levantamiento del stack

### Opción A — script automático (recomendada)
```powershell
.\start-dev.ps1
```
Abre 2 ventanas CMD (backend :3001 + alumnos :3000). Cerrarlas detiene los servidores.

### Opción B — manual
```powershell
# Terminal 1 — Backend (puerto 3001)
Set-Location backend
npx tsx src/server.ts

# Terminal 2 — Frontend alumnos (puerto 3000, proxy /api → 3001)
Set-Location alumnos
npx vite --port=3000 --host=0.0.0.0
```

### Verificación de humo
```powershell
Invoke-RestMethod http://localhost:3001/api/health    # → { status: 'ok', ... }
# Navegador → http://localhost:3000 → login demo@simulador.com / test123
```

### Verificaciones estáticas (antes de probar UI)
```powershell
# Raíz — suite de tests automatizados (esperado: 9 passed, 2 archivos)
npm run test

# Alumnos — typecheck estricto del frontend
Set-Location alumnos
npx tsc --noEmit    # esperado: salida vacía (TSC-OK)
```

---

## 3. Golden data — datos maestros de coherencia

Todos los simuladores DE deben mostrar exactamente estos números (son la fuente de verdad para
aceptar/fallar una prueba).

### 3.1 Fuentes raw (`DBTSim` → `SOURCES`)
| Tabla | Filas | Nota |
|-------|:-----:|------|
| `raw_ventas` | **8** | ids 1-8, fechas 2026-07-01 → 05, columnas `id, fecha, cliente, producto, cantidad, precio_unit` |
| `raw_clientes` | **5** | TechCorp SA, Distribuidora Luna, Constructora Norte, Comercial Valle, Inversiones Trust |

### 3.2 Modelos dbt compilados (vía `compileModelSql`)
| Modelo | Filas | Columnas |
|--------|:-----:|----------|
| `stg_ventas` | 8 | id, fecha, cliente, producto, cantidad, precio_unit, **total** (cant×precio) |
| `stg_clientes` | 5 | cliente_id, nombre, rfc, ciudad, sector |
| `int_ventas_cliente` | 8 | venta_id, fecha, cliente, producto, cantidad, total, cliente_id, ciudad, sector |
| `mrt_ventas_por_cliente` | 5 | ordenado por total DESC (ver tabla) |

### 3.3 Mart ejecutivo — ranking (el dato más citado en las apps)
| Cliente | num_ventas | total_ventas |
|---------|:----------:|-------------:|
| TechCorp SA | 3 | **$35,900** |
| Inversiones Trust | 1 | **$34,000** |
| Comercial Valle | 1 | **$28,500** |
| Constructora Norte | 1 | **$25,500** |
| Distribuidora Luna | 2 | **$4,450** |
| **TOTAL** | — | **$128,350** |

Detalles derivados: venta 7 = TechCorp, Almacenaje, 20×320 = 6,400 · venta 6 = Comercial Valle Transporte intl 28,500 · venta 8 = Inversiones Trust Flete 4×8,500 = 34,000.

### 3.4 Incidente histórico (referencia cruzada en 3 apps)
El run de Airflow del **05-jul** falló en `dbt_test` → `export_redshift` quedó pendiente y
`mrt_ventas_por_cliente` **no cumplió SLA ese día** (recuperación el 06-jul). ⚠️ **Regla de reloj**:
desde FASE 1 todas las apps DE usan el **reloj único de simulación** (`alumnos/src/lib/simTime.ts`,
HOY = miércoles 08-jul-2026). La coherencia es **exacta por fecha, no semántica**: el run *failed* del
05-jul en AirflowSim ↔ el punto rojo de la matriz en DataOpsSim (columna 05-jul) ↔ el run `failed`
05/07 en MonitorSim ↔ el log `_failed.log` en CloudSim S3. Si dos apps difieren en la fecha del
incidente → BUG de coherencia (S1).

### 3.5 Tests dbt
**5 tests, 5/5 pass** el run de hoy: `not_null(id)`, `positive(total)`, `unique(cliente_id)`, `not_null(venta_id)`, `positive(total_ventas)`.

---

## 4. Matriz de pruebas por aplicación

Convención: cada caso tiene ID (`AP-xx` DE / `AC-` contabilidad), pasos y **esperado** cifrado.
Fallar si el esperado difiere por > 0.01 MXN o por redondeo de enteros.

### 4.1 Flujo de entrada y escritorio
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| EN-01 | Login local | `demo@simulador.com` / `test123` | Entra al panel del alumno, desktop 3D sin errores de consola |
| EN-02 | Escritorio DE | Panel DE = 17 íconos: Tareas 📋, Correo 📧, **Foundry 🔀, dbt 🧱, Catalog 📚, Notebook 📓, Airflow 🛫, Cloud ☁️, Git 🌿, BI 📊, Capstone 🎓, API Client 📡, DataOps 🧠, SQL 🗃️, Warehouse 🏗️, Monitor 📊, Excel 📈** (15 apps DE + 2 del shell) | Todos los íconos renderizan su emoji, sin texto cortado ni íconos rotos |
| EN-03 | Apertura/cierre | Abrir y ← Escritorio en 3 apps distintas | Animación slide-in, botón de retorno funciona en todas |

### 4.2 PipelineSIM / SQLSim / WarehouseSim / MonitorSim (base)
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| PA-01 | Pipeline Foundry | Abrir Foundry, ejecutar el transform Python `ventas_limpias` (t1) | Output con `rowCount > 0`, log del transform visible; `resumen_ventas_cliente` (t2) reusa la salida |
| PA-02 | SQLSim | `SELECT * FROM clientes` | 5 filas · columnas id, nombre, rfc, ciudad, sector (datos propios del motor SQL, no del pipeline dbt) |
| PA-03 | Warehouse | Modelos dbt reales (compile dbt) | 4 tablas: `stg_ventas` (8 filas, 7 cols), `stg_clientes` (5, 5), `int_ventas_cliente` (8, 9), `mrt_ventas_por_cliente` (5, 5); 3 capas staging/intermediate/marts; lineage: stg_ventas/stg_clientes → int → mrt; queries con filas golden (TechCorp $35,900) |
| PA-04 | Monitor | Grid de runs del DAG | 6 runs reales `lno_sales_pipeline`: scheduled__6..__1 (08/07→03/07), 1 fallido **05/07** (¿ 57%, 4/7 tasks, tarea dbt_test), 5 success ✅; estadísticas: 6 total, 5 éxito, 0 ejecutando, 1 fallido; detalle failed con "dbt_test · logs en s3://lno-logs-airflow" |

### 4.3 DBTSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| DB-01 | `dbt build` completo | Build all | 4 modelos exitosos: stg 8, stg 5, int 8, mrt 5 — elapsed razonable |
| DB-02 | Tests | `dbt test` | 5/5 pass con detalle por test |
| DB-03 | Lineage | Vista de lineage | DAG stg_ventas→int→mrt y stg_clientes→int→mrt |
| DB-04 | Docs | `dbt docs` | Documentación de columnas (total: "cantidad × precio_unit") |

### 4.4 CatalogSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| CA-01 | Búsqueda | `mrt` | **2 resultados**: `mrt_ventas_por_cliente` y `mrt_resumen_diario` |
| CA-02 | Filtro dominio | **Gold** (así, capitalizado) | 3 datasets: fact_cobranza, mrt_ventas_por_cliente, mrt_resumen_diario |
| CA-03 | Detalle dataset | Abrir mrt_ventas_por_cliente | owner **Ing. Sandra Mora**, freshness "hace 30m", rows 5, quality 97 / completeness 99 / validity 95, `✓ certificado` |
| CA-04 | Mis datos | Pestaña 👤 Míos | Aparecen los datasets con owner "Tu (Ing. Datos Jr)" (stg_ventas, stg_clientes, int_ventas_cliente, mrt_resumen_diario) |

### 4.5 NotebookSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| NB-01 | ▶ Run all | Ejecutar las celdas por defecto | `stg_ventas.head(3)` imprime 3 filas; `describe()` 8 stats; variables en memoria |
| NB-02 | Agregación | Celda `stg.groupby('cliente')['total'].sum()` | Montos por cliente: TechCorp SA **35,900** · Distribuidora Luna **4,450** (no exigir orden de filas, el kernel no garantiza orden de claves) |
| NB-03 | Filtro booleano | `df[df['sector']=='Tecnología']` | 1 fila mrt (TechCorp SA 35,900) |
| NB-04 | Errores | Celda `df['col_inexistente']` / variable sin definir | KeyError / NameError con estilo de kernel |
| NB-05 | Kernel | ⭮ Restart | Variables se limpian (celda de variable falla con NameError) |

### 4.6 AirflowSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| AF-01 | Grid ejecuciones | Tab Ejecuciones | 6 runs (03/07→08/07); **run 05-jul con dbt_test = failed y export_redshift = pending**; hoy (08/07) success |
| AF-02 | Trigger run | ▶ Trigger run, observar | Corrida en vivo: pending→running→success en cascada; contador 7/7; se agrega run de hoy |
| AF-03 | Grafo | Tab Grafo | 7 nodos, edges correctos ([ingest×2]→dbt_stg→dbt_int→dbt_mart→dbt_test→export_redshift) |
| AF-04 | Código | Tab Código | DAG Python con `schedule '0 8 * * *'`, `owner dataflow`, `S3ToRedshiftOperator`, bitshift renderizado `>>` |

### 4.7 CloudSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| CL-01 | S3 | Buckets | `lno-raw-ventas` (9 objetos: 01→08 + bootstrap), `lno-staging-dbt` (5 objetos con modified 2026-07-08), `lno-logs-airflow` (6 objetos: 03→08 ok, 05-failed) |
| CL-02 | Redshift | Tabla marts | `mrt_ventas_por_cliente` con 5 filas compiladas reales, TechCorp 35,900 primero |
| CL-03 | IAM | Usuarios | 4 usuarios con ARN/políticas: `sandra.mora` (full, activo), `de-sim-alumno` (read-only, activo), `scheduler-airflow` (S3 full, activo), `ana.lopez` (Redshift RO, **inactivo**) |
| CL-04 | Billing | Cost Explorer | Total julio **US$381.90** · Amazon Redshift **US$168.40 (44%)** — el monto Redshift debe coincidir con DataOpsSim |

### 4.8 GitSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| GI-01 | Mis PRs · tarea 1 | Elegir opción correcta (schema.yml `not_null cliente_id`) | PR abierto, Sandra llega con comentario inline L{n}, → LGTM ✅ y merge |
| GI-02 | Mis PRs · tarea 2 | Elegir opción correcta (ORDER BY total_ventas DESC, sin hardcode) | Aprobado |
| GI-03 | Trampa t1 | Elegir `not_null('id')` en SQL | Sandra rechaza con línea exacta (columna `id` no existe en stg_clientes) |
| GI-04 | Trampa t2 | Elegir `WHERE cliente = 'TechCorp SA'` | Sandra rechaza: hardcode en capa marts — el dato debe salir del pipeline |
| GI-05 | Reviews | Review PR de Karla (bueno) y Dan (malo `SELECT *`) | Karla `c.sector` → LGTM; Dan → rechazado; elegir bien afecta el conteo de aprobados |
| GI-06 | Diff | Inspeccionar diff de un archivo | Rendering del diff real de `models/staging/stg_clientes.sql` |

### 4.9 BiSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| BI-01 | KPIs | Panel principal | Ventas totales **$128,350** · 5 clientes · ticket promedio ≈ $25,670 · 8 transacciones |
| BI-02 | Barras | Gráfico por cliente | TechCorp SA la barra más alta, Distribuidora Luna la mínima ($4,450) |
| BI-03 | Donut | Por sector | Tecnología 35,900 / Finanzas 34,000 / Comercio 28,500 / Construcción 25,500 / Retail 4,450 |
| BI-04 | Filtro | Filtrar sector Retail | Solo Distribuidora Luna, $4,450 |
| BI-05 | Detalle | Clic transacción venta 6 | Comercial Valle · Transporte intl · $28,500 · 2026-07-04 |

### 4.10 ApiClientSim (nuevo)
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| AP-01 | GET listado | `GET /api/ventas` | **200 OK** · 8 filas (tabla renderizada) · header `x-trace-id` |
| AP-02 | GET detalle | `GET /api/ventas/3` | 200 · fila 3 (TechCorp, Carga especializada, 12,500) |
| AP-03 | 404 real | `GET /api/ventas/99` | **404** · JSON `{ok:false, error:'venta 99 no existe…'}` |
| AP-04 | POST ingesta | `POST /api/ingesta/ventas` con body válido | **201 Created** · `inserted: 8`, ack S3 lno-raw-ventas |
| AP-05 | Endpoint inventado | `GET /api/foo` | **404** en badge, mensaje de ruta no registrada |
| AP-06 | JSON inválido | POST con body roto | Textarea borde rojo + "JSON inválido"; respuesta 405/404 sin crash |
| AP-07 | Historial | 4 peticiones | Lista 4 items con método, path, status coloreado, ms |
| AP-08 | Estado DAG | `GET /api/estado/pipeline` | 7 tareas success, `x-airflow-run` presente |

### 4.11 DataOpsSim (nuevo)
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| DO-01 | Semáforo cómputo | Tab Cómputo & Costo | Gauge **42%** verde · barras por hora con pico 16:00 = **85%** (rojo) |
| DO-02 | Costos | KPIs | $0.24/h (reserved) · mes proyectado **$168.40** (93% del presupuesto $180) |
| DO-03 | Alertas | Listado | 4 alertas: slots>80% (02-jul), costo proyectado, cola 6min, run ok hoy |
| DO-04 | Recomendación | Card info | Sugerencia downsize → RA3.xs (~$1,200/año) cuando uso < 60% |
| DO-05 | SLA tabla | Tab SLAs | 7 datasets, 6/7 "en SLA" · SLA global **98%** (48/49 dataset-días) |
| DO-06 | Matriz | Días 03-08 jul | Único punto rojo: **mrt_ventas_por_cliente en 05-jul** (tercera columna) + incidente descrito (dbt_test) |
| DO-07 | Tests | Card dbt test | 5/5 pass, nota "1 fallo histórico (05-jul)" |
| DO-08 | Coherencia con Airflow | Abrir Airflow y encontrar el run fallido | El run `failed` del **05-jul** en Airflow corresponde al punto rojo del mart en DO-06 (misma fecha exacta, ver §3.4) |

### 4.12 CapstoneSim
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| CP-01 | Flujo 7 fases | Responder 7 checkpoints al primer intento | 700/700 pts, barra 100%, todas las fases ✅ |
| CP-02 | Puntaje reintento | Fallar 1 fase y reintentar | Puntaje 650 pts (50 por esa fase), barra refleja intentos |
| CP-03 | Coherencia respuestas | Datos del README final | README con: 8 transacciones, $128,350, TechCorp $35,900, 4 modelos, 5 tests |
| CP-04 | Reinicio | 🔄 Reset | Progreso a 0, puntaje limpio |

### 4.13 Apps contables core (regresión)
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| AC-01 | Tareas del día | Escritorio → Pendientes | Tareas del plan del día, 33/mes; trampas señaladas como errores si se cometen |
| AC-02 | Facturación | Workflow invoice | CFDI emitido, IVA 16% (no 10% — trampa #1) |
| AC-03 | Recepción CFDI | Workflow cfdi_reception | Proveedor registrado, póliza generada |
| AC-04 | Reportes | Balance general / Edo. resultados | Cuadran (activo = pasivo + capital) |
| AC-05 | Excel | Ejercicio 1 balanza | Fórmulas SUM/IF/BUSCARV se evalúan; export CSV funcional |
| AC-06 | Trampas | Efectuar pago mal aplicado (trampa #2) | El sistema detecta mismatch (cliente A→factura B) con advertencia |

### 4.14 (Opcional) Oficina 3D
| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| 3D-01 | Escena | Vista libre del escritorio | Render sin errores WebGL en consola, FPS aceptables, sin pantalla negra |

---

## 5. Pruebas de coherencia cruzada (la más importante de la suite)

Verificar estos números en **todas** las apps indicadas — una discrepancia = fallo de coherencia:

| Dato | Apps donde debe aparecer |
|------|--------------------------|
| TechCorp SA **$35,900** | Notebook, BI, GitSim (trampa t2), ApiClient (venta 3), Capstone, Cloud (Redshift), DBTSim (mart), DataOps (visualmente vía SLA no numérico) |
| Total **$128,350** | BI KPIs, Capstone README, (implicit. Suma de mrt + filas stg) |
| 8 transacciones / 8 filas | DBTSim, ApiClient (`count:8`), Cloud S3/Redshift, Notebook, Capstone, Catalog (rows: 8) |
| 5 clientes | DBTSim, Catalog, Warehouse (dim_cliente), BI donut (5 sectores), ApiClient lista raw |
| Redshift **$168.40** mes | CloudSim Billing (US$168.4, 44% de 381.9) ↔ DataOpsSim costo (misma cifra) |
| Incidente del run DAG (05-jul) | AirflowSim (run failed 05-jul) ↔ DataOpsSim (punto rojo matriz 05-jul) ↔ MonitorSim (scheduled__3 failed 05/07) ↔ CloudSim (log `_failed.log` 05/07) |
| 5 tests/5 pass | DBTSim ↔ DataOpsSim ↔ AirflowSim (dbt_test success hoy) ↔ MonitorSim |

Regla: si dos apps divergen en un dato de la lista → **BUG de coherencia**, reportar con ambos
valores y apps implicadas.

---

## 6. Casos negativos / de error esperados (NO son bugs)

| Escenario | Comportamiento esperado |
|-----------|-------------------------|
| `GET /api/ventas/99` | 404 con JSON de error pulcro (ApiClient) |
| Ruta inventada | 404 en badge, sin crash |
| Body JSON roto en POST | Borde rojo + aviso "JSON inválido", no rompe UI |
| Celda de Notebook con columna inexistente | KeyError simulado en la celda (no crash global) |
| PR malo en GitSim (SELECT */hardcode) | Sandra rechaza con comentario inline exacto; el flujo NO permite merge |
| Run de Airflow con trigger doble | Botón deshabilitado mientras corre (`opacity .5`) |
| Fase del Capstone fallida | 50 pts, explicación + puede reintentar |
| Backend caído | El frontend muestra error/loading (no página blanca) — banner de error visible |

---

## 7. Checklist de aceptación (criterios de salida)

- [ ] `npm run test` → **9/9 passed** (raíz, 2 archivos vitest)
- [ ] `npx tsc --noEmit` (en `alumnos`) → **0 errores**
- [ ] `GET /api/health` → 200
- [ ] Golden data §3 cumplida en ≥ 8 apps distintas (§5 sin discrepancias)
- [ ] Todas las apps DE (15: Foundry, dbt, Catalog, Notebook, Airflow, Cloud, Git, BI, Capstone, API Client, DataOps, SQL, Warehouse, Monitor, Excel) abren y cierran desde el escritorio sin crash
- [ ] Casos negativos §6 se comportan como se documenta
- [ ] Zero `console.error` de React/WebGL en la DevTools durante el recorrido
- [ ] Todos los hallazgos con veredicto ≠ PASS registrados en la bitácora §13 con plantilla §10

---

## 8. Veredictos y criterios de resultado

Cada caso de §4 se cierra con **un único veredicto**. Reglas de decisión:

| Veredicto | Cuándo se aplica | Efecto en el recorrido |
|-----------|------------------|------------------------|
| **PASS** | El resultado cumple el "Esperado" de §4 dentro de los umbrales (redondeo a entero en MXN; ignorar `x-trace-id` y latencia de ApiClient) | Continúa |
| **FAIL** | No cumple el esperado y es **reproducible** (2 veces seguidas) → defecto | Documentar en bitácora, continúa salvo severidad S1 |
| **ERROR** | Falla del entorno, no del producto (backend caído, puerto ocupado, GPU/WebGL ausente, `tsc` no ejecutado) | Reiniciar el entorno y repetir; si persiste tras reinicio → tratar como defecto |
| **DEVIATION** | Comportamiento distinto pero razonable/equivalente (orden del `groupby`, fecha dinámica de Airflow, latencia) | Anotar + no bloquear; revisar en cierre |
| **SKIP** | Caso no aplicable (staff, 3D sin GPU en máquina, caso opcional) | Anotar motivo |

**Reglas duras:**
1. Divergencia de golden data (§3/§5) = **siempre FAIL**, nunca DEVIATION. La fuente de verdad es `DBTSim.tsx` (`SOURCES`, `MODELS`, `compileModelSql`); las apps deben derivar de ahí, no "cuadrarse" cambiando el dato.
2. Todo lo documentado en §6 (casos negativos) que se comporte bien = PASS **por diseño** — no es defecto que `GET /api/ventas/99` devuelva 404.
3. Un "negativo esperado" que **crashea** la app (p.ej. KeyError que rompe todo el Notebook) = defecto real (S2 mínimo).
4. Si hay duda entre FAIL y DEVIATION → anotar DEVIATION con evidencia y resolver en cierre de sesión.

---

## 9. Severidad y prioridad

| Severidad | Definición | Ejemplos en este proyecto | Acción |
|-----------|------------|---------------------------|--------|
| **S1 · Bloqueante** | Impide probar o rompe el recorrido; o contradice golden data | Pantalla blanca al abrir una app; divergencia de $35,900/128,350/168.40; backend no arranca | **Parar** el recorrido, corregir antes de continuar |
| **S2 · Alto** | Flujo pedagógico roto o número errado no-golden | No se puede aprobar un PR correcto en GitSim; unused token de tema (`accent`/`bgElevated`) que rompe color de una sección; API 405 donde debe ser 404 | Documentar ya; corregir al cerrar ese grupo de apps |
| **S3 · Medio** | Diferencias visuales o de usabilidad | Texto cortado en ícono del escritorio; umbral off por 1 dígito (redondeo); mensaje confuso | Documentar; corregir en el cierre |
| **S4 · Bajo** | Cosmético, no bloquea la experiencia | Typo, espacio inconsistente, detalle 1px | Documentar; corregir si hay ocasión |

---

## 10. Plantilla de reporte de defecto (copiar por hallazgo)

```markdown
### DEF-001 · <título corto>
- **Caso**: AP-01            (ID de §4, p.ej. AP-01, DO-06, CA-02)
- **App**: ApiClientSim       (componente)
- **Veredicto**: FAIL         (FAIL | ERROR | DEVIATION)
- **Severidad**: S2           (S1-S4)
- **Esperado**: <texto literal del caso>
- **Actual**: <valor/estado exacto observado, con formato (p.ej. `$35,900` vs `$36,000`)>
- **Pasos**: 1) … 2) … 3) …
- **Evidencia**: <screenshot (Win+Shift+S) / mensaje exacto de consola F12 / dato numérico>
- **Entorno**: <fecha-hora · tema light/dark · backend arriba/abajo · navegador>
- **Reproducible**: sí/no (+ nº de intentos)
- **Categoría**: coherencia | crash | visual | funcional | pedagógico
- **Diagnóstico inicial**: <sospecha: apartado de `DBTSim.tsx`, `themeColors`, hardcode grep-able, import circular…>
- **Estado**: abierto | fijado | verificado
```

**Ejemplo ilustrativo (usado solo como guía de formato):**

```markdown
### DEF-999 · Billing muestra cifra sin formato
- **Caso**: CL-04 · **App**: CloudSim · **Veredicto**: FAIL · **Severidad**: S3
- **Esperado**: Total julio US$381.90 · Redshift US$168.40 (44%)
- **Actual**: "US$381.9" sin segundo decimal en el KPI
- **Pasos**: 1) Abrir Cloud → 2) Billing → 3) revisar KPI superior
- **Evidencia**: screenshot `billing-kpi.png` · consola sin errores
- **Entorno**: 2026-08-09 12:10 · tema claro · backend arriba · Chrome
- **Reproducible**: sí (2/2) · **Categoría**: visual
- **Diagnóstico inicial**: formato de `fmtMXN`/`toLocaleString` en KPI de Billing
- **Estado**: abierto
```

---

## 11. Procedimiento ante resultados incorrectos, inesperados o erróneos

**Regla de oro: anotar ANTES de arreglar.** Capturar: valor exacto, pasos, screenshot, consola (F12). No "arreglar de memoria" — cada hallazgo se documenta con plantilla §10 y se resuelve por severidad.

| # | Síntoma | Diagnóstico | Acción |
|---|---------|-------------|--------|
| A | **Suite automática falla** (`npm test` ≠ 9/9, o `tsc` con errores) | Los tests cubren el engine (compileModelSql, kernel Notebook, analyzeDiff) — una falla ahí invalida el recorrido manual | **Detener**; es S1. Corregir el código y re-ejecutar tests antes de cualquier prueba UI |
| B | **Divergencia golden data** (§3/§5) | Verificar en `DBTSim.tsx` (`SOURCES`/`MODELS`); sospechar hardcode en la app culpable (`grep` del monto en el componente) | S1. Parar, corregir la app (nunca el dato), re-ejecutar smoke |
| C | **Pantalla blanca / crash al abrir app** | F12 → si error de token de tema (`accent`, `bgElevated`, `purple` no existen) es mapeo de color; si `undefined` de filas es tabla no compilada; si import circular lo señala Vite | Reproducir 2 veces; S1 si constante, S2 si intermitente |
| D | **Backend caído / EADDRINUSE :3001** | Revisar terminal del backend: puerto ocupado (staff), falta `.env.local`, error en rutas | Reiniciar entorno; el frontend DEBE mostrar banner de error, no página blanca (eso sería defecto aparte) |
| E | **Comportamiento errático** (latencia, trace-id, fechas) | `Math.random()` en ApiClientSim; hora real solo visible junto a fecha sim (`simHeaderNow`); orden de `groupby` no garantizado | DEVIATION por diseño — no reportar; ignorar campos documentados |
| F | **Discrepancia entre 2 apps** | Regla §5: la fuente de verdad es el engine dbt; comparar ambos valores contra `compileModelSql` | Identificar la app con valor hardcodeado → esa es la defectuosa (S1) |
| G | **Casos negativos §6 mal comportados** (p.ej. 500 en vez de 404, KeyError que rompe la app) | Inspeccionar el handler/endpoint o el branch del kernel | S2: defecto real, documentar con plantilla |
| H | **Visual leve / typo** (S3/S4) | — | Anotar y **continuar** el recorrido (no interrumpir); corregir al cierre |
| I | **Duda de veredicto** | Releer el esperado del caso y los riesgos §12; si sigue el dilema → DEVIATION + nota | Resolver en cierre de sesión con la persona responsable |
| J | **Cierre de sesión** | Recolectar bitácora; corregir defectos en orden S1→S2→S3/S4; tras cada fix: `npm run test` + `tsc` + re-probar **solo los casos afectados** (regresión dirigida) | Si el fix cambió arquitectura/componentes → actualizar `AGENTS.md` y este plan |

---

## 12. Riesgos y notas conocidas

1. **Conflicto de puerto 3001**: el staff frontend usa 3001 igual que el backend → NO
   levantar ambos a la vez (para probar staff, cambiar `npm run dev -- --port=3002` en `staff/`).
2. **`EADDRINUSE :3001` en `npm run test`**: esperado si el backend está corriendo; los tests
   usan su propio server con puerto efímero solo si el puerto está libre — no es un fallo.
3. **Datos del backend**: los días/datos del plan dependen de la fecha del sistema; las apps DE
   usan datos fijos (julio 2026) hostiles a propósito — no intentar "actualizarlos". Desde FASE 1
   **todas** las apps DE comparten el reloj único de simulación (`simTime.ts`, HOY = 08-jul-2026):
   la hora real solo se muestra junto a la fecha sim (`simHeaderNow`), nunca como fecha de datos.
4. **`Math.random()` en ApiClientSim**: latencia y `x-trace-id` varían entre runs; la prueba
   AP-01 debe ignorar esos dos campos.
5. **GitSim**: la tarea 1 correcta es la del archivo `schema.yml` (test declarativo), no
   `not_null('id')` inline en SQL — esta es la regla pedagógica principal a validar.
6. **PowerShell + UTF-8**: para inspeccionar el repo, NO usar `Get-Content`/`Set-Content` sobre
   archivos fuente (mojibake); usar los editores de texto del IDE.
7. **Caso PA-02 (SQLSim)**: el motor SQL tiene sus propios datos (no el pipeline dbt) — los
   nombres de clientes/rfc difieren de la golden data §3 a propósito; validar el motor, no la coherencia.

---

## 13. Registro de ejecución (rellenar al probar)

### 13.1 Ficha de la sesión

| Fecha | Probador | Apps probadas | ¿Golden data ok? | ¿Suite automática? | Veredicto global | Firma |
|-------|----------|---------------|:----------------:|:------------------:|------------------|-------|
| 2026-08-09 | Opencode Agent | DBT, Catalog, Notebook, Airflow, Cloud, Git, BI, API Client, DataOps, Capstone, Pipeline, SQL, Monitor, Warehouse, Excel | Sí (128,350 MXN, 5 clientes, TechCorp 35,900) | 9/9 vitest | PASS (4 fixes: AirflowSim + NotebookSim ← Escritorio, DesktopShell toggle roles, Tutorial rol) | e472ebb |
| 2026-08-10 | Opencode Agent | FASE 1 coherencia DE: reloj sim único (simTime), Airflow, DataOps, DesktopShell, oficina DE, tareas/correos DE, EmailInbox | Sí + HOY sim = 08-jul-2026 | 9/9 vitest + TSC | PASS (7 items FASE 1 + 2 fixes: triggerRun crash StrictMode, trampas DE nunca aparecían) | — (aún sin commit) |

### 13.2 Bitácora de hallazgos (un renglón por caso con veredicto ≠ PASS)

| ID caso | App | Veredicto | Severidad | Descripción (esperado vs actual) | Evidencia | Estado |
|---------|-----|-----------|-----------|-----------------------------------|-----------|--------|
| FIX-A | AirflowSim | DEVIATION→fixed | S2 | Componente recibía `onBack` prop pero no lo desestructuraba ni renderizaba botón ← Escritorio. Agregado destructuring + button. | Edit AirflowSim.tsx L167, L228 | verificado |
| FIX-B | NotebookSim | DEVIATION→fixed | S2 | Misma situación: `onBack` en interface pero sin botón ← Escritorio en JSX. Agregado button. | Edit NotebookSim.tsx L467 | verificado |
| BUG-01 | DesktopShell | FAIL→fixed | S1 | La barra del menú mostraba ambos botones de rol (Contabilidad + Data Engineering) siempre. Fix: eliminar botones de toggle del header, inicializar specialty desde prop. | Edit DesktopShell.tsx (L39-55, L176-187) | verificado |
| BUG-02 | Tutorial/Onboarding | FAIL→fixed | S2 | El mensaje de bienvenida mostraba "Contador Junior" incluso en perfil DE. Fix: usarTutorial(specialty) con pasos separados por rol (TUTORIAL_STEPS_ACCOUNTING / TUTORIAL_STEPS_DE). | Edit Tutorial.tsx (L16-73, L55) + DesktopShell.tsx L40 | verificado |
| FASE1-01 | simTime.ts (nuevo) | PASS | — | Reloj único de simulación: HOY = miércoles 08-jul-2026. Header DesktopShell ahora muestra "mié 8 jul · HH:MM" (fecha sim + hora real) en vez de fecha real. | `alumnos/src/lib/simTime.ts` (nuevo); DesktopShell.tsx L176 | verificado |
| FASE1-02 | AirflowSim | PASS | — | Runs semilla ahora 03/07..08/07 (antes 07/08..08/08 fecha real); fallo dbt_test + export_redshift pending el **05/07** (antes 07/08); duraciones variadas 4m12s..6m10s (antes fórmula lineal "18m 60s" inválido). Trigger run nuevo usa fecha sim 08/07 + hora real. | Edit AirflowSim.tsx (seedRuns L127-139, DUR_SEEDS, triggerRun L183-209) | verificado |
| FASE1-03 | AirflowSim trigger | FAIL→fixed | S1 | **Crash al Trigger run** (error boundary "Cannot read properties of undefined (reading 'id')"). Causa: `setRuns(updater)` mutaba el closure `idx` y hacía `DAG_TASKS[idx].id` dentro del updater — con React 18 StrictMode (double-invoke de updaters en dev) idx desbordaba a 7. Fix: reescritura con tick/ref fuera del updater, un task por half-tick, sin efectos dentro del updater. | Edit AirflowSim.tsx triggerRun (L183-209); repro con los listeners error/console | verificado |
| FASE1-04 | DataOpsSim | PASS | — | DAYS ahora ['03-jul'..'08-jul','hoy'] (antes 01-06-jul) + incidente **05-JUL** · mrt_ventas_por_cliente (texto corrido también) — alineado con Airflow. Alerta query pesada 16:40 pasó de 02-jul → 04-jul (dentro del rango visible). | Edit DataOpsSim.tsx (L34, L231-232, L16) | verificado |
| FASE1-05 | SimuladorLaboral | PASS | — | HUD oficina muestra "INGENIERO DE DATOS JR · DATAFLOW ANALYTICS" cuando specialty=DE (antes siempre el job contable del perfil); fetchJobs ahora usa `simToday()` (antes `new Date()` real, agosto) y sin el hack week+4 que enrutaba DE a semanas inexistentes 5-8. | Edit SimuladorLaboral.tsx (L1050-1063, L1106-1121, L1145-1160, HUD L1299-1310) | verificado |
| FASE1-06 | simEngine.ts (backend) | PASS | — | `POST /api/sim/onboarding` ahora persiste `specialty` (antes lo ignoraba → el perfil DE nunca llegaba al frontend). | Edit simEngine.ts (L535, L563) | verificado |
| FASE1-07 | taskPlanner.ts (backend) | FAIL→fixed | S2 | Trampas DE tenían week 6/7/8 hardcodeado → `getTodayTasks` nunca las devolvía (plan usa semanas 1-4). Fix: week 1/2/3. | Edit taskPlanner.ts DE_TRAPS (L201-205) | verificado |
| FASE1-08 | EmailInbox | PASS | — | Remitentes/previews por especialidad: DE → "Ing. Sandra Mora / Sistema de Monitoreo / DataFlow Analytics / Sistema de Calidad" (antes Lic. Gómez/RRHH/Tesorería/SAT siempre) + previews DE (sql_query, etl_pipeline, data_quality, etc.). | Edit EmailInbox.tsx (L3-16, L30-38) + DesktopShell.tsx L235 | verificado |

### 13.3 Cierre de sesión

- [x] Defectos S1: **1 fix** (BUG-01 DesktopShell toggle roles eliminado)
- [x] Defectos S2: **3 fixes** (AirflowSim + NotebookSim ← Escritorio, BUG-02 Tutorial rol dinámico)
- [x] S3/S4: 0
- [x] `npm run test` + `npx tsc --noEmit` verdes tras los fixes
- [x] `AGENTS.md` y este plan actualizados si hubo cambios estructurales

#### Sesión FASE 1 (2026-08-10) — reloj sim + oficina/tareas/correo DE

- [x] Reloj único de simulación creado y aplicado (simTime.ts): Airflow 03/07..08/07 fallo 05/07 · DataOps DAYS 03-08-jul + hoy incidente 05-JUL · header "mié 8 jul · HH:MM"
- [x] HUD oficina DE: "INGENIERO DE DATOS JR · DATAFLOW ANALYTICS"
- [x] Tareas DE reales del plan (mié 08-jul, semana 2 día 3: ETL/SQL/Calidad + banner modo DE + 17 apps)
- [x] Correo DE con remitentes Sandra Mora / DataFlow / Monitoreo / Calidad
- [x] Trampas DE arregladas en backend (week 1-3) — ahora sí aparecen en el plan
- [x] Crash triggerAirflow fix (StrictMode double-invoke) — trigger verificado sin error
- [x] `npm run test` (9/9) + `npx tsc --noEmit` verdes
- [x] Perfil demo persistido con specialty=data_engineering (POST /api/sim/onboarding) — el login vueve directo al modo DE

#### Sesión FASE 2 (2026-08-10) — alinear apps DE: Git/Monitor/Warehouse/Cloud

- [x] E1: GitSim PR #10 (antes `#13/#12`) — flujo didáctico needs_changes→approved verificado
- [x] E2: MonitorSim 6 runs DAG real (03→08/07), fallo 05/07 (dbt_test), detalle failed, simSlash correcto
- [x] D5: WarehouseSim modelos dbt reales compilados (4 tablas, 3 capas staging/intermediate/marts, lineage, queries con filas golden)
- [x] E3: CloudSim logs bucket (6 objetos, 05-failed), raw +06/07/08, staging→2026-07-08, RECENT_EVENTS "2026-07-08 completado"
- [x] `npx tsc --noEmit` (alumnos) → 0 errores
- [x] `npm run test` (raíz) → 9/9 (EADDRINUSE esperado)
- [x] Verificación navegador: GitSim #10, Monitor runs dates, Warehouse golden data, Cloud logs/events
- [x] Paneles "Pendientes del día" y correo DE verificados (3 tareas DE, 3 correos DE, remitentes Sandra Mora)