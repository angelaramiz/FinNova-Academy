import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authRouter } from '../backend/src/routes/auth';
import { MemoryDatabase } from '../backend/src/lib/memoryDb';

// P0 Seguridad (TASK-S3): firma mock fail-closed en memoria local.
// OTP en pausa: estos paths mock son el login vivo en dev.

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/auth', authRouter);
  return a;
}

function seedAllowed(email: string, fullName: string) {
  if (!MemoryDatabase.allowedEmails.find((a: any) => a.email === email)) {
    MemoryDatabase.allowedEmails.push({ email, fullName, role: 'student' } as any);
  }
}

describe('S3 - firma mock aborta sin secreto (fail-closed)', () => {
  it('login-simulated sin SUPABASE_JWT_SECRET → 500 misconfiguration', async () => {
    const email = 's3probe@finnova.academy';
    seedAllowed(email, 'S3 Probe');
    const saved = process.env.SUPABASE_JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    const r = await request(app()).post('/api/auth/login-simulated').send({ email });
    if (saved !== undefined) process.env.SUPABASE_JWT_SECRET = saved;
    expect(r.status).toBe(500);
    expect(r.body.error).toBe('Server Misconfiguration');
  });

  it('login-simulated con secreto → 200 + token', async () => {
    const email = 's3probe2@finnova.academy';
    seedAllowed(email, 'S3 Probe Dos');
    process.env.SUPABASE_JWT_SECRET = 'test-only-secret-para-s3';
    const r = await request(app()).post('/api/auth/login-simulated').send({ email });
    delete process.env.SUPABASE_JWT_SECRET;
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe('string');
  });
});
