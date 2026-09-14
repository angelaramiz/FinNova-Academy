// TASK-O1 — Helpers puros de la entrada OS (bloqueo + transición).
// Fecha del mundo simulado (SIM_DATE); la hora que se muestra es real.
// Sin marcas, sin logos. Cero LLM.
import { SIM_DATE } from './simTime';

export type SpecialtyId = 'accounting' | 'data_engineering' | 'practicas';

const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// "miércoles, 8 de julio de 2026"
export function fechaSimLarga(): string {
  return `${DIAS_LARGO[SIM_DATE.getDay()]}, ${SIM_DATE.getDate()} de ${MESES_LARGO[SIM_DATE.getMonth()]} de ${SIM_DATE.getFullYear()}`;
}

export function etiquetaRol(specialty: SpecialtyId): string {
  if (specialty === 'practicas') return 'Practicante de Contabilidad';
  if (specialty === 'data_engineering') return 'Analista de Datos';
  return 'Contador General Jr';
}

// Fundido de ~1s; 0 si el usuario prefiere movimiento reducido.
export function duracionTransicion(reducedMotion: boolean): number {
  return reducedMotion ? 0 : 1000;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// TASK-O2 — Wallpapers por especialidad: CSS local, cero assets/peso.
// Practicas (Contalink cálido), accounting (corporativo sobrio),
// data_engineering (oscuro técnico).
const WALLPAPERS: Record<SpecialtyId, string> = {
  practicas: 'linear-gradient(160deg, #92400e 0%, #451a03 45%, #1c1917 100%)',
  accounting: 'linear-gradient(160deg, #1e40af 0%, #1e3a8a 50%, #0f172a 100%)',
  data_engineering: 'linear-gradient(160deg, #0e7490 0%, #164e63 45%, #020617 100%)',
};

export function wallpaperPorEspecialidad(specialty: SpecialtyId): string {
  return WALLPAPERS[specialty] ?? WALLPAPERS.accounting;
}

// Feature flag VITE_OS_ENTRY (default ON = entrada OS; OFF = 3D intacto).
export function osEntryEnabled(valor: string | undefined): boolean {
  return valor !== 'OFF';
}

// TASK-O3 — Personalización persistida por alumno (localStorage).
// Claves: os_fondo, os_orden_iconos, os_ultima_app.
export interface OsPrefs {
  fondo: string; // 'default' o índice de FONDOS_OS
  ordenIconos: string[];
  ultimaApp: string | null;
}

export const FONDOS_OS = [
  'linear-gradient(160deg, #334155 0%, #0f172a 100%)',
  'linear-gradient(160deg, #065f46 0%, #022c22 100%)',
  'linear-gradient(160deg, #7c2d12 0%, #1c1917 100%)',
  'linear-gradient(160deg, #4c1d95 0%, #0f172a 100%)',
];

const PREFS_DEFAULT: OsPrefs = { fondo: 'default', ordenIconos: [], ultimaApp: null };

export interface AlmacenPrefs {
  get(k: string): string | null;
  set(k: string, v: string): void;
  remove(k: string): void;
}

function almacenDefault(): AlmacenPrefs | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const ls = window.localStorage;
  return {
    get: (k) => {
      try {
        return ls.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        ls.setItem(k, v);
      } catch {
        /* noop */
      }
    },
    remove: (k) => {
      try {
        ls.removeItem(k);
      } catch {
        /* noop */
      }
    },
  };
}

export function cargarPrefs(almacen?: AlmacenPrefs): OsPrefs {
  const store = almacen ?? almacenDefault();
  if (!store) return { ...PREFS_DEFAULT, ordenIconos: [] };
  let orden: string[] = [];
  try {
    const raw = store.get('os_orden_iconos');
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) orden = parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    /* noop */
  }
  return {
    fondo: store.get('os_fondo') ?? PREFS_DEFAULT.fondo,
    ordenIconos: orden,
    ultimaApp: store.get('os_ultima_app'),
  };
}

export function guardarPrefs(p: OsPrefs, almacen?: AlmacenPrefs): void {
  const store = almacen ?? almacenDefault();
  if (!store) return;
  store.set('os_fondo', p.fondo);
  store.set('os_orden_iconos', JSON.stringify(p.ordenIconos));
  if (p.ultimaApp === null) store.remove('os_ultima_app');
  else store.set('os_ultima_app', p.ultimaApp);
}

// Ordena apps según el orden guardado (ids desconocidos/nuevos al final).
export function ordenarApps<T extends { id: string }>(apps: T[], orden: string[]): T[] {
  const pos = new Map(orden.map((id, i) => [id, i]));
  return [...apps].sort((a, b) => (pos.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (pos.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

// En móvil las ventanas van siempre maximizadas.
export function debeMaximizar(esMovil: boolean): boolean {
  return esMovil;
}
