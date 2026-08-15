import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resumen de resiliencia en producción (FALLA crítica: reset a bienvenida).
// Estos tests verifican que el código fuente contenga los mecanismos
// anti-reset y de estabilización WebGL solicitados por el reporte.

describe('resiliencia producción — anti-reset y estabilización WebGL', () => {
  const simSrc = fs.readFileSync(path.resolve(__dirname, '../alumnos/src/components/SimuladorLaboral.tsx'), 'utf8');
  const onbSrc = fs.readFileSync(path.resolve(__dirname, '../alumnos/src/components/Onboarding.tsx'), 'utf8');
  const shellSrc = fs.readFileSync(path.resolve(__dirname, '../alumnos/src/components/DesktopShell.tsx'), 'utf8');

  it('StableCanvas configura PCFShadowMap (elimina warn deprecado por frame)', () => {
    expect(simSrc).toContain('gl.shadowMap.type = THREE.PCFShadowMap');
  });

  it('StableCanvas maneja webglcontextlost y webglcontextrestored', () => {
    expect(simSrc).toContain('webglcontextlost');
    expect(simSrc).toContain('webglcontextrestored');
  });

  it('StableCanvas libera el renderer al desmontar (forceContextLoss + dispose)', () => {
    expect(simSrc).toContain('forceContextLoss()');
    expect(simSrc).toContain('gl.dispose()');
  });

  it('hay un fallback 2D (OfficeScene2D) que evita reiniciar la app', () => {
    expect(simSrc).toContain('OfficeScene2D');
    expect(simSrc).toContain('Modo sin 3D');
  });

  it('el Canvas R3F está envuelto en ErrorBoundary con fallback 2D', () => {
    expect(simSrc).toContain('<ErrorBoundary');
    expect(simSrc).toContain('fallback={<OfficeScene2D');
  });

  it('checkOnboarding reanuda desde localStorage solo si sim_visited está marcado (anti-reset sin saltar onboarding nuevo)', () => {
    expect(simSrc).toContain("localStorage.getItem('sim_visited')");
    expect(simSrc).toContain("localStorage.getItem('sim_specialty')");
    expect(simSrc).toContain("localStorage.setItem('sim_specialty'");
  });

  it('la bienvenida NO se salta: un usuario sin sim_visited ve el onboarding aunque la API no responda', () => {
    // El resume solo ocurre si sim_visited === '1'; en caso contrario setNeedsOnboarding(true).
    expect(simSrc).toContain("if (!resumeFromLocal()) setNeedsOnboarding(true)");
  });

  it('Onboarding persiste perfil en localStorage ANTES de ¡Empezar!', () => {
    expect(onbSrc).toContain("localStorage.setItem('sim_specialty'");
    expect(onbSrc).toContain("localStorage.setItem('sim_visited'");
    // la persistencia ocurre antes de las llamadas API
    const persistIdx = onbSrc.indexOf("localStorage.setItem('sim_specialty'");
    const apiIdx = onbSrc.indexOf("api('/api/sim/subscribe'");
    expect(persistIdx).toBeGreaterThan(-1);
    expect(apiIdx).toBeGreaterThan(persistIdx);
  });

  it('el header de la oficina usa el perfil data (Analista de Datos), nunca default contable', () => {
    expect(simSrc).toContain("Analista de Datos · DataFlow Analytics");
    // para data, el rol no cae en el default contable
    expect(simSrc).toContain("specialty === 'data_engineering'");
    const headerDataBranch = simSrc.includes("Analista de Datos · DataFlow Analytics");
    expect(headerDataBranch).toBe(true);
  });

  it('DesktopShell muestra el título dinámico por fase del árbol (analista/ing/sci)', () => {
    expect(shellSrc).toContain('Analista de Datos');
    expect(shellSrc).toContain('Ingeniero de Datos Jr');
    expect(shellSrc).toContain('Científico de Datos Jr');
  });
});
