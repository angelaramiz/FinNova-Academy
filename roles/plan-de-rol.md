# R-13 — Prácticas Profesionales: ruta guiada de contabilidad

**Fecha**: 20-ago-2026 · **Estado**: IMPLEMENTADO Y DESPLEGADO (gates verdes; backend + alumnos en prod)

## R-13.5 — Tracker semanal + Pruebas por tema + Curso teórico con NPC capacitador

**Solicitado por usuario (20-ago-2026)**: tracker semanal con tareas por tema REPETIDAS para mecanizar (memoria muscular del procedimiento) con explicación necesaria, prueba de conocimiento/comprensión al final de cada tema, y curso básico teórico explicado por un NPC "capacitador".

### Diseño

- **Tracker semanal**: `buildPracticasTracker(month, year)` en `practicasModules.ts` deriva las semanas del PLAN REAL (`generateMonthPlan` de taskPlanner) → agrupa tareas por tipo con conteo real y agrega explicación pedagógica de por qué se repite cada una (mecanización). Cada semana = tema (módulo) con su objetivo.
- **Prueba por tema**: cada módulo gana `prueba: PracticaPrueba` (título, % mínimo para aprobar, preguntas con opciones, índice correcto y explicación). Endpoint `POST /api/sim/practicas/prueba/:id` evalúa respuestas (índices) y devuelve score + feedback por pregunta.
- **Curso teórico**: cada módulo gana `curso: PracticaCurso` (introducción del NPC, secciones con teoría + línea de diálogo del capacitador, cierre). Endpoint `GET /api/sim/practicas/curso/:id` + `GET /api/sim/practicas/cursos`.
- **NPC capacitador**: nuevo NPC `capacitador` en worldBible (company `lno`, route `contable`) — cumple `npcAuthorized` de story-coherence.
- **Frontend**: `PracticasModules.tsx` gana tabs "📚 Módulos / 📅 Tracker / 🎓 Curso" (prop `initialTab`), quiz embebido al final de cada módulo y por semana, y visor de curso con avatar del capacitador + burbujas de diálogo + navegación por secciones. DesktopShell agrega apps "📅 Tracker" y "🎓 Curso" al appSet practicas.

### Regla de oro
- Conteos de repetición salen del plan real (`generateMonthPlan`), no hardcodeados.
- Respuestas correctas de la prueba = contenido pedagógico estático (no IA); la validación de tareas reales NO se toca.
- El NPC capacitador es narrativa (no afecta motores); coherencia vía `auditPracticasModules` + story-coherence.

### Tests
- `tests/practicas-modules.test.ts` (ampliado a 32): tracker 4 semanas coherentes con plan real, cada repetición explica por qué, cada módulo tiene prueba con índice correcto válido y curso con NPC capacitador, endpoints responden, prueba evalúa bien/mal.

### Gates
- `npm run test` + `npm run audit:story` + `npx tsc --noEmit` backend + builds alumnos/staff.

---

## R-13 (base) — resumen

**Fecha**: 20-ago-2026 · **Estado**: IMPLEMENTADO (gates verdes, pendiente deploy)

## Objetivo

Crear una **ruta nueva** del simulador para alumnos reales de contabilidad (mitad / ¾ de carrera) que funcione como **prácticas profesionales**: el alumno "trabaja" el puesto de Contador General Jr en Logística del Norte con **guía pedagógica por módulos y procedural** — burbujas que explican exactamente qué se hace en cada portal (SAT/CFDI), qué datos se usan y cómo registrarlos.

## Decisiones de producto (confirmadas con usuario)

1. **Activación**: una **ruta nueva** (nueva especialidad `practicas`) seleccionable en el onboarding.
2. **Burbujas**: botón **"💡 Guía"** flotante por paso + burbuja secuencial anclada al elemento (patrón del TutorialOverlay existente).
3. **Contenidos**: **por módulos y procedural** (módulos que enseñan el flujo completo paso a paso, no tareas sueltas).

## Arquitectura

### Backend

| Archivo | Cambio |
|---------|--------|
| `services/workflowEngine.ts` | `WorkflowStep` gana `guides?: GuideBubble[]`. Nuevo workflow `business_expense` (gasto por comida empresarial). |
| `services/workflowEngine.ts` | Guías (burbujas) en `invoice_emission` (portal SAT, CFDI 4.0, RFC, uso CFDI, régimen, método de pago, IVA 16%), `supplier_invoice`, `payment_registration`. |
| `services/autoEntries.ts` | `generateBusinessExpenseEntries` (asiento de gasto con IVA acreditable). |
| `services/practicasModules.ts` (NUEVO) | Catálogo de módulos con pasos procedurales (cada paso = guía + workflow real). |
| `routes/simEngine.ts` | `GET /api/sim/practicas/modules` y `GET /api/sim/practicas/modules/:id`. |

### Frontend (alumnos)

| Archivo | Cambio |
|---------|--------|
| `components/GuideBubbles.tsx` (NUEVO) | Botón "💡 Guía" + burbujas secuenciales ancladas al paso. |
| `components/DesktopShell.tsx` | Nueva screen `'practicas'` (currículum de módulos), specialty `practicas` usa apps contables + app "📚 Módulos", render de `guides` en cada paso del workflow. |
| `components/PracticasModules.tsx` (NUEVO) | Vista del currículum: lista de módulos con progreso + detalle procedural del módulo activo. |
| `components/Onboarding.tsx` | Nueva especialidad "🎓 Prácticas Profesionales de Contabilidad". |
| `components/SimuladorLaboral.tsx` | Propagar specialty `practicas` (como contable, con banner propio). |

## Módulos (currículum procedural)

| # | Módulo | Workflow(s) | Guía clave |
|---|--------|-------------|-----------|
| 1 | **Facturación electrónica (CFDI 4.0)** | `invoice_emission` | Portal SAT: qué es CFDI, qué datos lleva (RFC, uso CFDI, régimen, método de pago), por qué el IVA es 16%, qué es el complemento de pagos. |
| 2 | **Gastos internos: comida empresarial** | `business_expense` | Leer un ticket de restaurante: RFC del establecimiento, subtotal, IVA desglosado, propina (no deducible), total; deducibilidad 65% restaurantes; asiento de gasto + IVA acreditable. |
| 3 | **Cobranza y pagos** | `payment_registration`, `payment_scheduling` | Aplicar un pago a factura, SPEI, antigüedad de saldos. |
| 4 | **Proveedores y CFDI de gastos** | `supplier_invoice`, `cfdi_reception` | Validar un CFDI de proveedor, IVA acreditable, requisitos fiscales. |
| 5 | **Nómina** | `payroll` | Sueldo bruto, ISR por tabla, IMSS, PTU, dispersión. |
| 6 | **Conciliación y cierre** | `bank_reconciliation`, `cash_cut` | Cuadrar banco, diferencias, corte de caja. |

Cada módulo = pasos procedurales: **Guía conceptual → Correo → Herramienta (spreadsheet/form) → Resultado → Asiento explicado**.

## Tipos

```ts
// workflowEngine.ts
export interface GuideBubble {
  id: string;
  title: string;
  body: string;          // qué se hace / qué datos se usan
  anchor?: string;       // selector CSS del elemento a resaltar
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// WorkflowStep.guides?: GuideBubble[]
```

## Reglas

- Números/validaciones SIEMPRE de los motores reales (`workflowEngine`, `autoEntries`, `persistentData`).
- Las guías son contenido pedagógico (estático), no alteran la validación.
- La ruta `practicas` NO toca las rutas data (story-coherence sigue intacto).

## Tests

- `tests/practicas-modules.test.ts`: guías presentes en los workflows, estructura del workflow `business_expense`, validación correcta (propina no deducible, IVA acreditable), catálogo de módulos completo, cada paso referencia un workflow real.
- Gates: `npm run test` + `npm run audit:story` + `npx tsc --noEmit` backend + build alumnos.

## Fases de implementación

1. **Fase 1 (backend)**: tipos `GuideBubble`, guías en workflows existentes, workflow `business_expense`, `autoEntries`, módulos + endpoints.
2. **Fase 2 (frontend)**: `GuideBubbles`, `PracticasModules`, DesktopShell (specialty + screen + guides), Onboarding, SimuladorLaboral.
3. **Fase 3 (tests + docs)**: tests, agents.md, verificación end-to-end.