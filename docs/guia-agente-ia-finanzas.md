# Guía del agente IA — Rama experimental de finanzas
> **Lee este documento completo antes de tocar el repo.** Es tu contrato de trabajo.
> Rama: `exp/finanzas-instructor` · Solo localhost · Sin merge a `main` sin el TPM.
> Docs previos (contexto, no repetir): `docs/plan-simulador-financiero-instructor.md` (qué/quién/pedagogía),
> `docs/rama-exp-finanzas-onboarding.md` (setup + alcance mínimo + accesos).
> **Fecha:** 2026-09-19

---

## 0. Orden de lectura obligatoria (30 min)

1. Esta guía completa.
2. `docs/rama-exp-finanzas-onboarding.md` (§2 setup, §3 alcance, §4 contratos).
3. `AGENTS.md` del repo raíz (arquitectura general y reglas de operación).
4. Según lo que vayas a tocar: el motor de referencia (§3.1) y el sim de referencia (§4.1).

Si algo de esta guía contradice una instrucción del instructor, **pregunta antes de actuar** y deja constancia.

---

## 1. Qué es este proyecto (panorama)

Simulador laboral 3D para estudiantes: escritorio virtual con aplicaciones (contabilidad, datos, prácticas) donde completan
tareas validadas por motores reales. Tres repos:

| Repo | Remote | Contenido | Puerto local |
|---|---|---|---|
| Raíz | `github.com/angelaramiz/AuraFi-Academy` | frontend `alumnos/`, `tests/` (55 archivos), `docs/`, `supabase/` | — |
| Backend (submódulo) | `github.com/angelaramiz/Finnova-back` | API Express + motores en `backend/src/services/` | `3001` (`cd backend && npx tsx src/server.ts`) |
| Staff (anidado, ignorado en raíz) | `github.com/angelaramiz/AuraFi-Staff` | panel de seguimiento | proxy `/api` → `localhost:3001` |

Frontend alumnos: React 19 + Vite + Tailwind + React Three Fiber → `cd alumnos && npx vite --port=3000`.
Login demo local: `student_tester@gmail.com` / `demo1234`. Health: `GET localhost:3001/api/health` → 200.

Stack backend: Node + Express + TypeScript (`tsx`), Supabase/PostgreSQL en prod con fallback a memoria en local.
En esta rama trabajas con el fallback en memoria: **no configures Supabase local ni toques la nube**.

---

## 2. Mapa del repo (dónde vive cada cosa)

```
backend/src/
  server.ts              registro de rutas y arranque (puerto 3001)
  routes/                auth, simEngine, workflows, moldes, staff, stage1, vacancies...
  services/              MOTORES (tu zona de trabajo, §3)
  lib/simTime.ts         reloj simulado (NO usar new Date para fechas del mundo)
alumnos/src/
  components/            sims y apps (tu zona UI, §4) + charts/ (lo crearás tú)
  lib/                   api.ts, simTime.ts, theme.ts, bloqueo.ts, ...
  sims/                  sims dedicados Contalink — PROHIBIDO tocar (§7.4)
tests/                   55 archivos vitest, raíz. Comandos: npm run test | npm run audit:story
docs/                    planes y bitácoras (aquí vive esta guía)
supabase/migrations/     migraciones SQL — PROHIBIDO crear/aplicar en esta rama
.agents/                 reglas del equipo base (solo lectura en esta rama)
```

---

## 3. Motores y servicios clave (backend)

### 3.1 Los que debes leer primero (patrones a copiar)

| Archivo | Patrón que te enseña |
|---|---|
| `services/autoEntries.ts` | Funciones puras que generan datos + asientos que cuadran (débitos=créditos). Así debe ser `finanzas.ts`: entrada → números + goldens. |
| `services/excelExercises.ts` | Ejercicio = `initialData` + `solution.expectedCells` + `validationRules` (`exact/range/balanced` con tolerancia). Copia este molde para validar prácticas financieras. |
| `services/workflowEngine.ts` (lectura selectiva) | Coherencia GET→validate por `workflowId` + burbujas guía + trampas. NO lo modifiques; copia el patrón si tu tema lo necesita. |
| `services/advancedDataEngines.ts` + `components/ForecastSim.tsx` | El único motor numérico con serie temporal (media móvil + MAPE). Antecedente directo de tu motor. |
| `lib/simTime.ts` (backend y `alumnos/src/lib/simTime.ts`) | HOY simulado = miércoles 08-jul-2026. Fechas del mundo sim siempre de aquí. |

### 3.2 Servicios de apoyo (úsalos, no los reescribas)

`persistentData.ts` (5 clientes, 4 proveedores, 8 productos) · `chartOfAccounts.ts` (40 cuentas) ·
`paymentMatching.ts` (score pago↔factura) · `progressTracker.ts` (persistencia de progreso; si reportas avance usa
`category:'sim'`, `countsAsCase:true`, best-effort) · `practicasModules.ts` (molde teoría→práctica→quiz→tracker, 1041 líneas:
lee las interfaces `PracticaCurso`, `PracticaPrueba`, no todo el catálogo).

### 3.3 Regla de oro (R-09, inviolable)

> **Lore y texto: libres. Números, fechas y validaciones: SIEMPRE de motores.**
> Todo valor visible sale de una función del backend (o de su golden en test). El frontend jamás calcula ni quema cifras.

---

## 4. Frontend: sims y patrones UI

### 4.1 Referencias a copiar

| Archivo | Qué copiar |
|---|---|
| `components/BiSim.tsx` | Gráficas SVG hechas a mano con datos reales (línea diaria, barras, donut) + filtros. Base de tu `charts/`. |
| `components/SpreadsheetSim.tsx` | Hoja con 40+ fórmulas (SUM, IF, XLOOKUP/BUSCARX, SUMIFS…). Úsala para captura numérica; no construyas inputs si la hoja sirve. |
| `components/LearningSim.tsx` | Lección = intro + puntos + quiz de 2 con `why`. Molde de tu teoría. |
| `alumnos/src/components/GuideBubbles.tsx` | Ayuda contextual anclada por selector CSS. |
| `lib/theme.ts` (`themeColors`) | Todo color sale de aquí (claro/oscuro). Nada de hex quemados sueltos. |

### 4.2 Convenciones UI

- Texto de la app en español (es-MX). Formato moneda `toLocaleString('es-MX')`.
- Sin marcas reales, sin emojis fuera de iconos existentes, sin CDNs ni librerías nuevas sin preguntar (SVG propio primero).
- Accesibilidad mínima heredada: fuentes ≥10px, `aria-label` en controles de gráfica.
- Cuidado PowerShell 5.1: corrompe UTF-8 al escribir; si editas desde terminal usa scripts a archivo o el editor, nunca `echo >`.

---

## 5. Convenciones globales del repo

- **Reloj sim:** `simTime.ts`, HOY = 08-jul-2026. Hora real solo junto a fecha sim. Tus casos financieros usan fechas sim.
- **Determinismo:** casos con semilla (`mulberry32`-style como `caseGenerator.ts`): `seed = hash(usuario:semana:tema:intento)`. Mismo seed = mismo caso (el instructor proyecta un caso y todo el grupo ve lo mismo).
- **Sin-eñe en identificadores:** SQL/código sin `ñ` (ej. columna `anio`). En texto visible sí se usan acentos y eñes.
- **Mojibake:** prohibido introducir secuencias de doble codificación; el test `anti-mojibake` lo detecta y falla.
- **TDD:** test rojo primero con evidencia, luego verde, luego refactor. Cobertura objetivo 80%+.
- **Gates por commit:** `npx tsc --noEmit` (backend y alumnos) + `npm run test` en raíz, todo verde.
- **Commits:** pequeños, `exp(finanzas): ...`, <10 archivos. Nunca a `main`.
- **Backend primero:** si un tema necesita endpoint, primero el motor + test en backend, luego el puntero/UI.

---

## 6. Lo que SÍ puedes hacer (alcance de la rama)

1. Crear `backend/src/services/finanzas.ts` (interés compuesto, amortización; luego razones/equilibrio/flujo si el instructor lo pide).
2. Crear `tests/finanzas.test.ts` (+ los que necesites) con goldens verificados a mano.
3. Crear `alumnos/src/components/charts/` (`LineChart`, luego `BarChart`, `DonutChart`, tabla de amortización) con props, sin datos quemados.
4. Crear el tema demo `interes-compuesto` (teoría mínima + quiz + gráfica de la serie del motor).
5. Endpoints nuevos bajo `/api/sim/finanzas/*` en backend (siguiendo el estilo de `simEngine.ts`).
6. Documentar en `docs/` lo que construyas (actualiza esta guía si cambia un contrato).

## 7. Lo que NO puedes hacer (prohibiciones)

| # | Prohibición | Por qué |
|---|---|---|
| 7.1 | Modificar workflows contables, `autoEntries.ts`, sims Contalink (`alumnos/src/sims/*`), `BiSim.tsx` | Son producción docente; se leen como referencia, no se tocan |
| 7.2 | Quemar cifras en el frontend o "ejemplos" fuera del motor | Rompe la regla de oro; todo número sale del motor o su test |
| 7.3 | Crear/aplicar migraciones Supabase, tocar prod/Render, configurar credenciales | Rama localhost con memoria; cero nube |
| 7.4 | Agregar dependencias npm, CDNs, assets binarios (mp4/txt crudos) | Sin aprobación del instructor |
| 7.5 | Commitear secretos (`.env`, keys, tokens) o datos personales | `.env` es local y gitignored; si lo ves expuesto, avisa, no lo "arregles" en silencio |
| 7.6 | Suponer fórmulas/convenciones (año 360/365, CAT con/sin IVA, redondeo) | Trae fuente del instructor y fíjala por escrito antes de codificar |
| 7.7 | "Arreglar" archivos base en silencio si algo heredado falla | Reporta (rama, commit, comando, salida) y propone; el TPM decide |

## 8. Flujos paso a paso

### 8.1 Empezar (una vez)
1. `git fetch origin && git checkout -b exp/finanzas-instructor origin/main` (raíz y backend; backend con `main`, no con ramas feat).
2. Clonar con submódulos: `git clone --recurse-submodules <raiz>` o `git submodule update --init` dentro.
3. Levantar backend `:3001` y alumnos `:3000` (§1), verificar `/api/health` y login demo.
4. Correr `npm run test` en raíz: debe estar verde antes de codificar.

### 8.2 Agregar una función al motor
1. Fija la convención con el instructor (tasa, redondeo, periodos) y escríbela en el test como comentario.
2. Escribe el test con 2–3 goldens calculados A MANO (calculadora/hoja, no con tu propio código).
3. Ejecuta: rojo (guarda la evidencia del fallo).
4. Implementa lo mínimo en `finanzas.ts`. Verde. Refactor si hace falta.
5. Gates (§5) + commit `exp(finanzas): <qué>`.

### 8.3 Agregar una gráfica
1. Props primero: `{ series: number[]; labels: string[] }` (+ `formato?: 'mxn'|'pct'`).
2. SVG propio, colores de `themeColors`, accesible (`role="img"`, `aria-label`, valores como texto).
3. Test de render con serie fija (ejes, nº de puntos, valor máximo visible).
4. Conéctala a la serie REAL del motor, nunca a datos de ejemplo.

### 8.4 Agregar un tema (teoría + quiz + práctica + gráfica)
1. El instructor entrega/valida la teoría y las respuestas correctas del quiz (contenido pedagógico estable, como las tarifas fiscales que validan expertos).
2. Teoría en molde `PracticaCurso`-like, quiz `PracticaPrueba`-like (`aprobarMin: 70`, cada opción con `explicacion`).
3. Práctica validada contra el motor (molde `excelExercises`: celdas esperadas + reglas con tolerancia).
4. Gráfica con la salida real del alumno calculada por el motor.
5. Demo en localhost con URL + pasos de reproducción para el instructor.

## 9. Interfaces de referencia (copia estos moldes)

```ts
// Ejercicio validable (molde excelExercises.ts)
interface ValidationRule { cell: string; type: 'exact'|'formula'|'range'|'balanced'; expected?: unknown; tolerance?: number; label: string; }
// Quiz (molde practicasModules.ts)
interface PracticaPregunta { q: string; opciones: string[]; correcta: number; explicacion: string; }
// Gráfica (nueva, charts/)
interface ChartProps { series: number[]; labels: string[]; formato?: 'mxn' | 'pct' | 'num'; titulo?: string; }
```

## 10. Checklist pre-commit (todo o no hay commit)

- [ ] `npx tsc --noEmit` backend = 0 y alumnos = 0
- [ ] `npm run test` raíz verde (incluye tus tests nuevos)
- [ ] Ningún número nuevo fuera de motor/test; ningún secreto; ningún archivo base modificado sin reporte previo
- [ ] Commit `exp(finanzas): ...`, <10 archivos, push a `exp/finanzas-instructor` (no `main`)

## 11. Glosario mínimo

**Motor:** función pura del backend que calcula y es fuente de verdad. **Golden:** valor esperado verificado a mano en un test.
**Regla de oro:** números de motores, texto libre. **Seed:** semilla que hace un caso reproducible. **Gate:** verificación obligatoria
(tsc/test/auditoría). **Trap:** error intencional pedagógico (en finanzas, úsalo solo si el instructor lo pide: ej. tasa nominal vs
efectiva). **countsAsCase:** marca de progreso para actividades que cuentan como caso (úsala al reportar avance).
