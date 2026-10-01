import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// Header principal compacto + botón Maximizar con pantalla completa real
// (Fullscreen API sobre la ventana: oculta header de la app y chrome del navegador).
const APP = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'App.tsx'), 'utf8');
const HEADER = APP.slice(APP.indexOf('{/* Header */}'), APP.indexOf('</header>'));
const PANEL = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'components', 'StudentPanel.tsx'), 'utf8');
const OSW = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'components', 'OsWindow.tsx'), 'utf8');

describe('header principal compacto', () => {
  it('header con padding vertical mínimo (sin py-2.5)', () => {
    expect(HEADER).not.toContain('py-2.5');
    expect(HEADER).toContain('py-1');
  });
  it('logo, título, avatar y logout reducidos', () => {
    expect(HEADER).toContain('w-6 h-6');
    expect(HEADER).not.toContain('w-8 h-8');
    expect(HEADER).not.toContain('w-7 h-7');
    expect(HEADER).not.toContain('p-2 rounded-xl');
  });
  it('StudentPanel compensa la altura nueva (sin 60px heredado)', () => {
    expect(PANEL).not.toContain('60px');
  });
});

describe('maximizar con pantalla completa real', () => {
  it('OsWindow usa Fullscreen API sobre la ventana + escucha fullscreenchange', () => {
    expect(OSW).toContain('requestFullscreen');
    expect(OSW).toContain('exitFullscreen');
    expect(OSW).toContain('fullscreenchange');
  });
  it('si el navegador niega fullscreen, cae a maximizado interno (sin romper)', () => {
    expect(OSW).toContain('catch');
    expect(OSW).toContain('setMax(true)');
  });
});
