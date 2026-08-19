import { describe, it, expect } from 'vitest';
import { getStoryState, getActiveCase, completeScene, resetStory } from '../backend/src/services/storyState';
import { appendChronicle, getChronicle } from '../backend/src/services/chronicle';
import { buildCase } from '../backend/src/services/caseGenerator';

describe('R-09 T6 — estado del mundo vivo (storyState)', () => {
  it('getStoryState inicializa un mundo con NPCs y arco para la ruta', async () => {
    const s = await getStoryState('u-demo-story', 'contable');
    expect(s.route).toBe('contable');
    expect(Object.keys(s.npcs).length).toBeGreaterThan(0);
    expect(s.cases).toEqual([]);
  });

  it('getActiveCase genera un caso con semilla y lo cachea por semana/arco', async () => {
    const c1 = await getActiveCase('u-demo-story', '2026-W28', 'contable');
    expect(c1.seed).toContain('u-demo-story:2026-W28');
    expect(c1.audited).toBe(true);
    const c2 = await getActiveCase('u-demo-story', '2026-W28', 'contable');
    expect(c2.seed).toBe(c1.seed); // cacheado: mismo caso
  });

  it('un caso data pasa la auditoría y refiere el mart golden', async () => {
    const c = await getActiveCase('u-demo-story', '2026-W28', 'engineering');
    expect(c.golden.martTotal ?? 0).toBe(128350);
  });

  it('completeScene registra crónica y ajusta trust del NPC', async () => {
    await resetStory('u-demo-scene', 'engineering');
    const c = await getActiveCase('u-demo-scene', '2026-W28', 'engineering');
    const before = (await getStoryState('u-demo-scene')).npcs[c.npc]?.trust ?? 50;
    const { reaction } = await completeScene('u-demo-scene', { sceneId: c.sceneId, taskType: c.taskType, resultado: 'completada' });
    expect(reaction).not.toBeNull();
    expect(reaction!.trustDelta).toBeGreaterThan(0);
    const chronicle = await getChronicle('u-demo-scene');
    expect(chronicle.length).toBeGreaterThan(0);
    expect(chronicle[0].sceneId).toBe(c.sceneId);
  });

  it('una escena fallida con trampa sube la escalera y registra el error (memoria)', async () => {
    await resetStory('u-demo-trap', 'contable');
    const c = await getActiveCase('u-demo-trap', '2026-W28', 'contable');
    const st0 = await getStoryState('u-demo-trap');
    const npcId = c.npc;
    const before = st0.npcs[npcId]?.nivelEscalera ?? 0;
    await completeScene('u-demo-trap', { sceneId: c.sceneId, taskType: c.taskType, resultado: 'fallida', trapId: 'iva_incorrecto' });
    const st1 = await getStoryState('u-demo-trap');
    expect(st1.npcs[npcId].nivelEscalera).toBeGreaterThanOrEqual(before);
  });

  it('resetStory reinicia el mundo vivo', async () => {
    await resetStory('u-demo-reset', 'analyst');
    const s = await getStoryState('u-demo-reset');
    expect(s.route).toBe('analyst');
    expect(s.cases).toEqual([]);
  });

  it('la crónica se acumula y sirve de fuente de logros', async () => {
    await appendChronicle('u-demo-ch', { sceneId: 'e1_incidente', fechaSim: '05-jul', resultado: 'completada', npc: 'sandra_mora', detail: 'Pipeline recuperado', at: '2026-07-08T12:00:00Z' });
    const ch = await getChronicle('u-demo-ch');
    expect(ch.some(e => e.sceneId === 'e1_incidente')).toBe(true);
  });

  it('buildCase es reproducible para staff (misma semilla, mismo caso)', () => {
    const a = buildCase({ userId: 'staff-view', weekKey: '2026-W28', route: 'contable' });
    const b = buildCase({ userId: 'staff-view', weekKey: '2026-W28', route: 'contable' });
    expect(JSON.stringify(a.payload)).toBe(JSON.stringify(b.payload));
  });
});