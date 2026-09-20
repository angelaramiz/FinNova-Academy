# Rama experimental finanzas — Onboarding instructor + agente IA
> **Para:** el instructor y su agente IA. **Ámbito:** rama experimental, SOLO localhost, sin merge a `main` sin el TPM.
> **Filosofía:** solo lo mínimo para cimientos base. Nada de contenido completo hasta que los cimientos pasen gates.
> **Fecha:** 2026-09-19
>
> **Estado 2026-09-20:** rama `exp/finanzas-instructor` creada en GitHub (raíz + backend).
> Cimientos incluidos: motor `finanzas.ts`, `tests/finanzas.test.ts` (8/8),
> `charts/LineChart`, `FinanzasDemo` (teoría+quiz+gráfica, icono "Finanzas (exp)"
> en sets contable y prácticas) y `GET /api/sim/finanzas/demo` verificado en vivo
> (montoFinal=11268.25). Gates: tsc 0/0, suite 538/538, build alumnos OK.

---

## 1. La rama experimental

- **Nombre:** `exp/finanzas-instructor` (crear desde `main` actualizado).
- **Reglas duras:**
  1. Todo se prueba en **localhost**. Prohibido apuntar a Render/prod o tocar Supabase remoto desde esta rama.
  2. **No hay merge a `main`** sin revisión del TPM. La rama puede avanzar y romper cosas; `main` no.
  3. Cero secretos en el repo (`.env` local, gitignored). Cero videos/mp4/txt crudos. Cero CDNs externos.
  4. No tocar `backend/src/services/workflowEngine.ts`, `autoEntries.ts`, sims Contalink (`alumnos/src/sims/*`), ni `BiSim.tsx` (solo leerlos como referencia).

## 2. Setup localhost (5 min)

Requisitos: Node 20+ y el repo clonado.

```bash
# 1) Backend (puerto 3001)
cd backend
npx tsx src/server.ts

# 2) Frontend alumnos (puerto 3000) — otra terminal
cd alumnos
npx vite --port=3000 --host=0.0.0.0

# 3) Abrir http://localhost:3000 — login demo:
#    student_tester@gmail.com / demo1234
```

Verificación: `GET http://localhost:3001/api/health` → 200. Tests raíz: `npm run test` (debe estar verde ANTES de empezar; si no, avisar al TPM, no "arreglar" main desde aquí).

## 3. Alcance mínimo: solo cimientos base

Nada de 5 temas ni vista de instructor todavía. Los cimientos = 3 archivos nuevos + 1 test:

| # | Archivo (nuevo) | Contenido mínimo |
|---|---|---|
| 1 | `backend/src/services/finanzas.ts` | 2 funciones: `interesCompuesto(capital, tasaAnual, periodosPorAnio, anios)` → serie por periodo + monto final; `amortizacion(monto, tasaAnual, pagos)` → tabla {pago, interes, capital, saldo} + total intereses. Redondeo a centavos, año de 12 meses. |
| 2 | `tests/finanzas.test.ts` | TDD: goldens verificados a mano (ej. $10,000 al 12% anual capitalizable mensual a 1 año = $11,268.25; primera fila de amortización calculada a mano). Falla 1 centavo = falla. |
| 3 | `alumnos/src/components/charts/LineChart.tsx` | SVG propio (sin librerías): props `{ series: number[]; labels: string[] }`, ejes + valores, respeta theme claro/oscuro. Sin datos quemados: todo por props. |
| 4 | Tema demo `interes-compuesto` | Teoría mínima (fórmula + 1 ejemplo + 2 preguntas quiz) + gráfica que dibuja la serie del motor. Sirve como plantilla de los demás temas. |

**Definition of done de cimientos:** motor con tests verdes + gráfica dibujando la serie real del motor + `tsc` 0 + `npm run test` verde + demo visible en localhost.

## 4. Contratos para el agente IA (leer antes de codificar)

1. **Los números mandan:** todo valor que ve el alumno sale del motor (`finanzas.ts`). El frontend NUNCA calcula ni quema cifras. Test que compare contra número escrito a mano en el test, no contra otro cálculo del mismo motor.
2. **Convenciones numéricas (fijar antes de codificar):** moneda MXN, redondeo a 2 decimales por periodo, tasa nominal anual con capitalización indicada explícitamente, año 12 meses. Si el instructor cambia una convención, cambian motor + tests juntos.
3. **TDD obligatorio:** test rojo primero (pegar evidencia del fallo), luego implementación. Sin test no hay merge ni siquiera a la experimental.
4. **Gates antes de cada commit:** `npx tsc --noEmit` (backend y alumnos) + `npm run test` en raíz. Commit pequeño, mensaje `exp(finanzas): ...`.
5. **Prohibido:** inventar tasas/montos "de ejemplo" fuera del motor; copiar estilos de marcas reales; agregar dependencias npm sin preguntar (SVG propio primero); tocar archivos fuera del alcance §3 sin avisar al instructor.
6. **Preguntar antes de:** suponer una fórmula (traer fuente: libro/artículo del instructor), elegir redondeo, o desviarse del alcance mínimo.

## 5. Flujo de trabajo instructor ↔ agente

1. El instructor fija **convenciones** (§4.2) y valida la **teoría** de cada tema (el quiz correcto lo define él, no el agente).
2. El agente implementa en TDD y demuestra en localhost (URL + pasos para reproducir).
3. El instructor verifica el cálculo a mano con 1 caso; si cuadra, se marca el tema como "cimentado".
4. Solo con cimientos verdes (§3, DoD) se pide al TPM la siguiente fase (más temas, casos con semilla, vista instructor).

## 6. Accesos a los 3 repos/servicios (verificado 2026-09-19)

| Repo / servicio | URL | Qué contiene | Acceso que necesita |
|---|---|---|---|
| Raíz `AuraFi-Academy` | `github.com/angelaramiz/AuraFi-Academy` | frontend `alumnos/`, `tests/`, `docs/` | **Lectura + push de rama** `exp/finanzas-instructor` (aquí viven gráfica, tests y tema demo) |
| Backend `Finnova-back` (submódulo) | `github.com/angelaramiz/Finnova-back` | API + motores | **Lectura + push de rama** (aquí vive `finanzas.ts`); el puntero del submódulo se actualiza en la raíz |
| Staff `AuraFi-Staff` (repo anidado, ignorado en raíz) | `github.com/angelaramiz/AuraFi-Staff` | panel staff | **Nada por ahora** (solo se toca en Fase D instructor); lectura opcional |
| Render (3 servicios prod) | — | deploys | **Sin acceso** — la experimental es solo localhost por diseño |

Notas: el backend está como submódulo (requiere `git submodule update` al clonar con `--recurse-submodules`); los nombres AuraFi vs FinNova están pendientes de unificación (no bloquear por esto). Modelo sugerido: colaborador con Write en raíz+backend, o fork + PR si prefieres aislarlo.

## 7. Pedir ayuda al equipo base

Si algo del repo base bloquea (puertos, tests rojos heredados, dudas de un motor existente), reportar con: rama, commit, comando ejecutado, salida del error. No "arreglar" archivos base en silencio: proponer el cambio al TPM.
