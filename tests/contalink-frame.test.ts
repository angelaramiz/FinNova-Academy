// Frame Contalink: el HTML real recibe el catálogo por postMessage (TDD).
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CATALOGO_AGRUPADOR } from '../alumnos/src/sims/catalogoAgrupador';

const HTML = 'alumnos/public/sims/diot.html';

describe('contalink frame diot', () => {
  it('existe y es el HTML real de Contalink', () => {
    expect(fs.existsSync(HTML)).toBe(true);
    const s = fs.readFileSync(HTML, 'utf-8');
    expect(s).toContain('contalink');
    expect(s).toContain('DIOT_READY');
    expect(s).toContain('CATALOGO_AGRUPADOR');
    expect(s).toContain('sat-q');
  });

  it('el catálogo cabe por postMessage (<500KB)', () => {
    const bytes = Buffer.byteLength(JSON.stringify(CATALOGO_AGRUPADOR), 'utf8');
    expect(bytes).toBeLessThan(500 * 1024);
    expect(CATALOGO_AGRUPADOR.length).toBeGreaterThan(600);
  });

  it('sin CDNs nuevos salvo los originales', () => {
    const s = fs.readFileSync(path.resolve(HTML), 'utf-8');
    expect(s).toContain('cdn.tailwindcss.com');
    expect(s).not.toContain('googletagmanager');
  });
});
