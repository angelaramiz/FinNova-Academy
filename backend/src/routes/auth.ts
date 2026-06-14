/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import { MemoryDatabase, AllowedEmail, StudentQuestion } from '../lib/memoryDb';
import { requireSupabaseAuth, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

/**
 * GET /api/auth/me
 * Retrieves current active profile info and points stats
 */
authRouter.get('/me', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id || '22222222-2222-2222-2222-222222222222';
  const profile = MemoryDatabase.profiles.find(p => p.id === userId);

  if (!profile) {
    // Dynamically insert profile block if absent
     res.status(200).json({
      id: userId,
      fullName: 'Inversor Novato Base',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'student',
      pointsEarned: 100,
    });
     return;
  }

  res.status(200).json(profile);
});

/**
 * POST /api/auth/role
 * Utility endpoint to easily toggle actor role ('student' <-> 'instructor') during sandbox tests
 */
authRouter.post('/role', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id || '22222222-2222-2222-2222-222222222222';
  const { role } = req.body;

  if (role !== 'student' && role !== 'instructor' && role !== 'admin') {
     res.status(400).json({ error: 'Bad Request', message: 'Invalid role state requested.' });
     return;
  }

  const profile = MemoryDatabase.profiles.find(p => p.id === userId);
  if (profile) {
    profile.role = role;
     res.status(200).json({
      message: 'Role patched in development simulation.',
      profile,
    });
     return;
  }

  // Create profile if missing
  const newProfile = {
    id: userId,
    fullName: role === 'instructor' ? 'Profe Sandbox' : 'Inversor Novato',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role,
    pointsEarned: 150,
  };
  MemoryDatabase.profiles.push(newProfile);

  res.status(201).json({
    message: 'Profile spawned with requested role.',
    profile: newProfile,
  });
});

/**
 * GET /api/auth/allowed-emails
 * List all permitted school emails (Admin-only)
 */
authRouter.get('/allowed-emails', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Restricted to administrators.' });
    return;
  }
  res.status(200).json(MemoryDatabase.allowedEmails);
});

/**
 * POST /api/auth/allowed-emails
 * Add an email to permitted directory (Admin-only)
 */
authRouter.post('/allowed-emails', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Restricted to administrators.' });
    return;
  }

  const { email, role, fullName } = req.body;
  if (!email || !role || !fullName) {
    res.status(400).json({ error: 'Bad Request', message: 'Missing required fields (email, role, fullName).' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (MemoryDatabase.allowedEmails.some(a => a.email.toLowerCase() === normalizedEmail)) {
    res.status(400).json({ error: 'Conflict', message: 'El correo electrónico ya está registrado.' });
    return;
  }

  const newAllowed: AllowedEmail = {
    email: normalizedEmail,
    role,
    fullName: fullName.trim(),
    createdAt: new Date().toISOString()
  };

  MemoryDatabase.allowedEmails.push(newAllowed);
  res.status(201).json(newAllowed);
});

/**
 * DELETE /api/auth/allowed-emails/:email
 * Remove an email from permitted directory (Admin-only)
 */
authRouter.delete('/allowed-emails/:email', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Restricted to administrators.' });
    return;
  }

  const { email } = req.params;
  const normalizedEmail = email.trim().toLowerCase();
  const index = MemoryDatabase.allowedEmails.findIndex(a => a.email.toLowerCase() === normalizedEmail);

  if (index === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Correo electrónico no encontrado en la lista.' });
    return;
  }

  MemoryDatabase.allowedEmails.splice(index, 1);
  res.status(200).json({ message: 'Correo electrónico removido exitosamente.' });
});

/**
 * POST /api/auth/login-simulated
 * Sandbox testing login to generate simulated JWT for allowed emails
 */
authRouter.post('/login-simulated', (req: any, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Bad Request', message: 'Email required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const allowed = MemoryDatabase.allowedEmails.find(a => a.email.toLowerCase() === normalizedEmail);

  if (!allowed) {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: `El correo ${email} no está autorizado en esta escuela. Contacta al administrador.` 
    });
    return;
  }

  // Determine standard UUID or generate random UUID
  let userId = '22222222-2222-2222-2222-222222222222';
  if (normalizedEmail === 'admin@finnova.academy') {
    userId = '33333333-3333-3333-3333-333333333333';
  } else if (normalizedEmail === 'profesor.senior@finanzas.edu') {
    userId = '11111111-1111-1111-1111-111111111111';
  } else if (normalizedEmail === 'student_tester@gmail.com') {
    userId = '22222222-2222-2222-2222-222222222222';
  } else {
    // Generate deterministic UUID based on email
    userId = crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 36);
  }

  // Find or create profile
  let profile = MemoryDatabase.profiles.find(p => p.id === userId);
  if (!profile) {
    profile = {
      id: userId,
      fullName: allowed.fullName,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(allowed.fullName)}`,
      role: allowed.role,
      pointsEarned: allowed.role === 'student' ? 100 : 0
    };
    MemoryDatabase.profiles.push(profile);
  }

  // Sign mock JWT token using the HS256 algorithm defined in auth middleware
  const currentUnix = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    email: normalizedEmail,
    exp: currentUnix + 3600 * 24 * 7, // 7 days expiration
    user_metadata: {
      role: allowed.role,
      full_name: allowed.fullName
    }
  };

  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const message = `${headerB64}.${payloadB64}`;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'your-default-local-supabase-jwt-secret-for-signing';
  const signature = crypto.createHmac('sha256', jwtSecret).update(message).digest('base64url');
  const token = `${message}.${signature}`;

  res.status(200).json({
    token,
    profile
  });
});

/**
 * GET /api/auth/questions
 * Retrieve questions based on auth role (Student: own, Staff: all)
 */
authRouter.get('/questions', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id || '22222222-2222-2222-2222-222222222222';
  const role = req.user?.role || 'student';

  if (role === 'student') {
    const list = MemoryDatabase.questions.filter(q => q.studentId === userId);
    res.status(200).json(list);
  } else {
    res.status(200).json(MemoryDatabase.questions);
  }
});

/**
 * POST /api/auth/questions
 * Submit a student question regarding a course and lesson (Student-only)
 */
authRouter.post('/questions', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id || '22222222-2222-2222-2222-222222222222';
  const { courseId, courseTitle, clipId, clipTitle, questionText } = req.body;

  if (!courseId || !courseTitle || !clipId || !clipTitle || !questionText) {
    res.status(400).json({ error: 'Bad Request', message: 'Missing fields (courseId, courseTitle, clipId, clipTitle, questionText).' });
    return;
  }

  const profile = MemoryDatabase.profiles.find(p => p.id === userId);
  const studentName = profile?.fullName || 'Estudiante';

  const newQuestion: StudentQuestion = {
    id: `q-${Math.random().toString(36).substring(2, 10)}`,
    studentId: userId,
    studentName,
    courseId,
    courseTitle,
    clipId,
    clipTitle,
    questionText: questionText.trim(),
    createdAt: new Date().toISOString()
  };

  MemoryDatabase.questions.push(newQuestion);
  res.status(201).json(newQuestion);
});

/**
 * POST /api/auth/questions/:id/reply
 * Reply to a student question (Instructor/Admin-only)
 */
authRouter.post('/questions/:id/reply', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { replyText } = req.body;
  const role = req.user?.role || 'student';

  if (role !== 'instructor' && role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Restricted to instructors and administrators.' });
    return;
  }

  if (!replyText || !replyText.trim()) {
    res.status(400).json({ error: 'Bad Request', message: 'replyText is required.' });
    return;
  }

  const question = MemoryDatabase.questions.find(q => q.id === id);
  if (!question) {
    res.status(404).json({ error: 'Not Found', message: 'Question not found.' });
    return;
  }

  question.replyText = replyText.trim();
  question.repliedAt = new Date().toISOString();

  res.status(200).json(question);
});
