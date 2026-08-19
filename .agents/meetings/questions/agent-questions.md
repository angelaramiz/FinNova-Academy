# PREGUNTAS ESTRATEGICAS DEL AGENTE (agent-questions.md)
# Preguntas para la Próxima Reunión

1. ¿La siguiente prioridad es backend, portales web, Android o pipeline n8n?
2. ¿Qué parte del sistema debe dejar de estar simulada primero?
3. ¿Qué flujo necesita validación productiva urgente: auth, correo, pipeline o Storage?
4. ¿Hay que endurecer Supabase/schema antes de seguir expandiendo UI?
Esta es una plantilla de preguntas estratégicas que el agente genera antes de una reunión técnica para asegurar alineación.

## Preguntas Técnicas y de Arquitectura
1.  **Modelo de Datos**: ¿La base de datos simulada en memoria `memoryDb.ts` requiere nuevas entidades o relaciones para soportar las tareas en puerta?
2.  **Integración**: ¿Cuáles son los requerimientos específicos de integraciones externas (n8n, OAuth)?
3.  **Seguridad**: ¿Qué niveles de roles y políticas de seguridad deben aplicarse a los nuevos endpoints?

## Preguntas de Experiencia de Usuario (UI/UX)
1.  **Estética**: ¿Hay algún diseño de referencia que debamos emular para mantener las *Rich Aesthetics* y micro-animaciones en los paneles?
2.  **Responsividad**: ¿Qué prioridad tiene el diseño móvil frente al desktop para el panel de staff?

## Siguientes Pasos
*   *(Respuestas del desarrollador serán documentadas aquí o en las transcripciones)*
