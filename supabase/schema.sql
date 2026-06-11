-- Supabase Database Schema for Financial Micro-learning Platform
-- senior-designed PWA architecture

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Define Roles as a Check constraint or Postgres Enum
-- We will represent user roles in the profiles table

-- -------------------------------------------------------------
-- 1. PROFILES Table (Extends Supabase standard auth.users)
-- -------------------------------------------------------------
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    fullName text,
    avatarUrl text,
    role text not null default 'student' check (role in ('student', 'instructor', 'admin')),
    pointsEarned integer not null default 0,
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null,
    updatedAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Protect profiles table
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile or public instructor profiles"
    on public.profiles for select
    using (auth.uid() = id or role = 'instructor' or role = 'admin');

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- -------------------------------------------------------------
-- 2. COURSES Table
-- -------------------------------------------------------------
create table if not exists public.courses (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
    slug text not null unique,
    imageUrl text,
    instructorId uuid references public.profiles(id) on delete set null,
    isPublished boolean not null default false,
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null,
    updatedAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for courses
alter table public.courses enable row level security;

-- Policies for Courses
create policy "Anyone can view published courses"
    on public.courses for select
    using (isPublished = true);

create policy "Instructors can view unpublished courses they own"
    on public.courses for select
    using (auth.uid() = instructorId);

create policy "Instructors and Admins can perform CRUD on courses"
    on public.courses for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and role in ('instructor', 'admin')
        )
    );

-- -------------------------------------------------------------
-- 3. CLIPS Table (Short microlearning videos < 60s)
-- -------------------------------------------------------------
create table if not exists public.clips (
    id uuid default gen_random_uuid() primary key,
    courseId uuid references public.courses(id) on delete cascade not null,
    title text not null,
    description text,
    videoProviderId text, -- CF Stream media UID or video index
    videoUrl text not null, -- stream playlist or mp4 direct link
    duration integer not null default 0, -- in seconds, <=60s
    sequenceOrder integer not null default 1,
    status text not null default 'draft' check (status in ('draft', 'reviewing', 'approved')),
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null,
    updatedAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for clips
alter table public.clips enable row level security;

-- Policies for Clips
create policy "Anyone can view clips of published courses"
    on public.clips for select
    using (
        exists (
            select 1 from public.courses
            where courses.id = clips.courseId and courses.isPublished = true
        )
    );

create policy "Instructors can manage clips for courses they own"
    on public.clips for all
    using (
        exists (
            select 1 from public.courses
            where courses.id = clips.courseId and courses.instructorId = auth.uid()
        )
    );

-- -------------------------------------------------------------
-- 4. USER PROGRESS Table
-- -------------------------------------------------------------
create table if not exists public.user_progress (
    id uuid default gen_random_uuid() primary key,
    userId uuid references public.profiles(id) on delete cascade not null,
    courseId uuid references public.courses(id) on delete cascade not null,
    clipId uuid references public.clips(id) on delete cascade not null,
    watchedSeconds integer not null default 0,
    isCompleted boolean not null default false,
    updatedAt timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(userId, clipId)
);

-- Enable RLS for Progress
alter table public.user_progress enable row level security;

-- Policies for Progress
create policy "Users can view and edit their own progress"
    on public.user_progress for all
    using (auth.uid() = userId);

-- -------------------------------------------------------------
-- 5. EXERCISES Table (Practical exercises linked to video clips)
-- -------------------------------------------------------------
create table if not exists public.exercises (
    id uuid default gen_random_uuid() primary key,
    clipId uuid references public.clips(id) on delete cascade not null,
    title text not null,
    exerciseType text not null check (exerciseType in ('multiple_choice', 'formula', 'ratio_calculation', 'portfolio_weight')),
    question text not null,
    prompt text, -- structured instruction for grading / LLM
    correctAnswer text not null, -- string representing solution key or strict formula regex
    rubrics jsonb, -- Grading criteria for AI evaluating formula or reasoning steps
    maxPoints integer not null default 10,
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for exercises
alter table public.exercises enable row level security;

-- Policies for Exercises
create policy "Anyone can view exercises of visible clips"
    on public.exercises for select
    using (
        exists (
            select 1 from public.clips
            join public.courses on courses.id = clips.courseId
            where clips.id = exercises.clipId and courses.isPublished = true
        )
    );

-- -------------------------------------------------------------
-- 6. EXERCISE ATTEMPTS Table (Submission log and hybrid grading status)
-- -------------------------------------------------------------
create table if not exists public.exercise_attempts (
    id uuid default gen_random_uuid() primary key,
    userId uuid references public.profiles(id) on delete cascade not null,
    exerciseId uuid references public.exercises(id) on delete cascade not null,
    userAnswer text not null,
    isPassed boolean not null default false,
    scorePoints integer not null default 0,
    evaluationType text not null default 'deterministic' check (evaluationType in ('deterministic', 'ai_evaluated', 'hybrid')),
    aiFeedback text, -- Detailed evaluation feedback from Gemini AI
    attemptedAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Exercise Attempts
alter table public.exercise_attempts enable row level security;

-- Policies for attempts
create policy "Users can view and create their own attempts"
    on public.exercise_attempts for all
    using (auth.uid() = userId);

-- -------------------------------------------------------------
-- 7. PIPELINE REVIEWS Table (Pipeline states for automation/clip creation)
-- -------------------------------------------------------------
create table if not exists public.pipeline_reviews (
    id uuid default gen_random_uuid() primary key,
    clipId uuid references public.clips(id) on delete cascade,
    inputPrompt text not null,
    draftAudioUrl text,
    voiceModelUsed text,
    videoGenerationPrompt text,
    renderedVideoUrl text,
    pipelineId text, -- trace ID from n8n / workflow engines
    status text not null default 'pending_ingredients' check (status in ('pending_ingredients', 'tts_generated', 'video_composited', 'awaiting_approval', 'approved', 'rejected')),
    reviewerNotes text,
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null,
    updatedAt timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Pipeline Reviews
alter table public.pipeline_reviews enable row level security;

-- Policies for pipeline - restricted to Instructors and Admins
create policy "Instructors and administrators can view pipeline reviews"
    on public.pipeline_reviews for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and role in ('instructor', 'admin')
        )
    );

create policy "Instructors and administrators can edit pipeline reviews"
    on public.pipeline_reviews for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and role in ('instructor', 'admin')
        )
    );

-- -------------------------------------------------------------
-- PERFORMANCE INDEXES
-- -------------------------------------------------------------
create index if not exists idx_courses_instructor on public.courses (instructorId);
create index if not exists idx_clips_course on public.clips (courseId, sequenceOrder);
create index if not exists idx_progress_user_course on public.user_progress (userId, courseId);
create index if not exists idx_exercises_clip on public.exercises (clipId);
create index if not exists idx_attempts_user_exercise on public.exercise_attempts (userId, exerciseId);
create index if not exists idx_pipeline_clip on public.pipeline_reviews (clipId);

-- -------------------------------------------------------------
-- AUTOMATED TRIGGERS (Created_at / Updated_at synchronization)
-- -------------------------------------------------------------

-- Create a helper function to set updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updatedAt = now();
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for Profiles
create trigger trigger_profiles_updated_at
    before update on public.profiles
    for each row execute procedure public.handle_updated_at();

-- Trigger for Courses
create trigger trigger_courses_updated_at
    before update on public.courses
    for each row execute procedure public.handle_updated_at();

-- Trigger for Clips
create trigger trigger_clips_updated_at
    before update on public.clips
    for each row execute procedure public.handle_updated_at();

-- Trigger for Pipeline Reviews
create trigger trigger_pipeline_updated_at
    before update on public.pipeline_reviews
    for each row execute procedure public.handle_updated_at();

-- Automatically bind profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, fullName, avatarUrl, role, pointsEarned)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        new.raw_user_meta_data->>'avatar_url',
        coalesce(new.raw_user_meta_data->>'role', 'student'),
        0
    );
    return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth users
-- Tip: In realistic cloud, this binds to standard auth schema:
-- create trigger on_auth_user_created
--     after insert on auth.users
--     for each row execute procedure public.handle_new_user();
