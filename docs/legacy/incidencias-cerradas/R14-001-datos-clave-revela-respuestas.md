# R-14 INC-001 — "Datos clave" revela respuestas y rompe pedagogía

**Fecha reporte:** 2026-08-26  
**Severidad:** Alta (pedagógica) — bloquea evaluación real  
**Ruta afectada:** `practicas` (Prácticas Profesionales)  
**Workflow:** `business_expense` (Módulo 2 — Gastos internos)  
**Componentes:** `alumnos/src/lib/workflowDoc.ts`, `alumnos/src/components/DualViewLayout.tsx`, `alumnos/src/components/DataHighlight.tsx`, `backend/src/services/workflowEngine.ts`  
**Evidencia:** Screenshots 2026-08-26 — panel naranja "Datos clave para copiar al portal" muestra todos los montos con respuesta ($3,929.00, $393.00, $629.00, $4,951.00, $2,554.00, $629.00) y el documento iframe repite la tabla completa. La hoja de la izquierda pide "Calcular los valores marcados en amarillo" pero el valor ya es visible a la derecha.

---

## 1. Descripción del error

El panel **"Datos clave para copiar al portal"** (DualViewLayout + DataHighlight + `getWorkflowHighlightFields`) expone los `cell_B` del spreadsheet como valores listos para copiar. Para `business_expense` son 6 filas; 2 de ellas (`Subtotal del ticket`, `Propina (no deducible)`) son justamente los campos que el alumno debe **extraer del ticket** (inputs), no copiar del panel.

Efecto: alumno no necesita leer el ticket ni hacer inferencia; copia y pega.

Segundo problema: el panel no aporta el mapeo **origen → destino** que SÍ tiene la burbuja Guía (`💡 Guía`): no dice qué dato viene del ticket vs. qué va al portal, ni menciona **RFC, empresa, razón social** — los datos de cabecera que el alumno sí debe anotar primero (ver plan R-14, `docs/plan-integracion-practicas-realista.md:42`).

## 2. Plan R-14 (qué se acordó)

- R-14, §3-4: *La pista no da la respuesta; dice qué dato va en qué input; se marca en el documento de dónde extraerlo.*
- R-14, §5 Glosario: ticket provee `RFC del establecimiento, razón social, folio, fecha, subtotal, IVA, propina, total` — la hoja pide registrar esos en el portal.

## 3. Causa raíz

- `workflowDoc.getWorkflowHighlightFields()` itera `stepData.rows` y pushea **todo** `cell_B` con valor monetario, sin distinguir editable vs. calculado y sin cabeceras.
- `DualViewLayout` inicia con `showHighlight = true` y título "Datos clave para copiar al portal:" — semánticamente invita a copiar.
- `workflowEngine.generateBusinessExpenseWorkflow`: el `email.body` ya revela `Subtotal/IVA/Propina/Total` (necesario para test), pero el documento derivado (`workflowDoc`) repite todo. La cabecera del ticket (`Razón social, RFC OLN-220701-ABC`) está hardcodeada en `ctx` (OLN-220701-ABC) y **no** es la del email (`LPN-880707-ABC` → La Parrilla del Norte), inconsistencia adicional.

## 4. Impacto

- Métrica de aprendizaje inválida (falsos positivos).
- El alumno no practica "leer ticket → ubicar RFC/empresa".
- El mensaje del capacitador "¿Qué datos del ticket importan?" pierde sentido.

## 5. Comportamiento esperado

- El panel debe estar **colapsado por defecto** (como la burbuja Guía; botón "○ Mostrar pistas" → "◉ Ocultar pistas").
- Cuando se despliega, muestra **pistas de mapeo**, no respuestas:
  - `RFC del establecimiento` → ver en TICKET (encabezado) → campo "RFC" del portal
  - `Razón social / Empresa` → TICKET encabezado → campo "Empresa"
  - `Folio del ticket (TK-xxxxx)` → TICKET encabezado → referencia
  - `Subtotal del ticket` → TICKET tabla línea 1 → campo editable "Subtotal del ticket" (sin mostrar monto)
  - `Propina` → TICKET línea 2 → campo editable "Propina" (sin monto; pista: "no deducible, sin IVA")
  - Campos calculados (`IVA 16%, Total, Gasto deducible 65%, IVA acreditable`) → pista de fórmula, no valor.
- Los valores numéricos solo aparecen como **feedback tras validar**, no antes.
- La cabecera del documento debe coincidir con el ticket del email (LPN-880707-ABC / La Parrilla del Norte), no OLN-220701-ABC.

---

# R-14 INC-002 — Orden de primera tarea incoherente (calendario vs. progreso)

**Fecha reporte:** 2026-08-26  
**Severidad:** Media  
**Ruta:** `practicas`  
**Componente:** `backend/src/services/taskPlanner.ts` → `PRACTICAS_WEEKS`, `generateMonthPlan` + `simTime` (08-jul-2026)

## Descripción

`PRACTICAS_WEEKS` es un calendario anclado a **semana del mes** (1-4), y `generateMonthPlan` / `todayTasks` resuelven la tarea por `simToday()` (08-jul = semana 2). Un alumno que **acaba de iniciar** prácticas el 08-jul cae directo en **Módulo 2 — Gastos/Ticket** (`business_expense`), saltándose el **Módulo 1 — CFDI/Factura** (factura es el flujo base que el practicante debe dominar primero).

En el screenshot el usuario está en `business_expense` como primera tarea visible; el batch de `generateBusinessExpenseWorkflow` es matemático (`subtotal+propina → deducible`) y la guía menciona "identifica RFC" pero la hoja no tiene campo RFC — disonancia. El estudiante percibe que la práctica "no tiene coherencia: quien no sabe anotar datos de gasto (RFC) ¿por qué hace suma de subtotal+propina?".

## Causa raíz

- Avance por **calendario sim** en lugar de **progreso del alumno** (`sim_progress`). Nuevo usuario ≠ semana 1 garantizada.
- Desalineo forma/fondo: la guía enseña "lee RFC/empresa", la hoja evalúa "65% restaurantes".

## Comportamiento esperado

- Opción A (recomendada): progresión por **módulo desbloqueado** (completar Módulo 1 desbloquea Módulo 2). `PRACTICAS_WEEKS` define currículo, pero `todayTasks` debe priorizar el siguiente módulo no completado.
- Opción B interina: banner "Estás en Módulo 2 — Módulo 1 pendiente" + CTA a Módulo 1, y añadir campo `RFC/Empresa` al registro de gasto para que guía ↔ hoja coincidan.
- Hoja `business_expense`: añadir fila `RFC del establecimiento` (input texto) o mover la extracción de RFC a un `form` previo al `spreadsheet`, como en `invoice_emission`.

---

## Acciones correctivas propuestas (para fix)

1. `workflowDoc.getWorkflowHighlightFields()` → filtrar filas editables (sin `formula`) y devolver `hint` sin `value`; añadir entradas de cabecera `Empresa / RFC / Folio / Razón`.
2. `DualViewLayout.tsx` + `DataHighlight.tsx` → `showHighlight = false` por defecto, título y copy cambiados a "Pistas: dónde está cada dato", botón tipo Guía.
3. `generateBusinessExpenseWorkflow` / `workflowDoc.getWorkflowDocumentHtml` → cabecera consistente con `generateBusinessExpenseWorkflow` (LPN-880707-ABC) y/o parametrizar `ctx` con datos del email.
4. `taskPlanner` → evaluar `todayTasks` por progreso; si el alumno no completó Módulo 1, priorizarlo aunque el calendario diga semana 2.
5. Tests: `tests/workflowDoc.test.ts` nuevo — verifica que para `business_expense` no se exponga `cell_B` de filas editables y que exista hint de RFC.

---

## RESUELTO (2026-08-26) — fix desplegado

### Bug crítico adicional encontrado: business_expense AUTO-APROBABA siempre
En `/validate` (workflows.ts:53-54) las reglas cuyo campo el alumno no envía se saltan (`continue`). En `business_expense`, las únicas filas editables eran `Subtotal` y `Propina` (sin fórmula), pero las 4 reglas de validación apuntaban a filas **calculadas** (read-only, nunca enviadas) → `maxPossible=0` → `passed=true` siempre. El workflow no evaluaba nada. El test existente solo verificaba la definición del objeto, no el runtime.

### Cambios
- **Backend `workflowEngine.generateBusinessExpenseWorkflow`** (`36aaef5`): las 9 filas del spreadsheet ahora son **editables** — el alumno transcribe `Empresa/Razón social`, `RFC del establecimiento`, `Folio`, `Subtotal`, `Propina` y **calcula** `IVA 16%`, `Total pagado`, `Gasto deducible 65%`, `IVA acreditable`. Se eliminan las fórmulas pre-llenadas. Validación real sobre **cada** campo (9 reglas, maxPossible=26, umbral 60%). La guía enseña el asiento `5-03 / 2-03 / 1-02` y la propina como no deducible `5-08`.
- **Frontend `workflowDoc.getWorkflowDocumentHtml`** (`a70652e`): el panel derecho de `business_expense` ahora renderiza un **ticket real de restaurante** (fuente con valores visibles: La Parrilla del Norte, RFC LPN-880707-ABC, folio, subtotal/IVA/propina/total), de donde el alumno extrae datos. Filas calculadas genéricas enmascaradas como "→ Calcúlalo" (no revelar respuesta). `getWorkflowHighlightFields` devuelve pistas de mapeo (ocultas por defecto, como la burbuja Guía).
- **Tests** (`practicas-modules.test.ts`, 31): nuevo test anti-regresión "NO auto-aprueba" — respuestas correctas = 100% y pasan; incorrectas reprueban; y verifica que cada fila editable tiene su regla.

### Pendiente (INC-002)
- Orden de primera tarea: `PRACTICAS_WEEKS` ancla por semana del mes (08-jul = semana 2 → Módulo 2 antes que Módulo 1). Propuesto: progresión por módulo desbloqueado en `todayTasks` en vez de por fecha sim. No aplicado en este fix.
