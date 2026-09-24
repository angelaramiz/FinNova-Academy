import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// TourSim dentro de ventana con transform: fixed se vuelve relativo al
// ancestro → el anillo se desplazaba (+62/+99 medido en Chrome). El fix resta
// el origen del contenedor raíz. Test de la función pura + cableado en fuente.
import { geometriaSpotlight } from '../alumnos/src/sims/tourGeometria';

describe('tour geometría: spotlight relativo al contenedor', () => {
  it('resta el origen del overlay (ancestro con transform)', () => {
    const g = geometriaSpotlight(
      { left: 346, top: 269, width: 1005, height: 139 },
      { left: 62, top: 99 },
    );
    expect(g.l).toBe(346 - 62 - 10);
    expect(g.t).toBe(269 - 99 - 10);
    expect(g.w).toBe(1005 + 20);
    expect(g.h).toBe(139 + 20);
  });
  it('sin transform (origen 0,0) equivale al cálculo anterior', () => {
    const g = geometriaSpotlight(
      { left: 100, top: 200, width: 300, height: 50 },
      { left: 0, top: 0 },
    );
    expect(g).toEqual({ l: 90, t: 190, w: 320, h: 70 });
  });
  it('nunca deja el anillo en negativo (clamp a 6)', () => {
    const g = geometriaSpotlight(
      { left: 5, top: 5, width: 100, height: 20 },
      { left: 62, top: 99 },
    );
    expect(g.l).toBe(6);
    expect(g.t).toBe(6);
  });
});

describe('tour geometría: cableado en TourSim', () => {
  it('TourSim usa geometriaSpotlight con el rect de su contenedor raíz', () => {
    const T = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'TourSim.tsx'), 'utf8');
    expect(T).toContain('geometriaSpotlight');
    expect(T).toContain('rootRef');
  });
});
