# PENDING — Prueba de practicante a los módulos restantes (siguiente sesión)

> Origen: la prueba que se hizo en DIOT (subagente rol practicante →
> piloto → práctica → reporte de experiencia → corrección de fallos B/C/M).
> Rama de referencia: `fix/diot-practicante-hallazgos` (merge `1e12536`).
> Test que audita el HTML real: `tests/diot-unificado.test.ts`.
> Hallazgos DIOT de ejemplo a revisar también aquí: tutorial invisible,
> botones muertos por flags, errores indetectables con lo visible,
> preview/folio sobre datos sin filtrar, timers fugados, textos que
> contradicen la regla enseñada, "Repetir" que resetea todo.

## Módulo 1 — Nómina (`alumnos/src/sims/NominaSim.tsx` + `nominaEngine.ts`)
- [ ] Recorrido practicante: 13 pasos empresa → timbrado con datos del video.
- [ ] Alta con RFC 13 / CURP 18 / NSS 11: verificar que cada rechazo educa (📚) y no solo bloquea.
- [ ] Vista previa CFDI (`vistaPreviaCFDI`) antes de timbrar: confirmar que sello/UUID son deterministas y que exige receptor válido.
- [ ] Incidencias antes de calcular: ¿el flujo pide aprobar HE/vacaciones o calcula directo?
- [ ] Reporte de experiencia + corrección de fallos (severidad BLOQUEA/CONFUNDE/MENOR).

## Módulo 2 — Conciliación (`ConciliacionSim.tsx` + `conciliacionEngine.ts`)
- [ ] Recorrido practicante: alta → convertidor → carga → manual → auto → casos → cierre.
- [ ] 8 casos del webinar intactos (canon): verificar que ningún fix los altera (`tests/conciliacion-sim.test.ts`).
- [ ] Modo Caso Real (`CASO_REAL_FILAS` + `resolverCasoReal`): verificar que las 4 suciedades son detectables con lo visible y que eliminar penaliza.
- [ ] Partidas en tránsito: verificar que marcar en tránsito afecta el saldo conciliado y que eliminar es error grave.
- [ ] Reporte de experiencia + corrección de fallos.

## Módulo 3 — Auditoría (`AuditoriaSim.tsx` + `auditoriaEngine.ts`)
- [ ] Recorrido practicante: hoja → cuadre DIOT=hoja=reporte → SAT → póliza → casos ABC → certificado.
- [ ] Goldens (4606 / 194.67 / 464 / 99.11): verificar que cada desvío educa y apunta al origen (hoja vs portal vs DIOT).
- [ ] Casos ABC: verificar que los distractores no son adivinanza y que la pista enseña.
- [ ] Gate M1 (DIOT bloqueado): verificar que el aviso explica cómo desbloquear.
- [ ] Reporte de experiencia + corrección de fallos.

## Cierre de sesión
- [ ] Tests nuevos por módulo (estilo `caso-real` / `lecciones-errores` / conductuales).
- [ ] Gates: `npm run test` (root) + `npm run audit:story` + `tsc` alumnos/backend + build.
- [ ] Verificación en Chrome DevTools local antes del commit (sin navegador no se cierra).
- [ ] Merge a `main` + hook front solo con aprobación.
