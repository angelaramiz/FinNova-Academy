import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { listCohort, addToCohort, removeFromCohort, isPilot } from '../backend/src/services/pilotCohort';
import { appsParaPiloto } from '../alumnos/src/lib/piloto';

// TASK-2-1 (Puerta de piloto, TDD): cohorte staff-gestionada. La migracion
// vive en archivo (NO aplicada en remoto: restriccion cero-prod).

const MIGRACION = path.resolve(__dirname, '../supabase/migrations/20260913090000_pilot_cohort.sql');

describe('piloto: migracion en archivo', () => {
  it('existe y crea pilot_cohort con RLS', () => {
    expect(fs.existsSync(MIGRACION)).toBe(true);
    const sql = fs.readFileSync(MIGRACION, 'utf-8');
    expect(sql).toContain('CREATE TABLE');
    expect(sql).toContain('pilot_cohort');
    expect(sql).toContain('user_id');
    expect(sql).toContain('added_at');
    expect(sql).toContain('added_by');
    expect(sql).toContain('profiles');
    expect(sql).toContain('ROW LEVEL SECURITY');
  });
});

describe('piloto: servicio de cohorte (memoria en tests)', () => {
  const UID = 'piloto-test-1';
  it('agregar -> isPilot true; quitar -> false', async () => {
    await removeFromCohort(UID);
    expect(await isPilot(UID)).toBe(false);
    await addToCohort(UID, 'admin-1');
    expect(await isPilot(UID)).toBe(true);
    const lista = await listCohort();
    const fila = lista.find((f) => f.user_id === UID);
    expect(fila).toBeTruthy();
    expect(fila!.added_by).toBe('admin-1');
    expect(typeof fila!.added_at).toBe('string');
    await removeFromCohort(UID);
    expect(await isPilot(UID)).toBe(false);
  });

  it('desconocido no es piloto', async () => {
    expect(await isPilot('nadie-000')).toBe(false);
  });
});

describe('piloto: gate de apps (puro)', () => {
  const apps = [{ id: 'practicas' }, { id: 'tareas' }, { id: 'correo' }];
  it('con cohorte muestra todo', () => {
    expect(appsParaPiloto(apps, true).map((a) => a.id)).toEqual(['practicas', 'tareas', 'correo']);
  });
  it('sin cohorte oculta practicas', () => {
    const vis = appsParaPiloto(apps, false).map((a) => a.id);
    expect(vis).not.toContain('practicas');
    expect(vis).toContain('tareas');
  });
});
