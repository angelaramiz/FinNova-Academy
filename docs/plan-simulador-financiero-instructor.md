# Simulador financiero con gráficas + teoría — Documento para rama secundaria
> **Audiencia:** instructor que quiere prácticas de temas financieros (no solo contabilidad operativa).
> **Propósito:** 1) inventariar motores/cimientos reutilizables, 2) listar qué falta para un simulador basado en gráficas con teoría, 3) proponer plan de rama secundaria.
> **Fecha:** 2026-09-19 | **Estado:** propuesta (no implementado)

---

## 1. Qué hay hoy: motores y cimientos reutilizables

### 1.1 Motores de cálculo (backend, `backend/src/services/`)

| Motor | Archivo | Qué calcula | Reutilización para finanzas |
|---|---|---|---|
| Asientos contables | `autoEntries.ts` | `generateInvoiceEntries`, `generatePaymentEntries`, `generateSupplierEntries`, `generatePayrollEntries`, `generateBusinessExpenseEntries` — débitos=créditos garantizados | Base para que toda práctica financiera nazca de asientos reales |
| Workflows + validación | `workflowEngine.ts` (+ `GuideBubble`) | 12 workflows + `business_expense`; validación por `workflowId` (GET→validate coherentes) | Patrón a replicar: documento → captura → validación con reglas reales |
| Ejercicios Excel | `excelExercises.ts` | 7 ejercicios (balanza, pólizas, resultados, conciliación, DIOT, depreciación, antigüedad CxC) con `expectedCells` + reglas `exact/range/balanced` | El más cercano a "práctica financiera"; `SpreadsheetSim` ya evalúa 40+ fórmulas (SUM, IF, XLOOKUP, SUMIFS…) |
| Matching de pagos | `paymentMatching.ts` | Score de coincidencia pago↔factura | Reutilizable en prácticas de cobranza/liquidez |
| Datos persistentes | `persistentData.ts` | 5 clientes, 4 proveedores, 8 productos | Semilla para escenarios financieros |
| Catálogo contable | `chartOfAccounts.ts` | 40 cuentas jerárquicas | Fuente de verdad de cuentas |
| Pronóstico (serie) | `advancedDataEngines.ts` + `ForecastSim.tsx` | Serie `[112400,118900,124150,128350]`, media móvil + MAPE | **Único motor numérico con serie temporal**; patrón para proyecciones financieras |
| Validadores DE/DS | `deValidation.ts`, `dsValidation.ts` | SQL/ETL/calidad/EDA/modelo/métricas | Patrón de "validación por resultado real", no string exacto |

### 1.2 Capacidad de gráficas actual (frontend, `alumnos/src/components/`)

| Componente | Técnica | Qué dibuja |
|---|---|---|
| `Dashboard.tsx` | Barras CSS (`ChartBar`), KPICards | Progreso del alumno, no datos financieros |
| `BiSim.tsx` | SVG hecho a mano (línea, barras, donut) sobre mart dbt real | Ventas por cliente/sector, serie diaria — **mejor referencia de gráfica con datos reales** |
| `PowerBISim.tsx` / `ForecastSim.tsx` | Texto + KPIs (Forecast: serie y MAPE en texto, **sin gráfica**) | Demuestra el hueco: hay número pero no visual |
| `StatsSim.tsx` | Estadística sobre mart real | Distribuciones básicas |

**Conclusión:** NO hay librería de gráficas (todo es CSS/SVG artesanal) y NO hay un componente reutilizable tipo `<LineChart>/<BarChart>`. Cada sim reinventa su visual.

### 1.3 Capacidad de teoría + práctica guiada (el patrón pedagógico ya existe)

| Pieza | Archivo | Patrón |
|---|---|---|
| Lecciones + mini-quiz | `LearningSim.tsx` (6 lecciones, quiz con `why`) | Teoría breve → 2 preguntas con explicación |
| Curso con NPC capacitador | `practicasModules.ts` (`PracticaCurso`: intro/secciones/cierre) + `PracticasCurso.tsx` (chat con avatar) | Teoría narrada + puntos clave + navegación |
| Prueba por módulo | `practicasModules.ts` (`PracticaPrueba`, `aprobarMin`, `evaluatePracticaPrueba`) | Comprensión con feedback por pregunta |
| Guía contextual | `GuideBubbles.tsx` + `guides` en `workflowEngine` | Burbujas ancladas por selector CSS que explican cada campo |
| Tracker semanal | `PracticasTracker.tsx` + `buildPracticasTracker` (conteos del plan REAL) | Mecanización: repetición ×N con explicación del porqué |
| Errores que enseñan | P1: todo error de engine lleva lección `📚` | Cada fallo explica el porqué contable/fiscal |

**Conclusión:** el andamiaje pedagógico (teoría → práctica → quiz → repetición) YA existe y es el molde a copiar. Lo que no existe es el **contenido financiero** ni el **motor numérico financiero**.

---

## 2. Qué falta (gap analysis)

### G1. Motor financiero (`backend/src/services/finanzas.ts` — NO existe)
Temas que un instructor pide y hoy no tienen cálculo ni validación:
- Interés simple/compuesto, amortización (tabla + CAT), razones financieras (liquidez, endeudamiento, rentabilidad, actividad), punto de equilibrio, flujo de efectivo proyectado, depreciación avanzada (ya hay ejercicio básico), presupuesto vs real (variaciones).
- Regla de oro R-09: los goldens deben salir de este motor, nunca hardcodeados en el frontend.

### G2. Componente de gráficas reutilizable (`alumnos/src/components/charts/` — NO existe)
- Hoy: SVG/CSS dispersos por sim. Propuesta: un `ChartKit` propio (SVG, sin dependencias externas — coherente con "sin CDNs" del proyecto) con `LineChart`, `BarChart`, `DonutChart`, `TablaAmortizacion` que reciba `series: number[]` + `labels` y dibuje ejes/valores.
- `BiSim.tsx` es la referencia a extraer (línea diaria + barras + donut ya funcionan con datos reales).

### G3. Datasets financieros deterministas
- Como `documentGenerator`/`caseGenerator` (semilla `mulberry32`), pero para escenarios: empresa con 12 meses de ventas/costos, crédito con tasa/plazo, mezcla de productos para punto de equilibrio. Deterministas por semilla para que el instructor reproduzca el mismo caso en clase.

### G4. Teoría financiera estructurada
- El molde `PracticaCurso`/`PracticaPrueba` existe, pero no hay contenido de finanzas (todo es contable-operativo: CFDI, IVA, nómina, DIOT). Falta redactar teoría + quiz por tema financiero con rigor (fórmulas, interpretación, errores comunes).

### G5. Rol/vista de instructor
- Hoy solo hay alumno y staff (seguimiento). Un instructor necesita: elegir tema, fijar semilla del caso, ver intentos del grupo, proyectar la gráfica. Esto es una extensión del `StaffControlCenter` o una vista nueva — definir alcance en la rama.

---

## 3. Propuesta: simulador "Finanzas con gráficas + teoría"

### 3.1 Estructura por tema (copia el molde R-13.5)
Cada tema = 4 piezas, en este orden:
1. **Teoría** (`PracticaCurso`-like): qué es, fórmula, interpretación, ejemplo resuelto, errores comunes. Con quiz de 2–3 preguntas (`PracticaPrueba`-like, `aprobarMin: 70`).
2. **Práctica numérica**: captura en hoja (`SpreadsheetSim`, fórmulas reales) o formulario validado por el motor G1.
3. **Gráfica** (`ChartKit` G2): la serie/tabla que el alumno generó se visualiza (ej. curva de amortización capital vs interés; punto de equilibrio con cruce ingresos/costos; razones en radar/barras vs benchmark).
4. **Caso con semilla** (G3): el instructor fija semilla → mismo caso para todo el grupo; validación contra goldens del motor.

### 3.2 Temas sugeridos (orden pedagógico)
1. Interés simple vs compuesto (gráfica: dos curvas divergentes)
2. Amortización de crédito + CAT (gráfica: apilada capital/interés por periodo)
3. Punto de equilibrio (gráfica: cruce ingresos vs costos totales)
4. Razones financieras (gráfica: barras vs benchmark del sector; datos desde asientos reales vía `autoEntries`)
5. Flujo de efectivo y presupuesto vs real (gráfica: líneas real vs presupuestado + variación)

### 3.3 Plan de rama secundaria
- **Branch:** `feat/simulador-financiero` (desde `main`; backend-primero si hay endpoints).
- **Fase A — Motor:** `backend/src/services/finanzas.ts` (interés, amortización, razones, equilibrio, flujo) + `tests/finanzas.test.ts` (TDD rojo→verde; goldens verificados a mano, ej. amortización contra fórmula cerrada).
- **Fase B — ChartKit:** `alumnos/src/components/charts/` (Line/Bar/Donut/Tabla, SVG propio, theme claro/oscuro) extrayendo patrones de `BiSim`; test de render con serie fija.
- **Fase C — Contenido:** 5 temas con teoría + quiz + práctica + gráfica + semilla; endpoints `GET /api/sim/finanzas/temas`, `GET /api/sim/finanzas/caso/:tema?seed=`; validación `POST /api/sim/finanzas/validate` contra el motor.
- **Fase D — Instructor:** alcance mínimo (fijar semilla + ver intentos) como extensión de staff; definir con el instructor antes de codificar.
- **Gates del repo (no negociables):** `tsc` backend+alumnos en 0, `npm run test` verde, `npm run audit:story` verde, sin mojibake, sin secretos, sin assets externos.

### 3.4 Riesgos y decisiones para el instructor
- Alcance teoría: ¿texto propio del instructor o redactado por el equipo? (Los quizzes correctos son contenido pedagógico estable — debe validarlos un experto, como las tarifas ISR/IVA que validan motores hoy.)
- Rigor numérico: definir convenciones (CAT con/sin IVA, año 360/365, redondeo a centavos) ANTES de codificar el motor — son los "goldens" del futuro.
- La rama NO toca workflows contables ni sims Contalink (regla: genérico vs dedicado se mantiene).
