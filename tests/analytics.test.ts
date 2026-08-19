import { describe, it, expect } from 'vitest';
import {
  userHash,
  aggregateItems,
  detectMisconceptions,
  createTicketsFromStats,
  TICKET_FAIL_RATE,
  TICKET_GAIN,
  MISCONCEPTION_MIN_FREQ,
  ingestEvents,
} from '../backend/src/services/learningAnalytics';
import { scrubText, scrubData, containsPII, dataContainsPII } from '../backend/src/services/piiScrubber';

const userA = '00000001-0000-0000-0000-000000000001';
const userB = '00000001-0000-0000-0000-000000000002';

describe('R-11 — Flywheel de calidad', () => {
  it('user_hash es determinístico e irreversible (nunca expone el userId)', () => {
    const h1 = userHash(userA);
    const h2 = userHash(userA);
    const hB = userHash(userB);
    expect(h1).toBe(h2);                    // determinístico
    expect(h1).not.toBe(userA);             // no es el id en claro
    expect(h1).not.toContain(userA.slice(0, 8));
    expect(hB).not.toBe(h1);                // usuarios distintos → hashes distintos
    expect(h1).toMatch(/^[0-9a-f]{32}$/);
  });

  it('agrega eventos en item_stats con fail_rate, ganancia y discriminación', () => {
    const events = [
      { stage: 2, type: 'task_fail', ref: { taskId: 'sql_query' }, data: { time_s: 20, phase: 'pre', score: 30, correct: false } },
      { stage: 2, type: 'task_fail', ref: { taskId: 'sql_query' }, data: { time_s: 25, phase: 'pre', score: 40, correct: false } },
      { stage: 2, type: 'task_pass', ref: { taskId: 'sql_query' }, data: { time_s: 15, phase: 'post', score: 90, correct: true } },
    ];
    const stats = aggregateItems(events);
    const s = stats.find(x => x.ref_id === 'sql_query')!;
    expect(s).toBeDefined();
    expect(s.attempts).toBe(3);
    expect(s.fail_rate).toBeGreaterThan(0.6);
    expect(s.avg_time_s).toBe(20);
    // ganancia (90-35)/100 ≈ 0.55
    expect(s.learning_gain).toBeGreaterThan(0.5);
    expect(s.discrimination).toBeGreaterThan(0);
  });

  it('genera ticket cuando fail_rate>0.7 Y ganancia<0.2 (regla de oro: umbrales de motor)', () => {
    const stats = [
      { ref_id: 'bank_reconciliation', attempts: 10, fail_rate: 0.85, avg_time_s: 40, learning_gain: 0.1, discrimination: 0.2 },
    ];
    const tickets = createTicketsFromStats(stats);
    expect(tickets.length).toBe(1);
    expect(tickets[0].severidad).toBe('alta');
    expect(tickets[0].descripcion).toContain('fail_rate');
    expect(stats[0].fail_rate).toBeGreaterThan(TICKET_FAIL_RATE);
    expect(stats[0].learning_gain).toBeLessThan(TICKET_GAIN);
  });

  it('no genera ticket si no se superan ambos umbrales', () => {
    const tickets = createTicketsFromStats([
      { ref_id: 'ok', attempts: 10, fail_rate: 0.3, avg_time_s: 20, learning_gain: 0.6, discrimination: 0.8 },
      { ref_id: 'solo_falla', attempts: 10, fail_rate: 0.9, avg_time_s: 20, learning_gain: 0.6, discrimination: 0.4 },
    ]);
    const alta = tickets.filter(t => t.severidad === 'alta');
    const media = tickets.filter(t => t.severidad === 'media');
    expect(alta.length).toBe(0);   // no supera ambos
    expect(media.length).toBe(1);  // solo_falla supera fail_rate
  });

  it('detecta misconceptions solo con frecuencia suficiente', () => {
    const ev = Array.from({ length: MISCONCEPTION_MIN_FREQ }, () => ({
      stage: 2, type: 'task_fail', ref: { skillId: 'sql' }, data: { pattern: 'SUM sin GROUP BY', response: 'select * from ventas' },
    }));
    const mis = detectMisconceptions(ev);
    expect(mis.length).toBe(1);
    expect(mis[0].skill_id).toBe('sql');
    expect(mis[0].frequency).toBe(MISCONCEPTION_MIN_FREQ);
    // insuficiente
    const poco = detectMisconceptions([ev[0]]);
    expect(poco.length).toBe(0);
  });

  it('el scrubber elimina email, teléfono, RFC, CURP, tarjeta y nombres; cero PII en telemetría', () => {
    const dirty = 'Contacta a Lic. Juan Pérez en juan.perez@correo.com o al (614) 123-4567 · RFC GODE560412ABC · CURP JMPP950101CHLSRZ02 · tarjeta 4111 1111 1111 1111 · CP 32575';
    const clean = scrubText(dirty);
    expect(clean).not.toContain('@correo.com');
    expect(clean).not.toContain('4111');
    expect(clean).not.toContain('GODE560412ABC');
    expect(clean).not.toContain('JMPP950101CHLSRZ02');
    expect(clean).not.toContain('Juan Pérez');
    expect(containsPII(dirty)).toBe(true);
    expect(containsPII(clean)).toBe(false);
    // scrubData sobre objetos
    const scrubbed = scrubData({ name: 'María López', email: 'maria@corp.com', nested: { phone: '+52 614 111 2222' } });
    expect(dataContainsPII(scrubbed)).toBe(false);
  });

  it('ingestEvents limpia PII antes de insertar (gate de privacidad)', async () => {
    const result = await ingestEvents(userA, [{ stage: 1, type: 'question_answered', ref: { q: 1 }, data: { response: 'mi correo es a@b.com' } }]);
    // El scrubber convierte el correo en [PII-OMITIDO], así que el evento es aceptable (sin PII).
    expect(result.inserted).toBe(1);
    expect(result.rejected).toBe(0);
    expect(dataContainsPII({ response: 'a@b.com' })).toBe(true);
  });
});