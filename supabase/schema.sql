-- SQL schema for AuraFi Academy / FinNova Supabase Database

-- 0. Profiles Table (usuarios del sistema)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    password_hash TEXT,
    must_change_password BOOLEAN DEFAULT false,
    otp_code TEXT,
    otp_expires TIMESTAMPTZ,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 0a. Allowed Emails (correos pre-autorizados)
CREATE TABLE IF NOT EXISTS allowed_emails (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can read allowed emails" ON allowed_emails FOR SELECT USING (true);

-- 0b. Account Requests (solicitudes públicas de registro)
CREATE TABLE IF NOT EXISTS account_requests (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
    specialty TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE account_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a registration request" ON account_requests FOR INSERT WITH CHECK (true);

-- 0c. Email Queue (cola persistente de correos)
CREATE TABLE IF NOT EXISTS email_queue (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('credentials', 'otp')),
    retries INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dead')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_attempt_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_retries ON email_queue (status, retries, created_at);
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_public_access" ON email_queue FOR ALL USING (false);
COMMENT ON TABLE email_queue IS 'Cola persistente de correos. Almacena envíos fallidos para reintento.';

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    category TEXT,
    learning_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clips Table
CREATE TABLE IF NOT EXISTS clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    video_provider_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    sequence_order INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'reviewing', 'approved')),
    section TEXT,
    video_format TEXT DEFAULT '9:16' CHECK (video_format IN ('9:16', '16:9')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, course_id, clip_id)
);

-- 4. Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    exercise_type TEXT NOT NULL CHECK (exercise_type IN ('multiple_choice', 'formula', 'ratio_calculation', 'portfolio_weight')),
    question TEXT NOT NULL,
    prompt TEXT,
    correct_answer TEXT NOT NULL,
    rubrics JSONB,
    max_points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Exercise Attempts Table
CREATE TABLE IF NOT EXISTS exercise_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_passed BOOLEAN DEFAULT false,
    score_points INTEGER NOT NULL DEFAULT 0,
    evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('deterministic', 'ai_evaluated', 'hybrid')),
    ai_feedback TEXT,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Pipeline Reviews Table (n8n/video pipeline)
CREATE TABLE IF NOT EXISTS pipeline_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID REFERENCES clips(id) ON DELETE SET NULL,
    input_prompt TEXT NOT NULL,
    draft_audio_url TEXT,
    voice_model_used TEXT,
    video_generation_prompt TEXT,
    rendered_video_url TEXT,
    pipeline_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending_ingredients', 'tts_generated', 'video_composited', 'awaiting_approval', 'approved', 'rejected')),
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Student Q&A Table
CREATE TABLE IF NOT EXISTS student_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
    clip_title TEXT NOT NULL,
    question_text TEXT NOT NULL,
    reply_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    replied_at TIMESTAMPTZ
);

-- ============================================================
-- SIMULADOR LABORAL 3D - TABLAS NUEVAS (Fase 0)
-- ============================================================

-- 8. Planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'MXN',
    interval TEXT CHECK (interval IN ('month', 'quarter', 'one_time')),
    interval_count INT DEFAULT 1,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Suscripciones de usuarios
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Empresas ficticias del simulador
CREATE TABLE IF NOT EXISTS sim_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    industry TEXT,
    address TEXT,
    phone TEXT,
    fiscal_regime TEXT,
    complexity INT DEFAULT 1 CHECK (complexity BETWEEN 1 AND 5),
    logo_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Clientes de esas empresas (para facturación/cobranza)
CREATE TABLE IF NOT EXISTS sim_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES sim_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tax_id TEXT,
    credit_limit NUMERIC(15,2),
    payment_terms TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    email TEXT,
    phone TEXT,
    metadata JSONB
);

-- 12. Productos/Servicios
CREATE TABLE IF NOT EXISTS sim_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES sim_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price > 0),
    unit_type TEXT,
    tax_rate NUMERIC(5,4) DEFAULT 0.16,
    category TEXT,
    sku TEXT,
    CONSTRAINT positive_price CHECK (unit_price > 0)
);

-- 13. Puestos simulados (catálogo de carrera)
CREATE TABLE IF NOT EXISTS sim_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    required_completion INT DEFAULT 0,
    unlocks_job_id UUID REFERENCES sim_jobs(id),
    category TEXT,
    min_score_to_pass NUMERIC(5,2) DEFAULT 60.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Tareas asignables a un puesto
CREATE TABLE IF NOT EXISTS sim_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES sim_jobs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL,
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    estimated_minutes INT,
    required_fields JSONB,
    validation_rules JSONB,
    document_template TEXT,
    sequence_order INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Asignación de tareas a usuarios
CREATE TABLE IF NOT EXISTS user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES sim_tasks(id),
    job_id UUID REFERENCES sim_jobs(id),
    company_id UUID REFERENCES sim_companies(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'late', 'failed')),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    score NUMERIC(5,2) CHECK (score BETWEEN 0 AND 100),
    quality_score NUMERIC(5,2) CHECK (quality_score BETWEEN 0 AND 100),
    is_passed BOOLEAN,
    feedback_text TEXT,
    attempt_count INT DEFAULT 0,
    metadata JSONB
);

-- 16. Eventos del simulador
CREATE TABLE IF NOT EXISTS sim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT,
    description TEXT,
    trigger_type TEXT CHECK (trigger_type IN ('scheduled', 'random', 'conditional')),
    trigger_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    affects_task_id UUID REFERENCES sim_tasks(id),
    personaje TEXT,
    message_template TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'expired'))
);

-- 17. Facturas emitidas (simuladas)
CREATE TABLE IF NOT EXISTS sim_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES sim_companies(id),
    client_id UUID REFERENCES sim_clients(id),
    user_task_id UUID REFERENCES user_tasks(id),
    invoice_number TEXT NOT NULL,
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15,2),
    tax NUMERIC(15,2),
    total NUMERIC(15,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    paid_date DATE,
    payment_method TEXT,
    metadata JSONB,
    UNIQUE(company_id, invoice_number)
);

-- 18. Registro de actividad en pantalla
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID,
    activity_type TEXT NOT NULL,
    task_id UUID REFERENCES user_tasks(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    last_heartbeat TIMESTAMPTZ DEFAULT now(),
    active_minutes INT DEFAULT 0,
    inactive_minutes INT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'timeout'))
);

-- 20. Alertas de desempeño
CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('abandonment', 'systematic_delay', 'stagnation', 'low_score')),
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT,
    description TEXT,
    triggered_at TIMESTAMPTZ DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- 21. Certificados
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    folio TEXT UNIQUE NOT NULL,
    job_id UUID REFERENCES sim_jobs(id),
    title TEXT NOT NULL,
    total_hours NUMERIC(8,2),
    tasks_completed INT,
    avg_quality_score NUMERIC(5,2),
    max_difficulty INT,
    issued_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    metadata JSONB
);

-- 22. Evidencias del portafolio
CREATE TABLE IF NOT EXISTS portfolio_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES user_tasks(id),
    document_type TEXT,
    document_url TEXT,
    title TEXT,
    description TEXT,
    score NUMERIC(5,2) CHECK (score BETWEEN 0 AND 100),
    added_at TIMESTAMPTZ DEFAULT now()
);
