# SIMULADOR LABORAL 3D — Centro de Control

## Rol del Usuario: Contador General Junior

### Contexto de la Empresa
- **Empresa**: Logística del Norte S.A. de C.V. (LNO)
- **RFC**: LNO-080515-TYU
- **Giro**: Transporte y logística de carga en el norte de México
- **Ubicación**: Av. Industrial 1250, Parque Industrial Santa Teresa, C.P. 32575, Ciudad Juárez, Chihuahua
- **Tamaño**: ~50 empleados, 4 sucursales
- **Sistema contable**: ERP similar a Odoo (módulo Contabilidad)
- **Moneda**: MXN

### Perfil del Estudiante
- **Rol**: Contador General Junior (recién egresado o con 1-2 años de experiencia)
- **Jefe directo**: Lic. Gómez (Contador General)
- **Horario**: Lunes a viernes, 9:00 - 18:00
- **Nivel**: Básico-Intermedio en contabilidad mexicana (NIF, CFDI, SAT)

### Responsabilidades Diarias del Rol
1. **Facturación (CFDI)**: Emitir facturas electrónicas a clientes por servicios de transporte/logística
2. **Cobranza**: Registrar pagos de clientes y aplicarlos a facturas
3. **CFDI de proveedores**: Registrar facturas recibidas de proveedores (transportistas, papelería, servicios, combustibles)
4. **Conciliación bancaria**: Verificar movimientos bancarios contra registros internos
5. **Nómina**: Calcular nómina mensual (sueldo bruto, ISR, IMSS, PTU, neto)
6. **Corte de caja**: En oficina principal, corte diario de efectivo
7. **Pólizas de diario**: Registrar ajustes contables (depreciación, provisiones)
8. **Notas de crédito**: Emitir notas por devoluciones o correcciones
9. **Pagos a proveedores**: Programar dispersión de pagos
10. **Reportes**: Preparar balance general, estado de resultados, balanza de comprobación

### Flujo de Trabajo Típico (1 día)
```
09:00 - Revisar correo → tareas pendientes del Lic. Gómez
09:30 - Emitir facturas pendientes del día
11:00 - Registrar pagos recibidos de clientes
12:00 - Registrar CFDI de proveedores
14:00 - Conciliación bancaria (si hay extracto)
15:00 - Calcular nómina (fin de mes) o pólizas de ajuste
16:00 - Preparar reportes si se solicita
17:00 - Corte de caja (si aplica)
18:00 - Cerrar turnos, pendientes para mañana
```

### Stack Tecnológico del Proyecto
*   **Backend**: Node.js, Express, TypeScript, tsx, MemoryDatabase (`memoryDb.ts`) + Supabase (PostgreSQL).
*   **Frontend Alumnos**: React 19, Vite, TailwindCSS, **React Three Fiber** (motor 3D web), puerto 3000.
*   **Frontend Staff**: React, Vite, TailwindCSS, puerto **3001**.
*   **Base de Datos**: Supabase (PostgreSQL), migraciones en `supabase/`.
*   **Infra**: Render (3 servicios: backend, alumnos, staff).
*   **Motor de simulación**: 12 workflows contables (invoice, payment, tax, bank_reconciliation, journal, payroll, supplier, payment_scheduling, ap_reconciliation, cfdi_reception, credit_note, cash_cut).

## Comandos Disponibles
*   `/sugerencias`: Analiza código reciente, tareas y genera reportes en `agent_memory/suggestions/`.
*   `/reunion`: Inicia/finaliza una reunión estructurada usando las plantillas de `agent_memory/meetings/`.
*   `/protocol`: Audita el código frente a los lineamientos de desarrollo y seguridad en `agent_memory/protocol/`.

## Cambios Recientes (2026-07-28)

### Nuevas Herramientas de Escritorio
- **Nuevo**: 📈 Hoja de Cálculo (SpreadsheetSim) — motor con fórmulas SUM/SUMA/AVG/PROMEDIO, edición directa en celdas, navegación por flechas
- **Nuevo**: 🧮 Calculadora — expresión completa visible, preview de resultado, operaciones + - × ÷
- **Nuevo**: 📅 Calendario — celdas clickeables con dots de colores por tipo de evento, panel de tareas del día
- **Nuevo**: 📁 Archivo — listado de documentos pendientes con botón "Abrir"
- **Mejora**: 📧 Correo — bandeja de entrada completa con todos los correos por tarea
- **Mejora**: 🏦 Banco — botón "← Escritorio" en header izquierdo
- **Mejora**: 🎨 Fondos sólidos dinámicos en todas las ventanas (oscuro/claro)

### Navegación
- Todos los botones de regreso están en el **header izquierdo** (←)
- Back buttons consistentes en Correo, Calendario, Calculadora, Archivo, Excel, Banco
- Flujo de tareas salta el paso de email cuando se accede desde la lista

### Spreadsheet Engine
- Edición directa: click en celda + teclear = contenido visible inmediatamente
- Fórmulas: =SUM(A1:A5), =SUMA(A1,B1,C2), =AVG(B1:B5), =PROMEDIO(A1,B1)
- Operaciones aritméticas: +, -, *, /
- Navegación por teclado: Enter, Escape, Tab, Flechas
- Español/Inglés: SUMA/SUM, PROMEDIO/AVG

## Reglas Básicas de Operación
1.  **No asumir**: Siempre verificar el estado local antes de proceder.
2.  **Planificación de Roles**: Generar `roles/plan-de-rol.md` antes de cualquier modificación compleja.
3.  **Memoria**: Sincronizar decisiones críticas en el historial.
4.  **Ahorro de Tokens**: Limitar la lectura de archivos innecesarios; usar resúmenes estructurados.
5.  **Separación de Lógica (Staff vs Alumnos)**: Toda la lógica de autenticación, formularios de registro, paneles y ruteo debe estar estrictamente separada. El portal de alumnos solo debe procesar y permitir acceso a usuarios con el rol `student`. El portal de staff solo debe procesar y permitir acceso a usuarios con los roles `instructor` y `admin`.

## Protocolo de Desarrollo

### Protocolos Obligatorios
- **Análisis Completo**: Identificar todas las referencias afectadas (estructuras de datos, UI, APIs, scanners, reportes).
- **Descomposición Jerárquica**: Dividir cada requerimiento en tareas atómicas siguiendo el flujo: Análisis ➔ Investigación ➔ Implementación ➔ Validación.
- **Investigación Automática**: Buscar archivos, componentes y funciones que referencien los elementos modificados.
- **Trazabilidad**: Indicar qué archivos/componentes afecta cada tarea en `tasks.md`.

### Reglas de Ejecución
1. **Antes de codificar**: Generar la lista completa de archivos/componentes afectados en `tasks.md`.
2. **Priorización**: Ordenar tareas por dependencias (primero estructura de datos, luego UI, luego integraciones).
3. **Migración**: Si cambias la estructura de datos, incluir script de migración en la base de datos (`schema.sql`).
4. **Testing**: Verificar la integridad compilando localmente y realizando pruebas correspondientes. `npm run test` debe pasar antes de commitear.
5. **Documentación**: Mantener actualizado este archivo `agents.md` con los cambios arquitectónicos importantes.

## Tests

```bash
npm run test        # ejecuta todos los tests (9)
npm run test:watch  # modo watch durante desarrollo
```

Los tests usan `vitest` y `supertest`. No requieren conexión a Supabase ni base de datos externa.

