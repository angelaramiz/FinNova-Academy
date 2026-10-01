import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// Solo punto, sin guion: las internas del puente SAT usan puntos (la renta
// deducible ES 601.45); 601.83 sigue siendo el hospital no deducible.
import {
  CUENTA_INTERNA_A_AGRUPADOR, agrupadorDeCuentaInterna, buscarCuentasFront,
} from '../alumnos/src/sims/catalogoAgrupador';
import { EQUIVALENCIAS, resolverAgrupador } from '../backend/src/services/satCatalog';
import { generarPoliza, CASO_MARCELO, EDO_MARCELO } from '../backend/src/services/polizaEngine';

describe('cuentas solo punto: mapa front sin guion', () => {
  it('ninguna clave interna lleva guion', () => {
    expect(Object.keys(CUENTA_INTERNA_A_AGRUPADOR).filter(k => k.includes('-'))).toEqual([]);
  });
  it('renta deducible es 601.45 directo (identidad)', () => {
    expect(agrupadorDeCuentaInterna('601.45')?.codigo).toBe('601.45');
  });
  it('resto del curso con punto resuelve a su agrupador', () => {
    expect(agrupadorDeCuentaInterna('102.01.002')?.codigo).toBe('102.01');
    expect(agrupadorDeCuentaInterna('216.03')?.codigo).toBe('216.03');
    expect(agrupadorDeCuentaInterna('201.01')?.codigo).toBe('201.01');
    expect(agrupadorDeCuentaInterna('105.01')?.codigo).toBe('105.01');
  });
  it('compatibilidad: el guion viejo sigue resolviendo (no cae a la trampa)', () => {
    expect(agrupadorDeCuentaInterna('601-83')?.codigo).toBe('601.45');
    expect(agrupadorDeCuentaInterna('102-01-002')?.codigo).toBe('102.01');
  });
  it('buscar con punto sugiere punto; 601.83 avisa trampa hacia 601.45', () => {
    expect(buscarCuentasFront('102.01.002')[0].cuentaInternaSugerida).toBe('102.01.002');
    const hit = buscarCuentasFront('601.83')[0];
    expect(hit.avisoColision).toContain('601.45');
    expect(hit.avisoColision).not.toContain('601-83');
  });
});

describe('cuentas solo punto: puente backend sin guion', () => {
  it('ninguna equivalencia lleva guion en cuentaInterna', () => {
    expect(EQUIVALENCIAS.map(e => e.cuentaInterna).filter(k => k.includes('-'))).toEqual([]);
  });
  it('renta y curso resuelven con punto; guion viejo compatible', () => {
    expect(resolverAgrupador('601.45')).toBe('601.45');
    expect(resolverAgrupador('102.01.002')).toBe('102.01');
    expect(resolverAgrupador('601-83')).toBe('601.45');
  });
  it('MARCELO genera la renta con punto (sin guion en la póliza)', () => {
    const p = generarPoliza(CASO_MARCELO, EDO_MARCELO);
    const texto = JSON.stringify(p);
    expect(texto).toContain('601.45');
    expect(texto).not.toContain('601-83');
  });
  it('ningún texto del Sim enseña guion como formato (fuente)', () => {
    const POL = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'PolizaSim.tsx'), 'utf8');
    expect(POL).not.toContain('601-83');
    expect(POL).not.toContain('con guion');
  });
});
