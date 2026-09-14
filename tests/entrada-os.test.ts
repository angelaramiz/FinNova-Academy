import { describe, expect, it } from 'vitest';
// TASK-O1: Entrada OS — helpers puros del bloqueo y la transición.
// Reloj sim: fecha fija SIM (08-jul-2026), hora real. Cero marcas.
import {
  fechaSimLarga,
  etiquetaRol,
  duracionTransicion,
  prefersReducedMotion,
  wallpaperPorEspecialidad,
  osEntryEnabled,
  cargarPrefs,
  guardarPrefs,
  ordenarApps,
  debeMaximizar,
  type OsPrefs,
} from '../alumnos/src/lib/bloqueo';

describe('bloqueo (TASK-O1)', () => {
  it('fecha sim larga en español: miércoles, 8 de julio de 2026', () => {
    expect(fechaSimLarga()).toBe('miércoles, 8 de julio de 2026');
  });

  it('etiqueta de rol por especialidad (para "Cargando tu perfil de…")', () => {
    expect(etiquetaRol('practicas')).toBe('Practicante de Contabilidad');
    expect(etiquetaRol('accounting')).toBe('Contador General Jr');
    expect(etiquetaRol('data_engineering')).toBe('Analista de Datos');
  });

  it('transición ~1s, 0 con reduced-motion', () => {
    expect(duracionTransicion(false)).toBe(1000);
    expect(duracionTransicion(true)).toBe(0);
  });

  it('prefersReducedMotion devuelve booleano (false sin window)', () => {
    expect(typeof prefersReducedMotion()).toBe('boolean');
  });

  it('wallpaper por especialidad: 3 distintos, CSS local sin assets', () => {
    const w = [
      wallpaperPorEspecialidad('practicas'),
      wallpaperPorEspecialidad('accounting'),
      wallpaperPorEspecialidad('data_engineering'),
    ];
    for (const x of w) {
      expect(x).toContain('gradient');
      expect(x).not.toContain('http');
      expect(x).not.toContain('url(');
    }
    expect(new Set(w).size).toBe(3);
  });

  it('osEntryEnabled: default ON (flag OFF lo apaga)', () => {
    expect(osEntryEnabled(undefined)).toBe(true);
    expect(osEntryEnabled('ON')).toBe(true);
    expect(osEntryEnabled('OFF')).toBe(false);
  });

  it('prefs OS: cargar defaults, guardar y releer (os_fondo/orden/ultima)', () => {
    const mem = new Map<string, string>();
    const fake = {
      get: (k: string) => mem.get(k) ?? null,
      set: (k: string, v: string) => { mem.set(k, v); },
      remove: (k: string) => { mem.delete(k); },
    };
    const d = cargarPrefs(fake);
    expect(d.fondo).toBe('default');
    expect(d.ordenIconos).toEqual([]);
    expect(d.ultimaApp).toBeNull();
    const p: OsPrefs = { fondo: 'tecnico', ordenIconos: ['b', 'a'], ultimaApp: 'sql' };
    guardarPrefs(p, fake);
    expect(cargarPrefs(fake)).toEqual(p);
    guardarPrefs({ fondo: 'default', ordenIconos: [], ultimaApp: null }, fake);
    expect(cargarPrefs(fake).ultimaApp).toBeNull();
  });

  it('ordenarApps respeta el orden guardado (nuevas al final)', () => {
    const apps = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(ordenarApps(apps, ['c', 'a']).map((a) => a.id)).toEqual(['c', 'a', 'b']);
    expect(ordenarApps(apps, []).map((a) => a.id)).toEqual(['a', 'b', 'c']);
  });

  it('debeMaximizar: movil siempre maximizada', () => {
    expect(debeMaximizar(true)).toBe(true);
    expect(debeMaximizar(false)).toBe(false);
  });
});
