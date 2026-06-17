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

/**
 * POST /api/auth/register-requests
 * Submit a request to register an account
 */
authRouter.post('/register-requests', (req: any, res: Response): void => {
  const { fullName, email, role, specialty } = req.body;
  if (!fullName || !email || !role) {
    res.status(400).json({ error: 'Bad Request', message: 'Faltan campos obligatorios.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if email already in allowedEmails or already requested
  const alreadyAllowed = MemoryDatabase.allowedEmails.some(a => a.email.toLowerCase() === normalizedEmail);
  const alreadyRequested = MemoryDatabase.accountRequests.some(r => r.email.toLowerCase() === normalizedEmail && r.status === 'pending');

  if (alreadyAllowed) {
    res.status(400).json({ error: 'Conflict', message: 'El correo electrónico ya está registrado.' });
    return;
  }
  if (alreadyRequested) {
    res.status(400).json({ error: 'Conflict', message: 'Ya existe una solicitud de registro pendiente para este correo.' });
    return;
  }

  const newRequest: any = {
    id: `req-${Math.random().toString(36).substring(2, 10)}`,
    fullName: fullName.trim(),
    email: normalizedEmail,
    role,
    specialty: specialty?.trim(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  MemoryDatabase.accountRequests.push(newRequest);
  res.status(201).json(newRequest);
});

/**
 * GET /api/auth/register-requests
 * Retrieve all account registration requests (Admin-only)
 */
authRouter.get('/register-requests', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Restringido a administradores.' });
    return;
  }
  res.status(200).json(MemoryDatabase.accountRequests);
});

/**
 * POST /api/auth/register-requests/:id/approve
 * Approve registration request (Admin-only)
 */
authRouter.post('/register-requests/:id/approve', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Restringido a administradores.' });
    return;
  }

  const { id } = req.params;
  const request = MemoryDatabase.accountRequests.find(r => r.id === id);

  if (!request) {
    res.status(404).json({ error: 'Not Found', message: 'Solicitud no encontrada.' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(400).json({ error: 'Bad Request', message: 'La solicitud ya ha sido procesada.' });
    return;
  }

  // Generate random 8-character temporary password
  const tempPassword = Math.random().toString(36).substring(2, 10).toUpperCase();

  // Create allowedEmail record
  const newAllowed = {
    email: request.email,
    role: request.role,
    fullName: request.fullName,
    createdAt: new Date().toISOString()
  };
  MemoryDatabase.allowedEmails.push(newAllowed);

  // Generate deterministic UUID
  const userId = crypto.createHash('sha256').update(request.email).digest('hex').substring(0, 36);

  // Create Profile with temp password
  const newProfile = {
    id: userId,
    fullName: request.fullName,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(request.fullName)}`,
    role: request.role as 'student' | 'instructor',
    pointsEarned: request.role === 'student' ? 100 : 0,
    passwordHash: tempPassword, // Simplificación de sandbox: guardar contraseña temporal
    mustChangePassword: true
  };
  MemoryDatabase.profiles.push(newProfile);

  request.status = 'approved';

  // Format a very shiny mail log to server console
  console.log(`
======================================================================
📧 [CORREO SIMULADO] ENVIADO A: ${request.email}
======================================================================
¡Hola ${request.fullName}!

Tu cuenta para ingresar a AuraFi Academy ha sido creada.
Usa las siguientes credenciales para acceder a la plataforma:

  - Portal: ${request.role === 'instructor' ? 'Personal/Docente' : 'Alumnos'}
  - Correo: ${request.email}
  - Contraseña Temporal: ${tempPassword}

⚠️ IMPORTANTE: Tan pronto como inicies sesión, el sistema te obligará
a cambiar esta contraseña temporal por una personal y segura.
Además, cada inicio de sesión requerirá verificación OTP vía correo.

¡Te damos la bienvenida al equipo!
======================================================================
`);

  res.status(200).json({ 
    message: 'Solicitud aprobada y cuenta creada exitosamente.',
    tempPassword,
    request
  });
});

/**
 * POST /api/auth/register-requests/:id/reject
 * Reject registration request (Admin-only)
 */
authRouter.post('/register-requests/:id/reject', requireSupabaseAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Restringido a administradores.' });
    return;
  }

  const { id } = req.params;
  const request = MemoryDatabase.accountRequests.find(r => r.id === id);

  if (!request) {
    res.status(404).json({ error: 'Not Found', message: 'Solicitud no encontrada.' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(400).json({ error: 'Bad Request', message: 'La solicitud ya ha sido procesada.' });
    return;
  }

  request.status = 'rejected';
  res.status(200).json({ message: 'Solicitud rechazada.', request });
});

/**
 * POST /api/auth/login-credentials
 * Authenticate with email and password (traditional flow)
 */
authRouter.post('/login-credentials', (req: any, res: Response): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Bad Request', message: 'Se requiere correo y contraseña.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const profile = MemoryDatabase.profiles.find(p => {
    // Buscar perfil que coincida con el email en allowedEmails
    const allowed = MemoryDatabase.allowedEmails.find(a => a.email.toLowerCase() === normalizedEmail);
    return allowed && p.fullName === allowed.fullName;
  });

  if (!profile || profile.passwordHash !== password) {
    res.status(401).json({ error: 'Unauthorized', message: 'Credenciales inválidas.' });
    return;
  }

  // Check if password must be changed first
  if (profile.mustChangePassword) {
    res.status(200).json({ status: 'MUST_CHANGE_PASSWORD', email: normalizedEmail });
    return;
  }

  // Generate 6 digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiration

  profile.otpCode = otpCode;
  profile.otpExpires = otpExpires;

  // Print OTP to Server Console
  console.log(`
======================================================================
🔑 [OTP SIMULADO] CÓDIGO DE VERIFICACIÓN PARA: ${normalizedEmail}
======================================================================
Tu código OTP de un solo uso para iniciar sesión es:

                    👉   ${otpCode}   👈

Este código expira en 5 minutos. No lo compartas con nadie.
======================================================================
`);

  res.status(200).json({ status: 'OTP_REQUIRED', email: normalizedEmail });
});

/**
 * POST /api/auth/change-password-force
 * Change password when forced (mustChangePassword flag is true)
 */
authRouter.post('/change-password-force', (req: any, res: Response): void => {
  const { email, currentTempPassword, newPassword } = req.body;
  if (!email || !currentTempPassword || !newPassword) {
    res.status(400).json({ error: 'Bad Request', message: 'Faltan campos obligatorios.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const profile = MemoryDatabase.profiles.find(p => {
    const allowed = MemoryDatabase.allowedEmails.find(a => a.email.toLowerCase() === normalizedEmail);
    return allowed && p.fullName === allowed.fullName;
  });

  if (!profile || profile.passwordHash !== currentTempPassword) {
    res.status(401).json({ error: 'Unauthorized', message: 'Contraseña temporal incorrecta.' });
    return;
  }

  if (!profile.mustChangePassword) {
    res.status(400).json({ error: 'Bad Request', message: 'Esta cuenta ya actualizó su contraseña temporal.' });
    return;
  }

  profile.passwordHash = newPassword;
  profile.mustChangePassword = false;

  res.status(200).json({ message: 'Contraseña actualizada correctamente. Procede a iniciar sesión.' });
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and issue JWT
 */
authRouter.post('/verify-otp', (req: any, res: Response): void => {
  const { email, otpCode } = req.body;
  if (!email || !otpCode) {
    res.status(400).json({ error: 'Bad Request', message: 'Correo y código OTP requeridos.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const profile = MemoryDatabase.profiles.find(p => {
    const allowed = MemoryDatabase.allowedEmails.find(a => a.email.toLowerCase() === normalizedEmail);
    return allowed && p.fullName === allowed.fullName;
  });

  if (!profile || profile.otpCode !== otpCode) {
    res.status(401).json({ error: 'Unauthorized', message: 'Código OTP incorrecto.' });
    return;
  }

  // Check expiration
  if (profile.otpExpires && new Date() > new Date(profile.otpExpires)) {
    res.status(401).json({ error: 'Unauthorized', message: 'El código OTP ha expirado. Solicita otro inicio de sesión.' });
    return;
  }

  // Clear OTP code
  profile.otpCode = undefined;
  profile.otpExpires = undefined;

  // Sign mock JWT token
  const currentUnix = Math.floor(Date.now() / 1000);
  const payload = {
    sub: profile.id,
    email: normalizedEmail,
    exp: currentUnix + 3600 * 24 * 7,
    user_metadata: {
      role: profile.role,
      full_name: profile.fullName
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

