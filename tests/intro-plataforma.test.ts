import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
// Ventana de introducción genérica a la plataforma: va DESPUÉS del protector
// y ANTES del escritorio, e indistinta de materia/especialidad/curso.
const RUTA = join(__dirname, '..', 'alumnos', 'src', 'components', 'IntroPlataforma.tsx');
const LAB = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'components', 'SimuladorLaboral.tsx'), 'utf8');

describe('intro a la plataforma (post-protector, genérica)', () => {
  it('existe el componente con botón de entrada', () => {
    expect(existsSync(RUTA)).toBe(true);
    const INTRO = readFileSync(RUTA, 'utf8');
    expect(INTRO).toContain('onEntrar');
    expect(INTRO).toContain('Entrar');
  });
  it('cero jerga de especialidad (ni conta ni data)', () => {
    const INTRO = readFileSync(RUTA, 'utf8');
    for (const w of ['CFDI', 'poliza', 'Póliza', 'dbt', 'mina', 'Débito', 'SAT']) {
      expect(INTRO).not.toContain(w);
    }
  });
  it('el simulador la muestra entre el protector y el escritorio', () => {
    expect(LAB).toContain('IntroPlataforma');
    expect(LAB).toContain('introVista');
    expect(LAB).toContain('setIntroVista(false)');
    expect(LAB).toContain('setIntroVista(true)');
  });
  it('la ruta pública la muestra antes del módulo de pólizas', () => {
    const PUB = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'PaginaPolizasPrueba.tsx'), 'utf8');
    expect(PUB).toContain('IntroPlataforma');
    expect(PUB).toContain('setIntroVista(false)');
    expect(PUB).toContain('<PolizaSim publico />');
  });
});
