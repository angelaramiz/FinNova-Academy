-- Seed file for Financial Micro-learning Platform
-- Genera datos piloto para pruebas de MVP local y demo

-- 1. Inserta perfiles de prueba
-- Nota: En producción, estos IDs vendrían de auth.users
-- Generamos UUIDs fijos para mantener integridad referencial
-- UUID de instructor: 'aaa00000-0000-0000-0000-000000000001'
-- UUID de estudiante 1: 'bbb00000-0000-0000-0000-000000000002'
-- UUID de administrador: 'ccc00000-0000-0000-0000-000000000003'

-- Nota: Si estas relaciones en Supabase local arrojan conflictos de llave foránea por falta de filas en auth.users,
-- el seeder se prepara con inserciones manuales si es necesario o bypass. Aquí creamos perfiles directamente.

-- -------------------------------------------------------------
-- USUARIOS DE AUTENTICACIÓN (Bypass auth.users en local y nube)
-- -------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role)
values
    ('11111111-1111-1111-1111-111111111111', 'profesor.senior@finanzas.edu', '{"provider": "email", "providers": ["email"]}', '{"full_name": "Profe Finanzas Senior"}', 'authenticated', 'authenticated'),
    ('22222222-2222-2222-2222-222222222222', 'student_tester@gmail.com', '{"provider": "email", "providers": ["email"]}', '{"full_name": "Inversor Novato"}', 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- PERFILES DE PRUEBA
-- -------------------------------------------------------------
-- Para evitar errores de integridad con auth.users en local Postgres puro,
-- insertamos primero perfiles de bypass útiles para desarrollo.
insert into public.profiles (id, fullName, avatarUrl, role, pointsEarned)
values
    ('11111111-1111-1111-1111-111111111111', 'Profe Finanzas Senior', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', 'instructor', 500)
on conflict (id) do nothing;

insert into public.profiles (id, fullName, avatarUrl, role, pointsEarned)
values
    ('22222222-2222-2222-2222-222222222222', 'Inversor Novato', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', 'student', 80)
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- CURSOS / RUTA DE APRENDIZAJE
-- -------------------------------------------------------------
-- Curso 1: Fundamentos de Inversión (Principiante)
insert into public.courses (id, title, description, difficulty, slug, imageUrl, instructorId, isPublished)
values (
    'c0000000-0000-0000-0000-000000000001',
    'Mentalidad y Fundamentos de Inversión',
    'Domina los principios matemáticos y psicológicos que separan a los ahorradores de los verdaderos inversores en menos de 60 segundos por concepto.',
    'beginner',
    'fundamentos-inversion',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600',
    '11111111-1111-1111-1111-111111111111',
    true
) on conflict (id) do nothing;

-- Curso 2: Finanzas Corporativas y Análisis (Intermedio)
insert into public.courses (id, title, description, difficulty, slug, imageUrl, instructorId, isPublished)
values (
    'c0000000-0000-0000-0000-000000000002',
    'Análisis de Empresas y Ratios Financieros',
    'Aprende a leer balances y estados de resultados de compañías mundiales como Apple o Nvidia. Detecta trampas contables mediante ratios.',
    'intermediate',
    'analisis-empresas',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600',
    '11111111-1111-1111-1111-111111111111',
    true
) on conflict (id) do nothing;

-- -------------------------------------------------------------
-- CLIPS (Videos estilo TikTok/Reels de < 60s)
-- -------------------------------------------------------------
-- Clips para Curso 1
insert into public.clips (id, courseId, title, description, videoProviderId, videoUrl, duration, sequenceOrder, status)
values
    (
        'f0000001-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'El Superpoder del Interés Compuesto',
        '¿Cómo Einstein llamó al interés compuesto la octava maravilla del mundo? Revelamos la matemática visual del crecimiento exponencial.',
        'cf-stream-id-compound-interest',
        'https://vjs.zencdn.net/v/oceans.mp4',
        52,
        1,
        'approved'
    ),
    (
        'f0000001-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'Diversificación Real vs Falsa',
        'Comprar 10 acciones tecnológicas no es diversificar. Te explicamos los coeficientes de correlación y cómo proteger tu portafolio.',
        'cf-stream-id-diversification',
        'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        45,
        2,
        'approved'
    )
on conflict (id) do nothing;

-- Clips para Curso 2
insert into public.clips (id, courseId, title, description, videoProviderId, videoUrl, duration, sequenceOrder, status)
values
    (
        'f0000002-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000002',
        '¿Qué es el P/E Ratio (Price to Earnings)?',
        'Aprende si una acción está cara o barata en segundos usando el múltiplo precio-beneficio. El caso práctico usando Tesla y Ford.',
        'cf-stream-id-pe-ratio',
        'https://vjs.zencdn.net/v/oceans.mp4',
        58,
        1,
        'approved'
    ),
    (
        'f0000002-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000002',
        'Apalancamiento: Arma de Doble Filo',
        'Cómo la deuda magnifica tus ganancias corporativas pero acelera tu quiebra si el retorno sobre capital (ROC) es menor que el costo de deuda.',
        'cf-stream-id-leverage',
        'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        59,
        2,
        'approved'
    )
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- EXERCISES (Ejercicios prácticos de Micro-learning)
-- -------------------------------------------------------------
-- Ejercicio 1 (Interés Compuesto) - Tipo: Fórmula / Matemática
insert into public.exercises (id, clipId, title, exerciseType, question, prompt, correctAnswer, rubrics, maxPoints)
values (
    'e0000001-0000-0000-0000-000000000001',
    'f0000001-0000-0000-0000-000000000001',
    'Cálculo de Capital Final Exponencial',
    'formula',
    'Tienes un capital inicial de $10,000 USD invirtiendo a una tasa de interés del 10% anual compuesto. ¿Cuál es el capital acumulado al término de 3 años sin reinversión externa? (Expresa el resultado numérico exacto sin comas ni símbolos, redondeando a enteros o decimales según aplique).',
    'Calcula usando la fórmula de interés compuesto: Cf = Ci * (1 + r)^n donde Ci=10000, r=0.10, n=3. Respuesta esperada: 13310.',
    '13310',
    '{"steps": ["Paso 1: Aplicar formula Cf = 10000 * (1.10)^3", "Paso 2: Calcular (1.10)^3 = 1.331", "Paso 3: Multiplicar 10000 * 1.331 = 13310"], "allow_range": false}',
    15
) on conflict (id) do nothing;

-- Ejercicio 2 (Diversificación) - Tipo: Opción Múltiple
insert into public.exercises (id, clipId, title, exerciseType, question, prompt, correctAnswer, rubrics, maxPoints)
values (
    'e0000001-0000-0000-0000-000000000002',
    'f0000001-0000-0000-0000-000000000002',
    'Diversificación de Sectores Reales',
    'multiple_choice',
    '¿Cuál de los siguientes portafolios representa el mayor grado de diversificación estructural para mitigar el riesgo sistémico de mercado?',
    'Evaluar opciones de dispersión sectorial y geográfica.',
    'B',
    '{"options": {"A": "10 acciones de empresas tecnológicas (Apple, Microsoft, Nvidia, Tesla, etc.)", "B": "4 activos distribuidos en: software corporativo, bonos del tesoro a corto plazo, bienes raíces agrícolas, y minería de oro.", "C": "Acciones de 5 bancos diferentes de Estados Unidos.", "D": "Inversión del 100% en Bitcoin y Ethereum"}}',
    10
) on conflict (id) do nothing;

-- Ejercicio 3 (Múltiplo P/E) - Tipo: Cálculo de Ratio
insert into public.exercises (id, clipId, title, exerciseType, question, prompt, correctAnswer, rubrics, maxPoints)
values (
    'e0000002-0000-0000-0000-000000000001',
    'f0000002-0000-0000-0000-000000000001',
    'Cálculo Comparativo de Ratio P/E',
    'ratio_calculation',
    'Una compañía cotiza a un precio de acción de $150 USD y reporta una ganancia neta por acción (EPS o GPA) de $6 USD. ¿Cuál es su ratio P/E (Múltiplo de precio sobre ganancias)?',
    'Ratio P/E = Precio por accion / EPS. Ci=150, EPS=6. Respuesta esperada: 25.',
    '25',
    '{"steps": ["Dividir 150 entre 6", "150 / 6 = 25"], "interpretation": "P/E de 25 significa que el inversor paga $25 por cada $1 de ganancia anual."}',
    10
) on conflict (id) do nothing;

-- -------------------------------------------------------------
-- HISTORIAL DE DE PIPELINES (n8n Webhook reviews logs)
-- -------------------------------------------------------------
insert into public.pipeline_reviews (id, clipId, inputPrompt, draftAudioUrl, voiceModelUsed, videoGenerationPrompt, renderedVideoUrl, pipelineId, status, reviewerNotes)
values (
    'd0000000-0000-0000-0000-000000000001',
    'f0000001-0000-0000-0000-000000000001',
    'Guión para video corto de 50 segundos explicando el crecimiento exponencial del interés compuesto.',
    'https://example.com/audio/draft1.mp3',
    'elevenlabs-charon-finance-v2',
    'A cinematic dark scene showing charts and nodes expanding exponentially, hyperrealistic, neon blue accents, vertical 9:16 layout.',
    'https://vjs.zencdn.net/v/oceans.mp4',
    'n8n-exec-uuid-77777',
    'approved',
    'Revisión automática aprobada mediante webhook de validación. Firma HMAC verificada satisfactoriamente.'
) on conflict (id) do nothing;
