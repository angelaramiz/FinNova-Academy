import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  why: string;
}

interface Lesson {
  id: string;
  title: string;
  topic: string;
  minutes: number;
  intro: string;
  points: string[];
  quiz: QuizQuestion[];
}

const LESSONS: Lesson[] = [
  {
    id: 'sql', title: 'SQL — Consultas esenciales', topic: 'SQL', minutes: 10,
    intro: 'El SQL es el lenguaje con el que lees y transformas datos en el warehouse.',
    points: [
      'SELECT col1, col2 FROM tabla elige columnas; WHERE filtra filas.',
      'SUM() / COUNT() son agregaciones: toda columna que no se agrega debe ir en GROUP BY.',
      'ORDER BY ordena el resultado; LIMIT limita; JOIN combina tablas por una llave.',
    ],
    quiz: [
      { q: '¿Qué devuelve una consulta con SUM(total) pero SIN GROUP BY?', options: ['El total por cada fila', 'La suma de TODAS las filas en un solo renglón', 'Un error de sintaxis', 'Agrupa por la primera columna'], correct: 1, why: 'SUM() sin GROUP BY colapsa todas las filas en una sola; por eso se pierde el detalle por cliente.' },
      { q: 'En "SELECT cliente_id, SUM(total) FROM ventas", ¿dónde debe ir cliente_id?', options: ['En el WHERE', 'En el GROUP BY', 'En el ORDER BY', 'En el LIMIT'], correct: 1, why: 'cliente_id no se agrega, así que debe declararse en GROUP BY.' },
    ],
  },
  {
    id: 'pandas', title: 'Python / pandas — Limpieza de datos', topic: 'Python', minutes: 12,
    intro: 'pandas es la librería de Python para manipular datos en tablas (DataFrames).',
    points: [
      'df.dropna() ELIMINA filas con nulos; df.fillna(valor) las RELLENA sin perder registros.',
      'df.drop_duplicates() elimina filas repetidas.',
      'Regla práctica: si la columna es crítica, imputa; solo elimina si el nulo no aporta información.',
    ],
    quiz: [
      { q: 'Tu pipeline tiene 200 filas con nulos en "total". ¿Cuál acción CONSERVA la información?', options: ['df.dropna()', 'df.fillna(df.median())', 'df.drop_duplicates()', 'df.head(200)'], correct: 1, why: 'fillna imputa los valores faltantes; dropna elimina las 200 filas.' },
      { q: '¿Qué comando elimina filas duplicadas?', options: ['df.dropna()', 'df.duplicated()', 'df.drop_duplicates()', 'df.fillna()'], correct: 2, why: 'drop_duplicates() quita las filas repetidas del DataFrame.' },
    ],
  },
  {
    id: 'dbt', title: 'dbt — Modelos y calidad', topic: 'dbt', minutes: 12,
    intro: 'dbt transforma datos dentro del warehouse con SQL versionable y testeable.',
    points: [
      'Cada modelo es un SELECT; {{ ref("otro_modelo") }} enlaza dependencias.',
      '{{ source("raw", "tabla") }} apunta a datos crudos de ingesta.',
      'Los tests (not_null, unique, positive) validan calidad y detienen el pipeline si fallan.',
    ],
    quiz: [
      { q: '¿Cómo referencias un modelo dbt dentro de otro?', options: ['WITH modelo AS', '{{ ref("modelo") }}', 'USE modelo', 'IMPORT modelo'], correct: 1, why: 'ref() construye el DAG de dependencias de dbt.' },
      { q: 'Si el test positive(total_ventas) falla, ¿qué significa?', options: ['La tabla tiene montos negativos o nulos', 'Falta la columna total_ventas', 'El modelo no existe', 'La ingesta se detuvo'], correct: 0, why: 'positive valida que los valores sean > 0; al fallar hay montos inválidos.' },
    ],
  },
  {
    id: 'airflow', title: 'Airflow — Orquestación de pipelines', topic: 'Airflow', minutes: 10,
    intro: 'Airflow programa y ordena las tareas de tu pipeline como un DAG.',
    points: [
      'Un DAG agrupa tareas con dependencias: [t1, t2] >> t3 significa t3 corre tras t1 y t2.',
      'schedule define la frecuencia (0 8 * * * = diario 08:00).',
      'Si una tarea falla, las dependientes no corren: monitorea runs y logs.',
    ],
    quiz: [
      { q: 'En Airflow, ¿qué representa un "DAG"?', options: ['Un error de programación', 'Un grafo acíclico dirigido de tareas', 'Un dataset en S3', 'Un tipo de test'], correct: 1, why: 'DAG = Directed Acyclic Graph: el orden de ejecución de las tareas.' },
      { q: 'Si dbt_test falla, ¿qué pasa con export_redshift que depende de ella?', options: ['Corre igualmente', 'Queda en pending/no corre', 'Se reinicia el DAG', 'Nada'], correct: 1, why: 'Las tareas dependientes de una fallida no se ejecutan.' },
    ],
  },
  {
    id: 'aws', title: 'AWS — S3, Redshift y IAM', topic: 'Cloud', minutes: 10,
    intro: 'En AWS: S3 guarda archivos, Redshift es el warehouse, IAM controla permisos.',
    points: [
      'S3: buckets con objetos (raw/staging/logs) — barato y escalable.',
      'Redshift: base analítica columnar donde cargan los marts.',
      'IAM: usuarios y políticas. Principio de menor privilegio: solo lo necesario.',
    ],
    quiz: [
      { q: '¿Dónde guardas los archivos CSV crudos del pipeline?', options: ['Redshift', 'S3', 'IAM', 'EC2'], correct: 1, why: 'S3 es el almacenamiento de objetos para datos crudos.' },
      { q: '¿Qué controla qué usuario puede leer un bucket?', options: ['S3', 'Redshift', 'IAM', 'CloudWatch'], correct: 2, why: 'IAM define permisos (políticas) sobre los recursos de AWS.' },
    ],
  },
  {
    id: 'foundry', title: 'Palantir Foundry — Transforms y Ontología', topic: 'Foundry', minutes: 12,
    intro: 'Foundry une ingesta, transformación y modelado semántico en una plataforma.',
    points: [
      'Un transform es código (Python/SQL) que produce un dataset a partir de otros.',
      'La Ontología modela el negocio: objetos (Cliente, Venta) y sus relaciones.',
      'Las métricas del mart ejecutivo salen de la capa gold del pipeline.',
    ],
    quiz: [
      { q: '¿Qué produce un transform de Foundry?', options: ['Un dashboard', 'Un dataset a partir de otros', 'Un bucket S3', 'Un usuario IAM'], correct: 1, why: 'El transform toma datasets de entrada y genera uno nuevo.' },
      { q: '¿Qué modela la Ontología?', options: ['Los permisos IAM', 'Los archivos en S3', 'Objetos de negocio y sus relaciones', 'Las credenciales'], correct: 2, why: 'La ontología representa el negocio: objetos (Cliente, Venta) y relaciones.' },
    ],
  },
];

interface LearningSimProps { theme: Theme; onBack: () => void; }

export default function LearningSim({ theme, onBack }: LearningSimProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('learning_progress') || '{}'); } catch { return {}; }
  });
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  function markDone(id: string) {
    const next = { ...completed, [id]: true };
    setCompleted(next);
    localStorage.setItem('learning_progress', JSON.stringify(next));
  }

  function resetProgress() {
    localStorage.removeItem('learning_progress');
    setCompleted({});
  }

  function openLesson(l: Lesson) { setLesson(l); setAnswers({}); }

  function pick(questionIdx: number, optionIdx: number) {
    setAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  }

  const doneCount = LESSONS.filter(l => completed[l.id]).length;
  const allCorrect = lesson ? lesson.quiz.every((q, i) => answers[i] === q.correct) : false;

  return (
    <div className="h-full flex flex-col" style={{ background: colors.bg }}>
      <div className="px-3 py-2 border-b-2 flex items-center gap-2 shrink-0" style={{ borderColor: colors.border, background: colors.cardBg }}>
        <button onClick={() => (lesson ? setLesson(null) : onBack())} className="text-[12px] px-2 py-1 rounded border cursor-pointer hover:opacity-70" style={{ borderColor: colors.border, color: colors.textMuted, background: colors.bg }}>←</button>
        <span className="text-base">📚</span>
        <span className="text-[12px] font-bold font-mono" style={{ color: colors.text }}>{lesson ? lesson.title : 'Aprendizaje — Foundry Academy'}</span>
        <span className="text-[9px] font-mono ml-auto" style={{ color: colors.textMuted }}>{doneCount}/{LESSONS.length} lecciones</span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!lesson && (
          <>
            <div className="p-3 rounded-xl border-2 mb-3 text-[10px]" style={{ borderColor: colors.border, background: colors.cardBg, color: colors.textMuted }}>
              🎯 Formación diaria del rol (30-60 min): repasa cada tema y aprueba su mini-quiz. El contenido refuerza las herramientas que usas en tus tareas.
            </div>
            <div className="space-y-2">
              {LESSONS.map(l => {
                const done = completed[l.id];
                return (
                  <button key={l.id} onClick={() => openLesson(l)} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left hover:opacity-85 transition cursor-pointer" style={{ borderColor: colors.border, background: colors.cardBg }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: done ? '#22c55e20' : colors.primary + '20', color: done ? '#22c55e' : colors.primary }}>{done ? '✓' : '📖'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold truncate" style={{ color: colors.text }}>{l.title}</p>
                      <p className="text-[9px] font-mono" style={{ color: colors.textMuted }}>{l.topic} · {l.minutes} min · {l.quiz.length} preguntas</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: done ? '#22c55e' : colors.primary, color: '#1B2632' }}>{done ? 'Completada' : 'Estudiar'}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={resetProgress} className="mt-4 text-[9px] font-mono underline cursor-pointer" style={{ color: colors.textMuted }}>Reiniciar progreso de aprendizaje</button>
          </>
        )}

        {lesson && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border-2" style={{ borderColor: colors.border, background: colors.cardBg }}>
              <p className="text-[11px] leading-relaxed" style={{ color: colors.text }}>{lesson.intro}</p>
            </div>
            <ul className="space-y-1.5">
              {lesson.points.map((p, i) => (
                <li key={i} className="flex gap-2 text-[11px]" style={{ color: colors.text }}>
                  <span style={{ color: colors.primary }}>▸</span><span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: colors.border }}>
              <div className="px-3 py-2 border-b-2 text-[11px] font-bold font-mono" style={{ borderColor: colors.border, background: isDark ? 'rgba(0,0,0,0.3)' : colors.bg, color: colors.text }}>🧪 Mini-quiz</div>
              <div className="p-3 space-y-4">
                {lesson.quiz.map((q, qi) => {
                  const picked = answers[qi];
                  return (
                    <div key={qi}>
                      <p className="text-[11px] font-bold mb-2" style={{ color: colors.text }}>{qi + 1}. {q.q}</p>
                      <div className="space-y-1">
                        {q.options.map((op, oi) => {
                          const isPicked = picked === oi;
                          const isCorrect = oi === q.correct;
                          const show = picked !== undefined;
                          let bg = colors.bg; let border = colors.border; let text = colors.text;
                          if (show && isCorrect) { bg = '#22c55e18'; border = '#22c55e'; text = '#22c55e'; }
                          else if (show && isPicked && !isCorrect) { bg = '#ef444418'; border = '#ef4444'; text = '#ef4444'; }
                          return (
                            <button key={oi} onClick={() => pick(qi, oi)} className="w-full text-left px-3 py-2 rounded-lg border-2 text-[10px] cursor-pointer hover:opacity-85 transition" style={{ background: bg, borderColor: border, color: text }}>
                              {op}{show && isCorrect ? ' ✓' : ''}{show && isPicked && !isCorrect ? ' ✗' : ''}
                            </button>
                          );
                        })}
                      </div>
                      {picked !== undefined && (
                        <p className="text-[9px] mt-1" style={{ color: picked === q.correct ? '#22c55e' : '#ef4444' }}>{q.why}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {allCorrect && !completed[lesson.id] && (
              <button onClick={() => { markDone(lesson.id); }} className="w-full py-3 rounded-xl border-2 text-xs font-bold cursor-pointer hover:opacity-85 transition" style={{ borderColor: '#22c55e', background: '#22c55e', color: '#1B2632' }}>✓ Marcar lección como completada</button>
            )}
            {completed[lesson.id] && (
              <div className="text-center py-2 text-[11px] font-bold" style={{ color: '#22c55e' }}>✅ Lección completada</div>
            )}
            {pickedSome(answers, lesson) && !allCorrect && (
              <p className="text-center text-[10px]" style={{ color: colors.textMuted }}>Revisa las respuestas marcadas en rojo y vuelve a intentarlo.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function pickedSome(answers: Record<number, number>, lesson: Lesson): boolean {
  return Object.keys(answers).length > 0;
}
