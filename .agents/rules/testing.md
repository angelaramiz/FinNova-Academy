# Reglas de Testing y Verificación

1. Backend: ejecutar `npm run build` en `backend/` cuando se toque API o tipos del servidor.
2. Web: ejecutar `npm run lint` y, si aplica, `npm run build` en `alumnos/` y/o `staff/`.
3. Android: compilar con Gradle cuando se toque `app/` y el entorno lo permita.
4. Validar manualmente los flujos críticos afectados por el cambio.
5. Si un endpoint lo consumen varias superficies, probar al menos una de cada tipo impactado.
