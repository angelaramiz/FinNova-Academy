/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Award, Sparkles, AlertCircle, CheckCircle, RefreshCw, Star, ArrowRight } from 'lucide-react';
import { api, ApiError } from '../lib/api';

interface Exercise {
  id: string;
  clipId: string;
  title: string;
  exerciseType: 'multiple_choice' | 'formula' | 'ratio_calculation' | 'portfolio_weight';
  question: string;
  correctAnswer: string;
  rubrics?: any;
  maxPoints: number;
}

interface Attempt {
  id: string;
  userId: string;
  exerciseId: string;
  userAnswer: string;
  isPassed: boolean;
  scorePoints: number;
  evaluationType: 'deterministic' | 'ai_evaluated' | 'hybrid';
  aiFeedback: string;
  attemptedAt: string;
}

interface ExerciseBlockProps {
  clipId: string;
}

export default function ExerciseBlock({ clipId }: ExerciseBlockProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const [latestAttempt, setLatestAttempt] = useState<Attempt | null>(null);
  const [attemptsHistory, setAttemptsHistory] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load exercises mapped to current clip frame
  useEffect(() => {
    setIsLoading(true);
    setLatestAttempt(null);
    setSubmissionError(null);
    setAnswerInput('');
    setActiveExerciseIndex(0);

    // Dynamic database search via course schema details
    // We get course details through standard mappings
    api.getCourses().then((courses) => {
      // Find course containing current clip
      // Iterates existing database emulator records in-memory
      const promises = courses.map(c => api.getCourseDetails(c.id));
      return Promise.all(promises);
    }).then((detailsList) => {
      let foundExercises: Exercise[] = [];
      for (const detailedCourse of detailsList) {
        const matchingClip = detailedCourse.clips?.find((c: any) => c.id === clipId);
        if (matchingClip && matchingClip.exercises) {
          foundExercises = matchingClip.exercises;
          break;
        }
      }
      setExercises(foundExercises);
      setIsLoading(false);

      if (foundExercises.length > 0) {
        loadAttemptsHistory(foundExercises[0].id);
      }
    }).catch(err => {
      console.error('Failed loading financial exercise nodes:', err);
      setIsLoading(false);
    });
  }, [clipId]);

  const activeExercise = exercises[activeExerciseIndex];

  // Load history log to verify if user has already solved it
  const loadAttemptsHistory = (exerciseId: string) => {
    api.getAttempts(exerciseId).then((history) => {
      setAttemptsHistory(history);
      if (history.length > 0) {
        setLatestAttempt(history[0]);
      }
    }).catch(err => {
      console.error('Failed fetching exercise submission track history:', err);
    });
  };

  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    if (!activeExercise || !answerInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await api.submitExercise(activeExercise.id, answerInput);
      if (response.success && response.data) {
        setLatestAttempt(response.data);
        loadAttemptsHistory(activeExercise.id);
      }
    } catch (err: any) {
      console.error('Submission failure:', err);
      setSubmissionError(err.message || 'Ocurrió un error al enviar tu propuesta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setLatestAttempt(null);
    setAnswerInput('');
    setSubmissionError(null);
  };

  if (isLoading) {
    return (
      <div id="exercise-loading-skeleton" className="flex items-center justify-center p-8 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-slate-500" /> Cargando evaluación híbrida...
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div id="no-exercises-card" className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 text-slate-400 text-sm">
        <AlertCircle className="w-5 h-5 text-amber-500/80 shrink-0" />
        <div>
          <p className="font-semibold text-slate-300">Sin ejercicios directos</p>
          <p className="text-xs text-slate-500">Este micro-contenido es de carácter informativo. No requiere evaluación práctica.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="exercise-component-root" className="w-full flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-slate-200 text-sm font-bold flex items-center gap-1.5">
          <Award className="w-4.5 h-4.5 text-amber-400" /> Práctica Evaluada
        </span>
        <span className="text-xs text-slate-500 font-mono font-semibold">
          Máx: {activeExercise.maxPoints} XP
        </span>
      </div>

      {/* Render Active Exercise Details */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-slate-300">
          {activeExercise.title}
        </h4>
        
        {/* Render Question markdown block replacement */}
        <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 font-normal">
          {activeExercise.question.split('**').map((chunk, i) => (
            i % 2 === 1 ? <strong key={i} className="text-amber-300 font-semibold">{chunk}</strong> : chunk
          ))}
        </p>

        {/* Option Selection or Free input details */}
        {latestAttempt ? (
          /* DISPLAY FEEDBACK RESULT */
          <div 
            id="evaluation-feedback-panel"
            className={`border rounded-2xl p-4 flex flex-col gap-3 ${
              latestAttempt.isPassed 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200' 
                : 'bg-rose-500/5 border-rose-500/20 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold font-mono">
                {latestAttempt.isPassed ? (
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4.5 h-4.5 text-rose-400" />
                )}
                {latestAttempt.isPassed ? 'CALIFICACIÓN EXCELENTE' : 'EJERCICIO EN REVISIÓN'}
              </span>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                latestAttempt.isPassed 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                Puntos: {latestAttempt.scorePoints} / {activeExercise.maxPoints}
              </span>
            </div>

            {/* Render grading comments securely */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Feedback Consolidado (IA de Gemini)
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed italic font-normal">
                "{latestAttempt.aiFeedback}"
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleRetry}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Volver a Intentar
              </button>
              {latestAttempt.isPassed && (
                <span className="text-[10px] text-slate-500 italic">
                  ¡Aprobado con éxito! Puedes repetir para practicar más.
                </span>
              )}
            </div>
          </div>
        ) : (
          /* DISPLAY CHOSEN INPUT MECHANISMS */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {activeExercise.exerciseType === 'multiple_choice' ? (
              <div id="multiple-choice-grid" className="grid grid-cols-1 gap-2">
                {activeExercise.rubrics?.options && 
                  Object.entries(activeExercise.rubrics.options).map(([key, text]) => {
                    const isSelected = answerInput === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setAnswerInput(key)}
                        className={`text-left text-xs p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-400/15 border-amber-400 text-amber-200 font-semibold' 
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[11px] border shrink-0 ${
                          isSelected 
                            ? 'bg-amber-400 text-black border-amber-400' 
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}>
                          {key}
                        </span>
                        <span>{text as string}</span>
                      </button>
                    );
                  })
                }
              </div>
            ) : (
              /* TEXT OR NUMERICAL CALCULATION ENTRY */
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Escribe tu resultado numérico... (Ejemplo: 13310)"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-slate-200 text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <div className="absolute right-3.5 top-3 text-[10px] text-slate-600 font-mono font-bold select-none">
                    DETERMINISTA + IA
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal italic font-normal">
                  Redondea tu resultado y excluye símbolos monetarios o comas para una rápida validación.
                </p>
              </div>
            )}

            {submissionError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl text-[11px] flex items-center gap-1.5 font-normal">
                <AlertCircle className="w-4 h-4 shrink-0" /> {submissionError}
              </div>
            )}

            <button
              type="submit"
              disabled={!answerInput.trim() || isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                answerInput.trim() && !isSubmitting
                  ? 'bg-amber-400 hover:bg-amber-500 text-neutral-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando con IA...
                </>
              ) : (
                <>
                  Enviar Desafío <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
