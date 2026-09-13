import type { TrainingCapitulo, TrainingSegmento } from '../components/TrainingPlayer';

// TASK-1-1 (Revisor de moldes, Capa 1 dura): validador estructural puro.
// Molde = JSON de capacitacion + contrato. Reutiliza los tipos de
// TrainingPlayer (no duplica tipos) y es superset con rutas de
// validarTraining (lib/capacitaciones.ts): cada error trae su ruta
// (`capitulos[3]`, `segmentos[120]`) en vez de un codigo generico.

const CLAVES_MOLDE = ['titulo', 'instructor', 'duracion', 'duracionTxt', 'capitulos', 'segmentos'];
const CLAVES_CAP = ['titulo', 'inicio'];
const CLAVES_SEG = ['start', 'end', 'text'];

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateMolde(molde: unknown): string[] {
  const errores: string[] = [];
  if (!esObjeto(molde)) {
    return ['molde: debe ser un objeto'];
  }
  const claves = Object.keys(molde);
  for (const k of claves) {
    if (!CLAVES_MOLDE.includes(k)) errores.push(`molde: clave inesperada '${k}'`);
  }
  for (const k of CLAVES_MOLDE) {
    if (!(k in molde)) errores.push(`molde: falta clave '${k}'`);
  }
  if (typeof molde.titulo !== 'string' || !molde.titulo.trim()) {
    errores.push('molde: titulo debe ser texto no vacio');
  }
  if (typeof molde.instructor !== 'string' || !molde.instructor.trim()) {
    errores.push('molde: instructor debe ser texto no vacio');
  }
  if (typeof molde.duracion !== 'number' || !(molde.duracion > 0)) {
    errores.push('molde: duracion debe ser numero > 0');
  }
  if (typeof molde.duracionTxt !== 'string' || !molde.duracionTxt.trim()) {
    errores.push('molde: duracionTxt debe ser texto no vacio');
  }

  const duracion = typeof molde.duracion === 'number' ? molde.duracion : 0;

  if (!Array.isArray(molde.capitulos) || molde.capitulos.length < 5) {
    errores.push('molde: capitulos debe ser arreglo con >= 5');
  }
  if (!Array.isArray(molde.segmentos) || molde.segmentos.length === 0) {
    errores.push('molde: segmentos debe ser arreglo no vacio');
  }

  const segmentos: TrainingSegmento[] = Array.isArray(molde.segmentos)
    ? (molde.segmentos as TrainingSegmento[])
    : [];
  segmentos.forEach((s, j) => {
    const ruta = `segmentos[${j}]`;
    if (!esObjeto(s)) {
      errores.push(`${ruta}: debe ser un objeto`);
      return;
    }
    for (const k of Object.keys(s)) {
      if (![...CLAVES_SEG, 'speaker'].includes(k)) errores.push(`${ruta}: clave inesperada '${k}'`);
    }
    if (typeof s.start !== 'number' || typeof s.end !== 'number' || typeof s.text !== 'string') {
      errores.push(`${ruta}: tipos {start, end: number; text: string}`);
      return;
    }
    if (s.start < 0) errores.push(`${ruta}: start < 0`);
    if (s.start > s.end) errores.push(`${ruta}: start > end`);
    if (!s.text.trim()) errores.push(`${ruta}: text vacio`);
    if (j > 0) {
      const prev = segmentos[j - 1];
      if (esObjeto(prev) && typeof prev.start === 'number' && s.start < prev.start) {
        errores.push(`${ruta}: fuera de orden por start`);
      }
    }
  });

  if (Array.isArray(molde.capitulos)) {
    (molde.capitulos as TrainingCapitulo[]).forEach((c, i) => {
      const ruta = `capitulos[${i}]`;
      if (!esObjeto(c)) {
        errores.push(`${ruta}: debe ser un objeto`);
        return;
      }
      for (const k of Object.keys(c)) {
        if (!CLAVES_CAP.includes(k)) errores.push(`${ruta}: clave inesperada '${k}'`);
      }
      if (typeof c.titulo !== 'string' || !c.titulo.trim()) {
        errores.push(`${ruta}: titulo debe ser texto no vacio`);
      }
      if (typeof c.inicio !== 'number') {
        errores.push(`${ruta}: inicio debe ser numero`);
        return;
      }
      if (c.inicio < 0 || c.inicio > duracion) {
        errores.push(`${ruta}: inicio fuera de [0, duracion]`);
        return;
      }
      const anclado = segmentos.some(
        (s) => esObjeto(s) && typeof s.start === 'number' && Math.abs(s.start - c.inicio) < 1,
      );
      if (!anclado) errores.push(`${ruta}: inicio a >= 1s de todo segmento real`);
    });
  }

  return errores;
}
