# Plataforma de Micro-aprendizaje en Finanzas (Base MVP Modular)

Esta es la base de infraestructura y portal del frontend/backend modular para una plataforma de educación financiera en formato corto (< 60s), ejercicios interactivos autoevaluados por IA (Gemini), e ingestas automatizadas de contenido a través de webhooks seguros (n8n).

Diseñado bajo estándares de ingeniería de software premium: TypeScript estricto, abstracción de proveedores externos, validaciones centralizadas con Zod, logger JSON estructurado, y soporte PWA offline.

---

## 📂 ESTRUCTURA COMPLETA DE CARPETAS

```text
├── .env.example                 # Variables de entorno y llaves de desarrollo/producción
├── .gitignore                   # Exclusiones de Git
├── docker-compose.yml           # Orquestación local para desarrollo (Postgres + Redis + App)
├── index.html                   # HTML base de la SPA + registro de PWA (Service Worker)
├── metadata.json                # Metadatos del aplicativo para AI Studio Build
├── package.json                 # Scripts de control y dependencias del ecosistema
├── tsconfig.json                # Configuraciones estrictas de TypeScript
├── vite.config.ts               # Bundler Vite con plugin middleware para servir endpoints full-stack
│
├── public/                      # Directorio de recursos estáticos del cliente
│   ├── manifest.json            # Manifiesto de propiedades PWA instalables
│   └── sw.js                    # Service Worker para caching y soporte offline
│
├── supabase/                    # Infraestructura y persistencia de base de datos
│   ├── schema.sql               # Esquema de tablas, índices, triggers y políticas RLS
│   └── seed.sql                 # Semillero de datos piloto para demostraciones directas
│
└── src/                         # Código fuente del aplicativo
    ├── main.tsx                 # Inicializador del DOM de React (Strict Mode)
    ├── App.tsx                  # Enrutador principal de vistas, portal del estudiante y talleres del profesor
    ├── index.css                # Estructuras de estilo global de Tailwind CSS
    │
    ├── components/              # Componentes de interacción y UI
    │   ├── VideoFeed.tsx        # Feed vertical estilo Reels/TikTok con IntersectionObserver
    │   └── ExerciseBlock.tsx    # Ejercicios interactivos con renders dinámicos y reportes de IA
    │
    ├── lib/                     # Utilidades generales y APIs de red
    │   ├── api.ts               # Cliente HTTP unificado con soporte de reintentos e interceptores
    │   └── memoryDb.ts          # Base de datos en memoria para persistencia interactiva en sandbox
    │
    ├── middleware/              # Interceptores de peticiones del backend
    │   └── auth.ts              # Validador de JWT Supabase y desvíos para sandbox
    │
    ├── providers/               # Capa de abstracción para proveedores de servicios externos
    │   ├── ai.ts                # Clientes inteligentes (Gemini 3.5 Flash) para grading y feedback
    │   ├── tts.ts               # Locuciones de voz (ElevenLabs y Gemini TTS)
    │   └── video.ts             # Procesadores multimedia (Cloudflare Stream)
    │
    └── webhooks/                # Receptores de plataformas externas
        └── n8n.ts               # Receptor de pipelines de n8n firmados con HMAC-SHA256 e idempotencia
```

---

## 🚀 SETUP LOCAL (PASO A PASO)

### 1. Requisitos Previos
- Instalar **Docker** y **Docker Compose**.
- Instalar **Node.js 18+** (para desarrollo local sin Docker).

### 2. Levantamiento con Docker Compose
Para iniciar el ecosistema local en segundos ( Postgres que autoinicializa el esquema y seed SQL, Redis de caché de ID’s, y el servidor del Backend):
```bash
# Servir en segundo plano
docker-compose up -d --build
```
Esto creará el contenedor y ejecutará los scripts de `/supabase/schema.sql` y `/supabase/seed.sql` automáticamente. No necesitas inicializar tablas manualmente.

### 3. Setup de Variables de Entorno
Copia el archivo modelo de variables:
```bash
cp .env.example .env
```
Asegúrate de configurar tu `GEMINI_API_KEY` obtenido en Google AI Studio para disfrutar del motor calificador híbrido inmediato.

---

## 🛠️ FLUJO DE DESARROLLO (DOCKER / REPORTE LOCAL)

Para trabajar directamente sobre los componentes de React sin necesidad de reconstruir imágenes Docker:
1. Instala el árbol de dependencias:
   ```bash
   npm install
   ```
2. Inicia el ecosistema en caliente (en modo fullstack directo):
   ```bash
   npm run dev
   ```
   *Vite levantará sobre el puerto 3000 y proxyará de forma transparente tus llamadas `/api/*` al servidor express en caliente.*

---

## ⚙️ INTEGRACIÓN DE PROVEEDORES REALES (DE MOCK A PRODUCCIÓN)

Este monolito modular fue diseñado y desacoplado expresamente para facilitar las sustituciones de mocks a producción sin afectar la lógica de vistas del frontend:

### 1. Streaming de Vídeo (Cloudflare Stream)
Para empezar a subir clips de vídeo reales y recibir tokens de playback firmados:
1. Cambia tu variable de entorno en `.env`:
   ```env
   VIDEO_PROVIDER="cloudflare"
   CLOUDFLARE_ACCOUNT_ID="tu_id_cuenta"
   CLOUDFLARE_API_TOKEN="tu_token_api"
   ```
2. El proveedor real en `src/providers/video.ts` ejecutará llamadas `fetch` autenticadas al endpoint de Cloudflare para programar la compresión y descargar el reproductor seguro.

### 2. Voces Sintéticas de Alta Fidelidad (ElevenLabs)
Para producir locuciones profesionales que narren los microconceptos capturados por n8n:
1. Ajusta tus variables de entorno en `.env`:
   ```env
   TTS_PROVIDER="elevenlabs"
   ELEVENLABS_API_KEY="tu_llave_elevenlabs"
   ELEVENLABS_VOICE_ID="id_voz_financiera" # Opcional
   ```
2. Alternativamente, puedes configurar `TTS_PROVIDER="gemini_tts"` para que la misma inteligencia nativa de Google asuma la locución utilizando audios comprimidos con el modelo `gemini-3.1-flash-tts-preview` implementado en `src/providers/tts.ts`.

### 3. Conectar el Webhook Automatizado de n8n
Nuestra pasarela en `src/webhooks/n8n.ts` exige validez criptográfica por defecto. Para interconectar n8n de forma segura:
1. En tu flujo de n8n, añade un nodo **HTTPRequest** o un conector de salida.
2. Genera una firma HMAC-SHA256 del cuerpo usando una clave secreta simétrica. Envía esta firma en la cabecera `x-n8n-signature`.
3. Informa la clave simétrica en tu servidor:
   ```env
   N8N_WEBHOOK_SECRET="clave_simetrica_secreta_compartida"
   ```
4. El webhook asume la idempotencia usando caches inteligentes. Si n8n lanza el mismo ID de tarea por error de red, el backend descarta la transacción con respuesta HTTP `200` garantizando consistencia.

---

## 🛡️ NOTAS DE SEGURIDAD, RLS Y COMPLIANCE

1. **Row-Level Security (RLS) Activo**: El archivo `supabase/schema.sql` establece políticas de control estrictas. Los estudiantes **solo** pueden consultar registros marcados como publicados (`isPublished = true`) y leer su propio historial de progreso (`userId = auth.uid()`). Los instructores gozan de privilegios CRUD completos previa verificación del rol almacenado en `profiles`.
2. **Descargo de Responsabilidad de Datos Financieros (Compliance)**:
   > *Los cálculos, comentarios de IA generados por Gemini, y materiales de cursos de la plataforma son únicamente de carácter informativo y edtech. No representan bajo ningún concepto asesoría de inversión regulada o recomendación de trading según estatutos FINRA/CNMV.*
