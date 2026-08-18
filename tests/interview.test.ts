import { describe, it, expect } from 'vitest';
import { evaluarRespuesta, completarEntrevista } from '../backend/src/services/interview';

describe('interview — entrevista entrenada (R-08 Fase 2)', () => {
  const preguntaIncidente = {
    id: 'iq-0',
    logroIndex: 0,
    pregunta: '¿Qué prueba fallaba y por qué?',
    contexto: 'Incidente del 05-jul',
    rubrica: ['dbt_test', 'positive', 'total_ventas', 'correg', 'reproces'],
    puntajeMaximo: 10,
  };

  it('evalúa una respuesta sólida con puntaje alto', () => {
    const r = evaluarRespuesta(preguntaIncidente, 'Falló dbt_test porque positive(total_ventas) no pasó; corregí el modelo y reprocesé el run.');
    expect(r.puntaje).toBeGreaterThanOrEqual(8);
    expect(r.feedback).toContain('sólida');
  });

  it('evalúa una respuesta débil con puntaje bajo y feedback de mejora', () => {
    const r = evaluarRespuesta(preguntaIncidente, 'Pues lo arreglé y ya quedó.');
    expect(r.puntaje).toBeLessThan(5);
    expect(r.feedback).toContain('Falta precisión');
  });

  it('completarEntrevista califica todas las respuestas y marca completada', () => {
    const session = {
      userId: 'u-1',
      specialty: 'data_engineering',
      preguntas: [preguntaIncidente],
      respuestas: [],
      totalPuntaje: 0,
      totalMaximo: 10,
      completada: false,
      createdAt: 'x',
    };
    const result = completarEntrevista(session as any, [
      { questionId: 'iq-0', respuesta: 'dbt_test falló en positive(total_ventas); corregí el modelo y reprocesé', puntaje: 0, feedback: '' },
    ]);
    expect(result.completada).toBe(true);
    expect(result.respuestas).toHaveLength(1);
    expect(result.totalPuntaje).toBeGreaterThan(0);
  });
});
