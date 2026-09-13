# Esquema de base de datos — FinNova Academy

> **Proposito:** backup legible del esquema, referencia para planificar cambios
> y guia de recreacion/migracion si se cambia de proveedor de DB.
> **Proyecto Supabase:** `nhcgclqiihvioyqwqjlf` (finnova).
> **Generado:** 2026-09-12 desde `supabase/schema.sql` + `supabase/migrations/*.sql`
> + `supabase/apply-migrations.sql` + baseline `20260903_baseline_audit.sql`.
> **Regla:** este archivo es DOCUMENTACION. El cambio real siempre va en una
> migracion nueva en `supabase/migrations/`; despues se actualiza este archivo.

## 1. Recreacion desde cero (orden)

1. Crear proyecto Postgres (Supabase u otro) con extension `pgcrypto`
   (para `gen_random_uuid()`). En Supabase ya viene habilitada.
2. Aplicar `supabase/schema.sql` (tablas base 0-22, algunas hoy dadas de baja).
3. Aplicar migraciones en orden de fecha:
   `persist_sim_world` -> `persist_sim_progress` -> `add_profiles_specialty`
   -> `career_path` -> `cv_profiles` -> `account_requests_career_branch`
   -> `verification_links` -> `sim_story` -> `auth_plans` -> `quality_flywheel`
   -> `drop_dead_tables_fase1`.
4. Si se migro desde el proyecto actual, aplicar ademas los pendientes
   solo-remotos de la seccion 5 (arboles_remotos, specialty practicas).
5. Verificar con la query de la seccion 6.

## 2. Tablas vivas (23)

### 2.1 Identidad y acceso

**profiles** (1 usuario = 1 fila, PK = `auth.users.id`)
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | FK `auth.users(id)` ON DELETE CASCADE |
| email | TEXT | |
| full_name | TEXT NOT NULL | |
| avatar_url | TEXT | |
| role | TEXT NOT NULL DEF 'student' | CHECK student/instructor/admin |
| password_hash | TEXT | bcrypt (P0: solo bcrypt, sin fallback texto plano) |
| must_change_password | BOOLEAN DEF false | |
| otp_code / otp_expires | TEXT / TIMESTAMPTZ | OTP en pausa (backlog-futuro) |
| points_earned | INTEGER DEF 0 | |
| specialty | TEXT DEF 'accounting' | migracion add_profiles_specialty. Remoto admite tambien 'practicas' |
| plan | TEXT NOT NULL DEF 'free' | migracion auth_plans. CHECK free/pro |
| experience_density | NUMERIC NOT NULL DEF 0 | migracion auth_plans (Etapa 3) |
| created_at | TIMESTAMPTZ DEF now() | |

**allowed_emails** — correos pre-autorizados. PK email; role con CHECK; RLS con
politica de lectura para service role.

**account_requests** — solicitudes publicas de registro. PK id TEXT; email UNIQUE;
role CHECK student/instructor; status CHECK pending/approved/rejected;
`career_branch` (migracion: analyst/engineering/science, NULL permitido).
RLS: INSERT publico (politica "Anyone can submit...").

**email_queue** — cola persistente de correos. PK id TEXT; email_type CHECK
credentials/otp; status CHECK pending/sent/dead; retries; indice
`(status, retries, created_at)`. RLS: `deny_public_access` (USING false).

### 2.2 Suscripciones (Stripe)

**subscription_plans** — PK uuid; name; price NUMERIC(10,2); currency DEF 'MXN';
interval CHECK month/quarter/one_time; features JSONB; is_active.

**user_subscriptions** — PK uuid; user_id FK profiles CASCADE; plan_id FK plans;
stripe_subscription_id / stripe_customer_id TEXT; status CHECK
active/past_due/cancelled/expired/trialing; periodos y cancelled_at.

### 2.3 Simulador laboral (nucleo)

**sim_companies** — empresas ficticias. PK uuid; name; tax_id (RFC); industry;
address; phone; fiscal_regime; complexity 1-5; metadata JSONB.

**sim_jobs** — catalogo de puestos. PK uuid; title; difficulty 1-5;
required_completion; unlocks_job_id (self-FK, cadena de desbloqueo);
min_score_to_pass NUMERIC(5,2) DEF 60.

**sim_tasks** — tareas por puesto. PK uuid; job_id FK CASCADE; task_type TEXT;
difficulty 1-5; estimated_minutes; required_fields / validation_rules JSONB;
document_template; sequence_order; is_active.

**user_tasks** — asignaciones a alumnos. PK uuid; user_id FK profiles CASCADE;
task_id FK sim_tasks (nullable, sin cascade); job_id; company_id; status CHECK
pending/in_progress/completed/late/failed; assigned_at; deadline NOT NULL;
score / quality_score 0-100; is_passed; feedback_text; attempt_count; metadata.

**sim_world** — estado del mundo vivo por usuario. PK user_id FK profiles CASCADE;
state JSONB (pipeline, SLAs, acciones); `career_path` JSONB NULL
(migracion career_path; el breakdown vive dentro de state, verificado remoto).
RLS propia (select/insert/update).

**sim_progress** — completaciones por usuario+especialidad. PK (user_id, specialty);
specialty CHECK accounting/data_engineering (remoto admite practicas);
data JSONB (TaskCompletion[]); updated_at. RLS propia.

**sim_story** — mundo vivo: arco/escena activos. PK user_id FK profiles CASCADE;
arc_id / scene_id TEXT; status DEF 'ready'; payload JSONB. RLS completa + delete.

### 2.4 CV, expediente y verificacion

**cv_profiles** — datos extra del CV. PK user_id FK profiles CASCADE;
data JSONB DEF '{}'; updated_at. RLS propia.

**verification_links** — links publicos del expediente. PK slug TEXT;
user_id FK profiles CASCADE + indice; specialty DEF 'accounting';
active DEF true; revoked_at NULL. RLS propia (lectura publica real se hace por
endpoint sin auth que solo expone slug activo).

### 2.5 Vacantes R-10 (pausado, tablas vigentes)

**vacancy_tracking** — PK uuid; user_id FK profiles CASCADE; vacancy_id TEXT;
stage1_result_id UUID (sin FK declarada); modo CHECK A/B DEF 'B';
status CHECK diagnostico/preparacion/postulacion/entrevista/cerrada;
vacante_titulo/stack/match_pct; UNIQUE (user_id, vacancy_id). RLS propia CRUD.

**stage1_assessments** — PK uuid; user_id FK profiles CASCADE; vacancy_text NOT NULL;
vacancy_skills / match_breakdown / answers JSONB; requires_experience BOOL;
match_pct; routing CHECK ETAPA_2_MODO_A/ETAPA_2_MODO_B/ETAPA_3. RLS propia CRUD.

### 2.6 Calidad R-11 (pausado salvo telemetria, tablas vigentes)

**quality_events** — PK bigserial; user_hash TEXT (sha256 irreversible, cero PII);
stage INT 0-4; type TEXT; ref/data JSONB; ts. Indices por type y stage.
RLS sin politicas para cliente (solo service role via backend).

**item_stats** — PK ref_id TEXT; attempts; fail_rate REAL; avg_time_s;
learning_gain REAL; discrimination REAL. RLS sin politicas cliente.

**misconceptions** — PK bigserial; skill_id; pattern; example_anon;
frequency; feedback_propuesto; status CHECK pendiente/aprobado/rechazado/desplegado.
RLS sin politicas cliente.

**improvement_tickets** — PK bigserial; origen; severidad CHECK baja/media/alta;
descripcion; ref JSONB; status CHECK abierto/aprobado/rechazado/desplegado;
resuelto_por. RLS sin politicas cliente.

**outcome_tracking** — PK user_hash TEXT; applied; interviews; hired BOOL;
skills_entrevista JSONB. RLS sin politicas cliente. Requiere consentimiento.

### 2.7 Solo-remota (sin DDL local — traer antes de migrar proveedor)

**arboles_remotos** — 1 row. DDL local pendiente (ticket R5/R6 del baseline).
HALLAZGO ABIERTO: RLS DISABLED en remoto pese al fix (decide Angel; ver baseline
lineas 45-49). OBLIGATORIO resolver antes de cualquier migracion de datos.

## 3. Tablas dadas de baja (Fase 1, 2026-09-12)

Eliminadas por `20260912090000_drop_dead_tables_fase1.sql` (verificado: cero
lecturas en backend/frontend, sin FK desde tablas vivas; backup previo de
courses 1 row y sim_clients 5 rows en temp):
courses, clips, exercises, exercise_attempts, user_progress, pipeline_reviews,
sim_invoices, sim_events, user_activity_log, user_sessions, user_alerts,
certificates, portfolio_evidences, sim_products, sim_clients.
NOTA: `supabase/seed.sql` y `supabase/schema.sql` aun las definen/pueblan —
estan STALE para ese set; no usar el seed sin filtrar.

## 4. Convenciones RLS (para replicar en otro proveedor)

- Patron estandar: `ENABLE ROW LEVEL SECURITY` + 3 politicas
  (`auth.uid() = user_id`) para select/insert/update. Tablas del nucleo
  (sim_world, sim_progress, sim_story, cv_profiles, verification_links,
  vacancy_tracking, stage1_assessments) lo siguen.
- Excepciones: allowed_emails (lectura service role), account_requests
  (insert publico), email_queue (denegado total), quality_* (sin politicas:
  solo backend con service role).
- Fuera de Supabase, `auth.uid()` se sustituye por el user_id de la sesion
  (middleware) o por vistas `WHERE user_id = current_setting('app.user_id')`.

## 5. Migracion de datos a otro proveedor (checklist)

1. Exportar datos: `pg_dump --data-only` por tabla viva (orden: profiles
   primero por ser raiz de FK; las series quality_* y outcome al final).
2. Recrear `auth.users` o remapear: `profiles.id` es FK a `auth.users(id)`.
   Sin Supabase Auth hay que crear la tabla de usuarios propia ANTES y
   mantener los mismos UUID (no regenerar ids o se rompen todas las FK).
3. Recrear CHECKs tal cual (son regla de negocio: roles, status, specialty).
4. JSONB -> JSONB (Postgres) o JSON (MySQL: revisar defaults `'{}'::jsonb`).
5. bigserial -> BIGSERIAL/IDENTITY segun motor.
6. Politicas RLS -> politicas del motor nuevo o capa de aplicacion (seccion 4).
7. Resolver `arboles_remotos` (RLS + DDL) ANTES de mover sus datos.
8. Re-correr la query de verificacion (seccion 6) contra el destino.

## 6. Query de verificacion (tablas vivas esperadas = 22 + 1 remota)

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY 1;
-- Esperado: account_requests, allowed_emails, cv_profiles, email_queue,
-- improvement_tickets, item_stats, misconceptions, outcome_tracking,
-- profiles, quality_events, sim_companies, sim_jobs, sim_progress,
-- sim_story, sim_tasks, sim_world, stage1_assessments, subscription_plans,
-- user_subscriptions, user_tasks, vacancy_tracking, verification_links
-- (+ arboles_remotos solo en remoto)
```

## 7. Historial de cambios (resumen)

| Fecha | Cambio | Archivo |
|---|---|---|
| 2026-06-23 | email_queue | migration_email_queue.sql (legacy, plegado en schema) |
| 2026-08-12 | sim_world, sim_progress | persist_sim_world / persist_sim_progress |
| 2026-08-15 | profiles.specialty, career_path/breakdown | add_profiles_specialty, career_path |
| 2026-08-16 | cv_profiles | cv_profiles |
| 2026-08-17 | career_branch, verification_links | account_requests_career_branch, verification_links |
| 2026-08-18 | sim_story | sim_story |
| 2026-08-19 | plans/density, vacancy_tracking, stage1_assessments, quality_* 5 tablas | auth_plans, quality_flywheel |
| 2026-08-22/24 | practicas specialty, arboles_remotos (solo remoto) | ver baseline R4-R6 |
| 2026-09-03 | baseline: 10/10 locales con equivalente remoto | 20260903_baseline_audit.sql |
| 2026-09-12 | DROP 15 tablas muertas (Fase 1) | drop_dead_tables_fase1 |
