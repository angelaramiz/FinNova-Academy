-- ============================================================
-- FinNova Academy — ESQUEMA CONSOLIDADO (tablas vivas)
-- Proyecto Supabase: nhcgclqiihvioyqwqjlf
-- Generado: 2026-09-12. Espejo de docs/schema_db/esquema-base-datos.md
-- Idempotente: CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS +
--              DROP POLICY IF EXISTS. Se puede correr varias veces.
-- Orden: primero este archivo, luego verificar con la query final.
-- NO incluye las 15 tablas dadas de baja en Fase 1 (2026-09-12).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. IDENTIDAD Y ACCESO
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student'
        CHECK (role IN ('student', 'instructor', 'admin')),
    password_hash TEXT,
    must_change_password BOOLEAN DEFAULT false,
    otp_code TEXT,
    otp_expires TIMESTAMPTZ,
    points_earned INTEGER DEFAULT 0,
    specialty TEXT DEFAULT 'accounting'
        CHECK (specialty IN ('accounting', 'data_engineering', 'practicas')),
    plan TEXT NOT NULL DEFAULT 'free'
        CHECK (plan IN ('free', 'pro')),
    experience_density NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Por si la tabla ya existia sin las columnas de migraciones:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT 'accounting'
    CHECK (specialty IN ('accounting', 'data_engineering', 'practicas'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_density NUMERIC NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.allowed_emails (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'student'
        CHECK (role IN ('student', 'instructor', 'admin')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can read allowed emails" ON public.allowed_emails;
CREATE POLICY "Service role can read allowed emails" ON public.allowed_emails
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.account_requests (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
    specialty TEXT,
    career_branch TEXT DEFAULT NULL
        CHECK (career_branch IN ('analyst', 'engineering', 'science')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.account_requests ADD COLUMN IF NOT EXISTS career_branch TEXT DEFAULT NULL
    CHECK (career_branch IN ('analyst', 'engineering', 'science'));
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a registration request" ON public.account_requests;
CREATE POLICY "Anyone can submit a registration request" ON public.account_requests
    FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.email_queue (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('credentials', 'otp')),
    retries INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'dead')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_attempt_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_retries
    ON public.email_queue (status, retries, created_at);
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_public_access" ON public.email_queue;
CREATE POLICY "deny_public_access" ON public.email_queue FOR ALL USING (false);

-- ============================================================
-- 2. SUSCRIPCIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
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

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. SIMULADOR LABORAL (nucleo)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sim_companies (
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

CREATE TABLE IF NOT EXISTS public.sim_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    required_completion INT DEFAULT 0,
    unlocks_job_id UUID REFERENCES public.sim_jobs(id),
    category TEXT,
    min_score_to_pass NUMERIC(5,2) DEFAULT 60.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sim_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.sim_jobs(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.sim_tasks(id),
    job_id UUID REFERENCES public.sim_jobs(id),
    company_id UUID REFERENCES public.sim_companies(id),
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'late', 'failed')),
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

CREATE TABLE IF NOT EXISTS public.sim_world (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    career_path JSONB DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sim_world ADD COLUMN IF NOT EXISTS career_path JSONB DEFAULT NULL;
ALTER TABLE public.sim_world ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own sim_world select" ON public.sim_world;
CREATE POLICY "own sim_world select" ON public.sim_world
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own sim_world insert" ON public.sim_world;
CREATE POLICY "own sim_world insert" ON public.sim_world
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own sim_world update" ON public.sim_world;
CREATE POLICY "own sim_world update" ON public.sim_world
    FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sim_progress (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL
        CHECK (specialty IN ('accounting', 'data_engineering', 'practicas')),
    data JSONB NOT NULL DEFAULT '[]'::jsonb,
    breakdown JSONB DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, specialty)
);
ALTER TABLE public.sim_progress ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT NULL;
ALTER TABLE public.sim_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own sim_progress select" ON public.sim_progress;
CREATE POLICY "own sim_progress select" ON public.sim_progress
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own sim_progress insert" ON public.sim_progress;
CREATE POLICY "own sim_progress insert" ON public.sim_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own sim_progress update" ON public.sim_progress;
CREATE POLICY "own sim_progress update" ON public.sim_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sim_story (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    arc_id TEXT,
    scene_id TEXT,
    status TEXT DEFAULT 'ready',
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sim_story ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sim_story_select_own" ON public.sim_story;
CREATE POLICY "sim_story_select_own" ON public.sim_story
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sim_story_insert_own" ON public.sim_story;
CREATE POLICY "sim_story_insert_own" ON public.sim_story
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "sim_story_update_own" ON public.sim_story;
CREATE POLICY "sim_story_update_own" ON public.sim_story
    FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sim_story_delete_own" ON public.sim_story;
CREATE POLICY "sim_story_delete_own" ON public.sim_story
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. CV, EXPEDIENTE Y VERIFICACION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cv_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cv_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own cv_profiles select" ON public.cv_profiles;
CREATE POLICY "own cv_profiles select" ON public.cv_profiles
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own cv_profiles insert" ON public.cv_profiles;
CREATE POLICY "own cv_profiles insert" ON public.cv_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own cv_profiles update" ON public.cv_profiles;
CREATE POLICY "own cv_profiles update" ON public.cv_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.verification_links (
    slug TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL DEFAULT 'accounting',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verification_links_user
    ON public.verification_links (user_id);
ALTER TABLE public.verification_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own verification_links select" ON public.verification_links;
CREATE POLICY "own verification_links select" ON public.verification_links
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own verification_links insert" ON public.verification_links;
CREATE POLICY "own verification_links insert" ON public.verification_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own verification_links update" ON public.verification_links;
CREATE POLICY "own verification_links update" ON public.verification_links
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 5. VACANTES R-10
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vacancy_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vacancy_id TEXT NOT NULL,
    stage1_result_id UUID,
    modo TEXT DEFAULT 'B' CHECK (modo IN ('A', 'B')),
    status TEXT DEFAULT 'diagnostico'
        CHECK (status IN ('diagnostico', 'preparacion', 'postulacion', 'entrevista', 'cerrada')),
    vacante_titulo TEXT,
    vacante_stack TEXT,
    match_pct NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, vacancy_id)
);
ALTER TABLE public.vacancy_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vacancy_tracking_select_own" ON public.vacancy_tracking;
CREATE POLICY "vacancy_tracking_select_own" ON public.vacancy_tracking
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "vacancy_tracking_insert_own" ON public.vacancy_tracking;
CREATE POLICY "vacancy_tracking_insert_own" ON public.vacancy_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "vacancy_tracking_update_own" ON public.vacancy_tracking;
CREATE POLICY "vacancy_tracking_update_own" ON public.vacancy_tracking
    FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "vacancy_tracking_delete_own" ON public.vacancy_tracking;
CREATE POLICY "vacancy_tracking_delete_own" ON public.vacancy_tracking
    FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.stage1_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vacancy_text TEXT NOT NULL,
    vacancy_skills JSONB,
    requires_experience BOOLEAN DEFAULT false,
    match_pct NUMERIC,
    match_breakdown JSONB,
    routing TEXT CHECK (routing IN ('ETAPA_2_MODO_A', 'ETAPA_2_MODO_B', 'ETAPA_3')),
    answers JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.stage1_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stage1_assessments_select_own" ON public.stage1_assessments;
CREATE POLICY "stage1_assessments_select_own" ON public.stage1_assessments
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "stage1_assessments_insert_own" ON public.stage1_assessments;
CREATE POLICY "stage1_assessments_insert_own" ON public.stage1_assessments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "stage1_assessments_update_own" ON public.stage1_assessments;
CREATE POLICY "stage1_assessments_update_own" ON public.stage1_assessments
    FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "stage1_assessments_delete_own" ON public.stage1_assessments;
CREATE POLICY "stage1_assessments_delete_own" ON public.stage1_assessments
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 6. CALIDAD R-11 (solo backend via service role; sin politicas cliente)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quality_events (
    id BIGSERIAL PRIMARY KEY,
    user_hash TEXT NOT NULL,
    stage INT NOT NULL DEFAULT 0,
    type TEXT NOT NULL,
    ref JSONB NOT NULL DEFAULT '{}'::jsonb,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ts TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quality_events_type_idx ON public.quality_events (type);
CREATE INDEX IF NOT EXISTS quality_events_stage_idx ON public.quality_events (stage);
ALTER TABLE public.quality_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.item_stats (
    ref_id TEXT PRIMARY KEY,
    attempts INT NOT NULL DEFAULT 0,
    fail_rate REAL NOT NULL DEFAULT 0,
    avg_time_s INT NOT NULL DEFAULT 0,
    learning_gain REAL NOT NULL DEFAULT 0,
    discrimination REAL NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.item_stats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.misconceptions (
    id BIGSERIAL PRIMARY KEY,
    skill_id TEXT NOT NULL,
    pattern TEXT NOT NULL,
    example_anon TEXT,
    frequency INT NOT NULL DEFAULT 0,
    feedback_propuesto TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'aprobado', 'rechazado', 'desplegado')),
    ref JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.misconceptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.improvement_tickets (
    id BIGSERIAL PRIMARY KEY,
    origen TEXT NOT NULL,
    severidad TEXT DEFAULT 'media'
        CHECK (severidad IN ('baja', 'media', 'alta')),
    descripcion TEXT NOT NULL,
    ref JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'abierto'
        CHECK (status IN ('abierto', 'aprobado', 'rechazado', 'desplegado')),
    resuelto_por TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.improvement_tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.outcome_tracking (
    user_hash TEXT PRIMARY KEY,
    applied INT NOT NULL DEFAULT 0,
    interviews INT NOT NULL DEFAULT 0,
    hired BOOLEAN NOT NULL DEFAULT false,
    skills_entrevista JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.outcome_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. SOLO-REMOTA (DDL pendiente de traer a local — NO descomentar
--    hasta resolver RLS; ver docs/schema_db/esquema-base-datos.md seccion 2.7)
-- ============================================================
-- CREATE TABLE public.arboles_remotos ( ... );

-- ============================================================
-- 8. VERIFICACION (esperado: 22 tablas)
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY 1;
