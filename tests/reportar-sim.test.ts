import { describe, expect, it, vi } from 'vitest';
// Sims reportan progreso: el helper debe POSTear a /api/sim/progress/record
// con los campos que el tracker espera. Cero LLM.
import { apiFetch } from '../alumnos/src/lib/api';
import { reportarSim } from '../alumnos/src/sims/reportarSim';

vi.mock('../alumnos/src/lib/api', () => ({
  apiFetch: vi.fn(async () => ({ ok: true })),
}));

describe('reportarSim', () => {
  it('POSTea progress/record con specialty practicas y countsAsCase', async () => {
    const ok = await reportarSim({ taskType: 'nomina_practica', title: 'Nómina — timbrado', score: 100, passed: true });
    expect(ok).toBe(true);
    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (apiFetch as any).mock.calls[0];
    expect(url).toBe('/api/sim/progress/record');
    const body = JSON.parse(opts.body);
    expect(body.taskType).toBe('nomina_practica');
    expect(body.specialty).toBe('practicas');
    expect(body.score).toBe(100);
    expect(body.maxScore).toBe(100);
    expect(body.passed).toBe(true);
    expect(body.countsAsCase).toBe(true);
  });

  it('best-effort: si falla la red devuelve false sin lanzar', async () => {
    (apiFetch as any).mockRejectedValueOnce(new Error('offline'));
    const ok = await reportarSim({ taskType: 'reporte_practica', title: 'DIOT', score: 80, passed: true });
    expect(ok).toBe(false);
  });
});
