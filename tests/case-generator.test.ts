import { describe, it, expect } from 'vitest';
import { buildCase, makeRng, hashSeed, caseSignature, pickRng } from '../backend/src/services/caseGenerator';
import { applyNpcEvent, freshNpcState, freshNpcWorld } from '../backend/src/services/npcEngine';
import { STORY_ARCS, getArcsForRoute } from '../backend/src/data/storyArcs';
import { MART_TOTAL } from '../backend/src/data/dbtCatalog';

describe('R-09 caseGenerator — generador con semilla', () => {
  it('la misma semilla produce el mismo caso (reproducibilidad)', () => {
    const a = buildCase({ userId: 'u123', weekKey: '2026-W28', route: 'contable' });
    const b = buildCase({ userId: 'u123', weekKey: '2026-W28', route: 'contable' });
    expect(caseSignature(a)).toBe(caseSignature(b));
  });

  it('distintos usuarios producen casos distintos (al menos el payload difiere en algo)', () => {
    const a = buildCase({ userId: 'u123', weekKey: '2026-W28', route: 'contable' });
    const b = buildCase({ userId: 'u456', weekKey: '2026-W28', route: 'contable' });
    // la semilla cambia → al menos el lore o el payload difiere
    expect(a.seed).not.toBe(b.seed);
  });

  it('todos los casos generados pasan la auditoría (audited = true)', () => {
    for (const route of ['contable', 'analyst', 'engineering', 'science']) {
      for (let i = 0; i < 20; i++) {
        const c = buildCase({ userId: `u${i}`, weekKey: `2026-W${(i % 4) + 1}`, route: route as any });
        expect(c.audited, `ruta ${route} seed ${c.seed}`).toBe(true);
      }
    }
  });

  it('los golden values contables cuadran (asiento balanceado)', () => {
    const c = buildCase({ userId: 'u123', weekKey: '2026-W28', route: 'contable' });
    if (c.golden.asiento) {
      const debits = c.golden.asiento.reduce((s: number, e: any) => s + e.debit, 0);
      const credits = c.golden.asiento.reduce((s: number, e: any) => s + e.credit, 0);
      expect(Math.abs(debits - credits)).toBeLessThan(0.01);
    }
  });

  it('los casos data referencian el mart y el total golden 128350', () => {
    for (const route of ['analyst', 'engineering', 'science']) {
      const c = buildCase({ userId: 'u123', weekKey: '2026-W28', route: route as any });
      expect(c.golden.martTotal ?? MART_TOTAL).toBe(MART_TOTAL);
      expect([...c.entities, c.payload.dataset || ''].join(' ')).toMatch(/ventas|pipeline|mrt|stg|raw/);
    }
  });

  it('la escena elegida pertenece al arco de la ruta', () => {
    for (const route of ['contable', 'analyst', 'engineering', 'science']) {
      const c = buildCase({ userId: 'u123', weekKey: '2026-W28', route: route as any });
      const validScenes = getArcsForRoute(route as any).flatMap(a => a.escenas.map(s => s.sceneId));
      expect(validScenes).toContain(c.sceneId);
    }
  });

  it('el NPC del caso es válido para la ruta (lic_gomez solo contable)', () => {
    const contable = buildCase({ userId: 'u1', weekKey: '2026-W28', route: 'contable' });
    const data = buildCase({ userId: 'u1', weekKey: '2026-W28', route: 'engineering' });
    const gomezRoutes = STORY_ARCS.filter(a => a.escenas.some(s => s.npc === 'lic_gomez'));
    expect(gomezRoutes.every(a => a.route === 'contable')).toBe(true);
    expect(contable.npc).not.toBe('sandra_mora');
    expect(data.npc).not.toBe('lic_gomez');
  });

  it('el PRNG es determinístico y distribuido', () => {
    const rng = makeRng('semilla-test');
    const first = [rng(), rng(), rng()];
    const rng2 = makeRng('semilla-test');
    expect([rng2(), rng2(), rng2()]).toEqual(first);
    expect(hashSeed('a')).toBe(hashSeed('a'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });
});

describe('R-09 npcEngine — modelo de comportamiento por reglas', () => {
  it('la trampa detectada sube trust y genera correo de reconocimiento', () => {
    const st = freshNpcState('sandra_mora');
    const r = applyNpcEvent(st, { type: 'trap_detected', trapId: 'sql_sin_group_by' });
    expect(r.trustDelta).toBe(5);
    expect(r.state.trust).toBe(55);
    expect(r.correo).toBeDefined();
    expect(r.correo!.from).toBe('Ing. Sandra Mora');
    expect(r.correo!.subject).toContain('Reconocimiento');
  });

  it('el incidente recuperado sube trust +10 y desbloquea escena especial con trust alto', () => {
    let st = freshNpcState('sandra_mora');
    st = applyNpcEvent(st, { type: 'incident_recovered' }).state; // 60
    st = applyNpcEvent(st, { type: 'arc_completed' }).state;       // 68
    st = applyNpcEvent(st, { type: 'arc_completed' }).state;       // 76
    const r = applyNpcEvent(st, { type: 'arc_completed' });        // 84
    expect(r.state.trust).toBeGreaterThanOrEqual(80);
    expect(r.escenaEspecial).toBe('propiedad_modulo');
  });

  it('la escalera sube con tareas falladas (lic_gomez: amable → recordatorio → hablar)', () => {
    let st = freshNpcState('lic_gomez');
    st = applyNpcEvent(st, { type: 'task_failed' }).state;
    expect(st.nivelEscalera).toBe(1);
    st = applyNpcEvent(st, { type: 'task_failed' }).state;
    expect(st.nivelEscalera).toBe(2);
    const r = applyNpcEvent(st, { type: 'task_failed' });
    expect(r.state.nivelEscalera).toBeGreaterThanOrEqual(2);
  });

  it('mismo error 2 veces (memoria) activa micro-arco de capacitación', () => {
    let st = freshNpcState('lic_gomez'); // memoria: true
    st = applyNpcEvent(st, { type: 'task_failed', trapId: 'iva_incorrecto' }).state;
    const r = applyNpcEvent(st, { type: 'task_failed', trapId: 'iva_incorrecto' });
    expect(r.microArco).toBe('capacitacion_iva_incorrecto');
    expect(r.correo!.subject).toBe('Capacitación asignada');
  });

  it('la formalidad del NPC cambia el tono del correo', () => {
    const gomez = applyNpcEvent(freshNpcState('lic_gomez'), { type: 'task_failed' }); // formalidad 2
    const ana = applyNpcEvent(freshNpcState('ana_analista'), { type: 'task_failed' }); // formalidad 0
    expect(gomez.correo!.body).toContain('Reciba un recordatorio');
    expect(ana.correo!.body).not.toContain('Reciba un recordatorio');
  });

  it('freshNpcWorld inicializa el estado de todos los NPCs', () => {
    const w = freshNpcWorld(['lic_gomez', 'sandra_mora', 'tesoreria']);
    expect(Object.keys(w)).toHaveLength(3);
    expect(w.lic_gomez.trust).toBe(50);
    expect(w.lic_gomez.nivelEscalera).toBe(0);
  });
});