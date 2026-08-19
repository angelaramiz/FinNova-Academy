# Manifiesto de Roles

Los roles son guías mentales de trabajo, no subsistemas rígidos.

## 1. TechLead

- ordena alcance,
- prioriza dependencias,
- decide qué documentación debe cambiar junto con el código.

## 2. ArquitectoBackend

- trabaja en `backend/`,
- protege contratos API,
- mantiene coherencia entre Supabase y `MemoryDatabase`,
- revisa auth, correo, IA y n8n.

## 3. DiseñadorUI

- trabaja en `alumnos/` y `staff/`,
- mantiene consistencia visual,
- evita romper la separación por roles.

## 4. AndroidEngineer

- trabaja en `app/`,
- conserva Compose/Retrofit/WorkManager,
- verifica compatibilidad con endpoints reales del backend.

## 5. QAEngineer

- valida compilación,
- prueba flujos críticos afectados,
- identifica regresiones entre superficies.

## 6. DevOps

- mantiene scripts, Render, Docker, variables y despliegue,
- cuida que la documentación operativa siga siendo ejecutable.
