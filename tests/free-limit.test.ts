import { describe, it, expect, beforeEach } from 'vitest';
import { trackVacancy, setVacancyStatus, listVacancies, FREE_LIMIT, resetVacancyMem } from '../backend/src/services/vacancyTracker';

// El tracker usa memoria cuando no hay Supabase configurado (entorno de test).
describe('R-10 v2 — límite plan free (2 vacantes simultáneas)', () => {
  const userId = 'u-free-test';

  beforeEach(() => {
    resetVacancyMem(userId);
  });

  it('permite trackear 2 vacantes en free', async () => {
    const a = await trackVacancy(userId, { vacancy_id: 'v1', modo: 'A', vacante_titulo: 'Analista' });
    const b = await trackVacancy(userId, { vacancy_id: 'v2', modo: 'B', vacante_titulo: 'DE' });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it('bloquea la 3ª vacante simultánea en free con 402', async () => {
    await trackVacancy(userId, { vacancy_id: 'v1' });
    await trackVacancy(userId, { vacancy_id: 'v2' });
    const c = await trackVacancy(userId, { vacancy_id: 'v3' });
    expect(c.ok).toBe(false);
    if (!c.ok) expect(c.code).toBe(402);
  });

  it('cerrar una vacante libera el cupo y permite una nueva', async () => {
    await trackVacancy(userId, { vacancy_id: 'v1' });
    await trackVacancy(userId, { vacancy_id: 'v2' });
    await setVacancyStatus(userId, 'v1', 'cerrada');
    const c = await trackVacancy(userId, { vacancy_id: 'v3' });
    expect(c.ok).toBe(true);
    const { active } = await listVacancies(userId);
    expect(active).toBe(2);
  });

  it('re-trackear la misma vacante da 409 (ya en seguimiento)', async () => {
    await trackVacancy(userId, { vacancy_id: 'v1' });
    const again = await trackVacancy(userId, { vacancy_id: 'v1' });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.code).toBe(409);
  });

  it('FREE_LIMIT es 2', () => {
    expect(FREE_LIMIT).toBe(2);
  });
});