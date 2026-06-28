-- SQL schema for AuraFi Academy / FinNova Supabase Database

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
