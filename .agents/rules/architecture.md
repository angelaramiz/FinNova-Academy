# Reglas de Arquitectura

1. `alumnos/` y `staff/` son aplicaciones independientes.
2. `backend/` es la API compartida por web y Android.
3. `app/` es un cliente real más; si cambia un endpoint consumido por Android, debe revisarse compatibilidad.
4. La persistencia puede venir de Supabase o de `MemoryDatabase`; cuando ambos caminos existen, ambos importan.
5. `supabase/schema.sql` y `backend/src/lib/memoryDb.ts` deben permanecer conceptualmente alineados.
6. La integración n8n actual es parcial/simulativa en varias áreas; no sobredocumentarla como pipeline productivo cerrado si no se implementó completo.
