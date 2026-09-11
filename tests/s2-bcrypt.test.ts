import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { authRouter } from '../backend/src/routes/auth';
import { MemoryDatabase } from '../backend/src/lib/memoryDb';

// P0 Seguridad (TASK-S2): solo bcrypt en memoria local.
// El seed trae allowed+profile student_tester/2222 ('Inversor Novato'): se usa tal cual.

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/auth', authRouter);
  return a;
}

describe('S2 - solo bcrypt (rechazo legacy + reset forzado)', () => {
  it('hash en texto plano se rechaza y fuerza mustChangePassword', async () => {
    const fixEmail = 'student_tester@gmail.com';
    const profile: any = MemoryDatabase.profiles.find((p: any) => p.id === '22222222-2222-2222-2222-222222222222');
    profile.passwordHash = 'plaintext-heredado';
    profile.mustChangePassword = false;
    const r = await request(app()).post('/api/auth/login-credentials').send({ email: fixEmail, password: 'plaintext-heredado' });
    expect(r.status).toBe(401);
    expect(profile.mustChangePassword).toBe(true);
  });

  it('hash bcrypt válido sigue pasando', async () => {
    const fixEmail = 'student_tester@gmail.com';
    const profile: any = MemoryDatabase.profiles.find((p: any) => p.id === '22222222-2222-2222-2222-222222222222');
    profile.passwordHash = bcrypt.hashSync('clave-buena-123', 10);
    profile.mustChangePassword = false;
    process.env.DISABLE_OTP = 'true';
    process.env.SUPABASE_JWT_SECRET = 'test-only-secret-para-s2';
    const r = await request(app()).post('/api/auth/login-credentials').send({ email: fixEmail, password: 'clave-buena-123' });
    delete process.env.DISABLE_OTP;
    delete process.env.SUPABASE_JWT_SECRET;
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe('string');
  });
});
