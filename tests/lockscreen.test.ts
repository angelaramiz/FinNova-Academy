import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// El protector (LockScreen) debe llenar el alto disponible: sin hueco azul
// abajo. Nada de restas fijas 100vh-120px heredadas del header alto + subheader.
const LOCK = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'components', 'LockScreen.tsx'), 'utf8');
const LAB = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'components', 'SimuladorLaboral.tsx'), 'utf8');
const ONB = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'components', 'Onboarding.tsx'), 'utf8');

describe('protector llena el alto (sin hueco abajo)', () => {
  it('LockScreen rellena su contenedor (flex-1, sin 100vh-120px)', () => {
    expect(LOCK).not.toContain('100vh-120px');
    expect(LOCK).toContain('flex-1');
  });
  it('contenedor del simulador usa min-h con header compacto (sin 120px ni 76px fijos)', () => {
    expect(LAB).not.toContain('100vh-120px');
    expect(LAB).not.toContain('100vh-76px');
    expect(LAB).toContain('min-h-[calc(100vh-52px)]');
  });
  it('pantallas de carga/onboarding heredan la misma altura (sin 120px)', () => {
    expect(LAB).not.toContain('100vh-120px');
    expect(ONB).not.toContain('100vh-120px');
  });
});
