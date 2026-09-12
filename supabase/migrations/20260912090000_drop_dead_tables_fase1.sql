-- Fase 1 cleanup (2026-09-12, orden Angel): DROP de 15 tablas muertas.
-- Verificado: cero lecturas en backend/src (endpoints /exercises usan excelExercises.ts
-- en memoria; /api/courses desmontado en backend/_archive), cero .from() en
-- alumnos/src, y mapa FK completo: NINGUNA tabla viva referencia a las muertas
-- (las vivas solo aparecen como destino: profiles, sim_companies, sim_tasks,
-- sim_jobs, user_tasks). Orden hijo->padre dentro del set muerto; sin CASCADE
-- a proposito: si algo oculto depende, falla en voz alta.
-- Backup previo: backup_fase1_courses.json (1 row) + backup_fase1_sim_clients.json
-- (5 rows) en temp. Tablas vivas NO tocadas: profiles, allowed_emails,
-- account_requests, email_queue, user_subscriptions, subscription_plans,
-- sim_companies, sim_jobs, sim_tasks, user_tasks, sim_world, sim_progress,
-- sim_story, cv_profiles, verification_links, vacancy_tracking,
-- stage1_assessments, quality_events, item_stats, misconceptions,
-- improvement_tickets, outcome_tracking, arboles_remotos.

-- Nivel 0: solo referencian tablas vivas o muertas ya listadas abajo.
DROP TABLE IF EXISTS public.exercise_attempts;
DROP TABLE IF EXISTS public.user_progress;
DROP TABLE IF EXISTS public.pipeline_reviews;
DROP TABLE IF EXISTS public.sim_invoices;
DROP TABLE IF EXISTS public.sim_events;
DROP TABLE IF EXISTS public.user_activity_log;
DROP TABLE IF EXISTS public.user_sessions;
DROP TABLE IF EXISTS public.user_alerts;
DROP TABLE IF EXISTS public.certificates;
DROP TABLE IF EXISTS public.portfolio_evidences;
DROP TABLE IF EXISTS public.sim_products;

-- Nivel 1: referenciadas por el nivel 0.
DROP TABLE IF EXISTS public.exercises;
DROP TABLE IF EXISTS public.clips;

-- Nivel 2: raiz del set muerto.
DROP TABLE IF EXISTS public.courses;
DROP TABLE IF EXISTS public.sim_clients;
