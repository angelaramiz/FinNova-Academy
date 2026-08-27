# Plan — Ingesta de Datos Reales (multi-fuente) — PENDIENTE

> Estado: **PENDIENTE / BACKLOG** — no implementado. Diseño para que la carrera data deje de operar solo sobre el mart compilado (`MART_TOTAL=128350` en `dbtCatalog.ts`) y pueda cargar dataframes reales (CSV/Kaggle/APIs/BD/S3). Deja el trabajo en `ENGINE_BACKLOG` (`engineCapabilities.ts:86` + `GET /api/automator/pending-engines`) como motor `real_ingest`.

## Objetivo

Permitir a un alumno (analista→ingeniero→científico) **traer su propio dataset** y operar el mismo flujo (SQL/Notebook/dbt/BI) sin romper la regla de oro R-09: *números/golden de motores; solo el texto de la vacante usa IA*.

Fuentes objetivo:

| Fuente | Ej. | Modo |
|--------|-----|------|
| CSV local | `ventas_2026.csv` drag&drop | Upload → S3 `raw/` → `NotebookSim` `pd.read_csv` real |
| Kaggle | `titanic`, `store-sales` | `kaggle.json` env → `kaggle datasets download` vía proxy backend → mismo flujo |
| API REST pública | `api.github.com`, `api.externa.com` | `ApiClientSim` URL libre + auth header → `GET` → JSON → DataFrame |
| BD (Postgres/Supabase) | `supabase_analytics.ventas` | Conexión read-only a Supabase/Neon (RLS) → `SQLSim` `SELECT` real |
| S3 / GCS | `s3://bucket/archivo.parquet` | Credenciales IAM de solo lectura → `CloudSim` browser → ingest |
| Excel | `reporte.xlsx` | Parse con `xlsx` → DataFrame (extensión de `SpreadsheetSim`) |

No se pedirá al alumno credenciales de prod; toda ingesta es **read-only** y **anonimizada** (PII scrub via `piiScrubber.ts`).

## No-objetivos (v1)

- Escritura a prod, scheduling real de Airflow, ni DML sobre Supabase.
- Streaming/Kafka.
- PII sin scrub.

## Arquitectura

```
┌─────────────┐     upload/URL/BD       ┌──────────────────┐     DF real     ┌────────────┐
│ Alumno      │ ──────────────────────► │  Ingest Service  │ ──────────────► │ NotebookSim│
│ (Desktop)   │  CSV/Kaggle/API/BD/S3  │  (backend)       │  auditDocument  │ SQLSim     │
└─────────────┘                         └──────────────────┘  piiScrubber   │ BI/Stats/ML│
                                            │  S3 raw/       └────────────┘
                                            │  Postgres FDW
                                            ▼
                                        ┌────────┐
                                        │ S3 raw │
                                        └────────┘
```

### Nuevo dominio: `real_ingest` (R-12)

En `backend/src/services/engineCapabilities.ts:60` registrar:

```ts
{ id: 'real_ingest', skill: 'Ingesta real', status: 'missing',
  label: 'Ingesta de datos reales', icon: '📥',
  aliases: ['csv', 'kaggle', 'api rest', 'postgres', 's3', 'excel'],
  gap: 'No hay upload de CSV ni proxy de API externa ni conector BD/S3; solo SOURCES/MODELS simulados.',
  buildPlan: [
    'IngestService: proxy de APIs + conector Postgres read-only + parser CSV/Excel + wrapper Kaggle',
    'S3 raw: bucket por usuario + listado en CloudSim',
    'NotebookSim: pd.read_csv(url) real sobre el DF ingerido + SQLSim SELECT sobre FDW',
    'Validación: auditDocument + piiScrubber + límites (10 MB, 100k filas)',
  ]},
```

Al compilar una vacante que pida "API REST" / "Kaggle" / "SQL sobre Postgres real", `roadmapCompiler.ts` hace `registerEngineRequirement(real_ingest)` y queda en `ENGINE_BACKLOG` como **PENDIENTE** (endpoint `GET /api/automator/pending-engines` ya lo expone).

## Backend

### Servicio nuevo: `backend/src/services/ingestService.ts`

```ts
export type IngestSource = 'csv'|'kaggle'|'api'|'postgres'|'s3'|'excel';
export interface IngestResult {
  source: IngestSource;
  datasetId: string;          // ulid
  rows: number; columns: string[];
  preview: Record<string, any>[]; // 5 filas
  s3Key?: string;              // raw/<userId>/<datasetId>.csv
  pgTable?: string;            // fdw.ingest_<datasetId>
  scrubbed: boolean;
  warnings: string[];
}
export async function ingestCSV(userId, file: Buffer, name): Promise<IngestResult>
export async function ingestAPI(userId, url, headers): Promise<IngestResult>  // SSRF allowlist + timeout 10s
export async function ingestKaggle(userId, slug): Promise<IngestResult>
export async function ingestPostgres(userId, query): Promise<IngestResult>     // solo SELECT, EXPLAIN antes
export async function listDatasets(userId): Promise<IngestResult[]>
```

- **CSV/Excel**: `multer` (10 MB) → `papaparse`/`xlsx` → valida con `auditDocument.ts` (columnas con `__` , tipos, filas vacías) → `piiScrubber.scrubData()` → escribe `supabase storage` bucket `ingest-raw` (`<userId>/<datasetId>.csv`) + registra en `ingest_datasets` (tabla nueva).
- **API**: proxy `GET` con `allowlist` (no `169.254.0.0/16`, no `metadata.google.internal`), `AbortController` 10 s, `content-type: application/json|text/csv`, límite 2 MB, `piiScrubber`.
- **Kaggle**: env `KAGGLE_USERNAME/KAGGLE_KEY` en backend (no se expone al alumno); alumnos pegan `slug` (`titanic`). Backend hace `kaggle datasets download -d <slug> -p /tmp` (o usa `kagglehub` si disponible) → mismo flujo CSV.
- **Postgres**: `postgres_fdw` o pool read-only. Solo `SELECT` (regex + `EXPLAIN`); si no es `SELECT`, 400. Ejecuta, pagina 100k filas máx, scrub.
- **S3**: credenciales IAM de solo lectura por `ingestService` (no del alumno). Lista con `CloudSim` ya existente.

### Tabla nueva (Supabase): `ingest_datasets`

```sql
create table ingest_datasets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('csv','kaggle','api','postgres','s3','excel')),
  dataset_id text not null,
  name text not null,
  rows int not null, columns jsonb not null,
  s3_key text, pg_table text,
  scrubbed boolean not null default false,
  created_at timestamptz default now()
);
-- RLS: user ve solo los suyos
```

Migración: `supabase/migrations/20260827000000_ingest_datasets.sql` (PENDIENTE de aplicar).

### Endpoints nuevos: `backend/src/routes/ingest.ts` (PENDIENTE)

```
POST   /api/ingest/csv        (multipart, requireSupabaseAuth) → IngestResult
POST   /api/ingest/kaggle     { slug }                         → IngestResult
POST   /api/ingest/api        { url, headers? }                → IngestResult
POST   /api/ingest/postgres   { sql }                          → IngestResult  (solo SELECT)
GET    /api/ingest/datasets                                → IngestResult[]
DELETE /api/ingest/datasets/:id                            → 204
```

Todos persisten en `ingest_datasets` + `quality_events` (`type: ingest_ok/ingest_fail`) para el flywheel R-11 (sin PII).

### Seguridad

- Archivos: 10 MB, 100k filas, tipos permitidos `text/csv`, `application/vnd.*excel`, `application/json`.
- `piiScrubber` obligatorio antes de persistir/preview.
- API proxy: allowlist de dominios, SSRF block, timeout, sin reenvío de `Authorization` del alumno.
- Postgres: solo `SELECT` (parser simple + `EXPLAIN`), RLS de Supabase ya limita.
- Rate limit: 10 ingestas / hora por usuario (memoria + `quality_events`).

## Frontend

### DesktopShell (todas las fases)

Nueva app **“📥 Ingesta”** (`IngestSim.tsx`) junto a SQL/Notebook/Catalog/BI:

- Tabs: **CSV/Excel** (drag&drop) | **Kaggle** (input slug) | **API** (URL + headers) | **Postgres** (textarea SQL) | **S3** (browser del bucket `ingest-raw`).
- Tras ingestar: muestra `IngestResult` (filas/columnas, preview 5, warnings) y CTA “Abrir en Notebook / SQL”.

### NotebookSim

- Nueva magia `pd.read_csv('/ingest/<datasetId>.csv')` → carga el DF real del usuario (además de `st_mart_ventas`).
- Kernel expone `datasets` (lista de ingeridos) y `df_real`.

### SQLSim

- Selector de origen: `MART` (dbt) vs `REAL` (FDW `fdw.ingest_<id>`). `SELECT` real sobre Postgres si el alumno eligió BD.

### CloudSim

- Tab S3 ya muestra `ingest-raw/<userId>/` con los CSV subidos (reusa `CloudSim`).

### CatalogSim

- Dataset ingerido aparece como `source('ingest', '<datasetId>')` con linaje `raw → notebook`.

## Validación y calidad (R-11)

- `auditDocument` + `piiScrubber` al ingerir.
- `quality_events` (`ingest_ok` con `rows/columns/source` anonimizados) alimenta `learningAnalytics.ts` → `coverageGap` puede sugerir drills de ingesta si hay fallos.

## Plan de pruebas

| Test | Archivo | Qué verifica |
|------|---------|--------------|
| CSV válido | `tests/ingest.test.ts` | 3 filas → `rows=3`, preview, `s3Key` |
| CSV con PII | `tests/ingest.test.ts` | email se scrubbea, `scrubbed=true` |
| API allowlist | `tests/ingest.test.ts` | `http://169.254.169.254` 403 |
| Kaggle no creds | `tests/ingest.test.ts` | 502 con mensaje claro |
| Postgres solo SELECT | `tests/ingest.test.ts` | `DELETE` 400 |
| Notebook con DF real | `tests/notebook-ingest.test.ts` | `pd.read_csv('/ingest/x.csv').shape` |
| Límite 10 MB | `tests/ingest.test.ts` | 413 |

## Rollout (cuando alguien lo pida)

1. **Fase 0 — Diseño (este doc)** → queda en `ENGINE_BACKLOG` como `real_ingest:missing` (no se construye).
2. **Fase 1** (1 semana): `ingestService` CSV + API proxy + `ingest_datasets` + `IngestSim` CSV/API + wiring a `NotebookSim`.
3. **Fase 2** (1 semana): Kaggle wrapper + Postgres SELECT + CloudSim browser.
4. **Fase 3** (1 semana): Excel, límites y `piiScrubber` fino, tests de integración y docs.

## Criterios de salida de PENDIENTE

- `GET /api/automator/capabilities` muestra `real_ingest:exists`.
- `npm run test` verde + `npm run audit:story` verde.
- Demo manual: subir `titanic.csv` (100 filas) → verlo en Notebook/SQL/BI sin PII y con linaje.

---
*Dejar este archivo en el repo es la forma de mantener el pendiente visible y auditable; no se aplica migración ni se toca `engineCapabilities.ts` hasta que el equipo decida priorizarlo.*
