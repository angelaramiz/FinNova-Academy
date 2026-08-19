# HISTORIAL DE INTEGRACIONES (history/)
# Historial

`history/` se reserva para notas históricas que ya no representan la operación diaria pero siguen siendo útiles para contexto o auditoría.

Reglas:

1. No mover aquí documentación activa.
2. Si un archivo describe el sistema actual, debe vivir fuera de `history/`.
3. Si una decisión quedó superada, puede archivarse aquí con fecha y contexto.
Esta carpeta contiene el historial consolidado de las integraciones completadas y las decisiones arquitectónicas tomadas a lo largo del desarrollo.

## Propósito
1.  **Memoria del Proyecto**: Asegurar que los agentes futuros comprendan por qué se diseñó un módulo de cierta manera (ej. uso de base de datos simulada en memoria, por qué se optó por Supabase JWT).
2.  **Línea de Tiempo**: Registro de las principales iteraciones técnicas entregadas y verificadas de forma estable.
3.  **Auditoría**: Facilitar la depuración y auditoría ante cambios que modifiquen el comportamiento global de los repositorios.
