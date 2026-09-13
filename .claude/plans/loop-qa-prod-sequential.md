# Runbook — Loop QA en producción (sequential, safe)

> Creado: 2026-09-13 | Patrón: sequential | Modo: safe | Estado: LISTO PARA ARRANCAR

## Objetivo
Verificar en producción que lo mergeado a `main` (`5e54200`, puntero revisor-capa2)
está vivo y responde: backend, alumnos, staff + endpoints clave con token demo.

## Precondiciones verificadas
- [x] Repo limpio en `main` (sin cambios pendientes)
- [x] Suite local 417/417 (46 files) antes de la iteración 1
- [x] `ECC_HOOK_PROFILE`: N/A en este entorno (sin hooks ECC) → gates manuales abajo

## Alcance (solo lectura + login demo; cero escrituras en prod)
1. `GET https://finnova-back.onrender.com/api/health` → 200
2. `GET https://finnova-academy.onrender.com` → 200 (nota: puede traer build viejo)
3. `GET https://finnova-staff.onrender.com` → 200
4. `POST /api/auth/login-credentials` (demo) → token
5. Con token: `GET /api/sim/pilot/me`, `POST /api/moldes/auditoria/review` {molde mínimo},
   `GET /api/sim/practicas/modules` → códigos esperados (200 / 400 si falta body)
6. Render plato frío: si el backend duerme, 1er request puede tardar >60s → reintentar 1 vez

## Iteraciones (secuenciales, una a la vez)
| # | Foco | Gate para avanzar |
|---|------|-------------------|
| 1 | Salud backend + frontends (pasos 1-3) | 3 códigos 200 registrados |
| 2 | Auth demo + pilot/me (pasos 4-5a) | token + 200/booleano |
| 3 | Review molde mínimo + módulos (pasos 5b-5c) | veredicto válido / 200 |
| 4 | Reporte PASS/FAIL por endpoint | `docs/qa-prod-2026-09-13.md` escrito |

## Stop conditions (explícitas)
- STOP-OK: iteración 4 completa con reporte escrito.
- STOP-FAIL: 2 fallos de red consecutivos no causados por plato frío → detener y reportar.
- STOP-BLOQUEO: cualquier 401/403/500 inesperado → detener, NO reintentar escrituras, reportar.
- Límite: máx 4 iteraciones, sin excepción.

## Reglas del loop
- Ramas: ninguna (solo lectura; el reporte va a `docs/`, commit directo a main permitido solo para el reporte).
- Cero escrituras en prod: ningún POST fuera de login/review-lectura/override queda PROHIBIDO el override.
- Cada iteración registra: comando, código HTTP, latencia, veredicto.
- TDD no aplica (QA, no código); si se encuentra bug, NO se corrige en el loop → se registra en Pending como hallazgo.
