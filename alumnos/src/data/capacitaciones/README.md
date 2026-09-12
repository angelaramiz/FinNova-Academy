# Módulo Capacitaciones Contalink

Un solo `TrainingPlayer` (`alumnos/src/components/TrainingPlayer.tsx`) + 3 juegos
de datos con la misma interfaz. Sin quiz (follow-up fuera de scope).

## Datos

`auditoria.json`, `conciliacion.json`, `nomina.json` — `{titulo, instructor,
duracion, capitulos: [{titulo, inicio}], segmentos: [{start, end, text}]}` con
timestamps reales (whisper `small`, GPU) y capítulos de los temas reales (8 c/u).

Lógica pura compartida: `alumnos/src/lib/capacitaciones.ts`
(`filtrarSegmentos`, `indiceActivo`, `fmtTiempo`, `validarTraining`).

## Cómo regenerarlos

1. Transcribir con timestamps (no basta texto plano):
   `whisper.exe <video>.mp4 --model small --language es --output_format json
   --output_dir <tmp> --fp16 True` (con `PYTHONUTF8=1` en Windows).
2. Derivar capítulos de los temas reales y snappear cada inicio al primer
   segmento `>=` al tiempo elegido.
3. Validar schema: claves exactas, `capitulos >= 5`, segmentos ordenados.
4. Los `.txt`/`.json` crudos de whisper y los `.mp4` (~150-190 MB) NO van al repo.

## Videos

Fuera del repo. Cada módulo recibe `videoSrc` (URL configurable en
`Capacitaciones.tsx` → `VIDEO_SRC`) o el alumno abre el `.mp4` local desde el
propio reproductor (object URL, nada se sube).

## Vista

`alumnos/src/components/Capacitaciones.tsx` instancia el mismo componente 3
veces (tabs). Cableada en `DesktopShell` (pantalla `capacitaciones`, app
“Videos” en `practicasApps`).

## Tests

`tests/capacitaciones.test.ts`: mismo layout ×3 (contrato), destinos de seek
válidos, `indiceActivo`, filtro del buscador, `fmtTiempo`.
