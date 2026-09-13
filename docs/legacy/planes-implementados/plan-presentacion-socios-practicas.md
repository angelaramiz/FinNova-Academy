# Plan de Presentación a Socios — Prácticas Profesionales Simuladas

> **Demo en vivo · recorrido con Chrome DevTools**
> **Fecha**: 20-ago-2026 · **Duración sugerida**: 45 min (30 demo + 15 Q&A)
> **Producto**: SIMULADOR LABORAL 3D — Módulo *Prácticas Profesionales* (R-13 / R-13.5)

---

## 1. Resumen ejecutivo del pitch

**En una frase**: Convertimos las prácticas profesionales de contabilidad en una experiencia 100 % simulada, guiada y verificable, donde el estudiante **aprende haciendo** dentro de un ERP realista, sin exponer a la empresa ni al alumno.

**El problema que resuelve**:
- Los alumnos egresan sin *memoria muscular* del procedimiento contable real.
- Las prácticas presenciales expuestas (CFDI, IVA, nómina) tienen costo y riesgo de error con datos reales del SAT.
- No hay forma de **medir** la comprensión ni de generar **evidencia verificable** de lo aprendido.

**La solución**:
- **6 módulos** de práctica guiada (CFDI 4.0, gastos, cobranza, proveedores, nómina, conciliación).
- **Tracker semanal** que mecaniza por repetición (memoria muscular del procedimiento) con explicación de *por qué* se repite.
- **Prueba de conocimiento** por tema (aprobación ≥ 60 %, retroalimentación pedagógica por pregunta).
- **Curso teórico** narrado por un **NPC "capacitador"** (narrativa del mundo vivo).
- **Guías procedurales** (burbujas) dentro de cada tarea contable real.
- **Expediente verificable** (evidencia comprobable de logros).

---

## 2. Recorrido del demo — pantalla por pantalla (Chrome DevTools)

El demo se ejecuta en **modo desarrollo local** (`http://localhost:3000` + backend `:3001`, mocks habilitados, sin login). Cada pantalla se inspecciona con **Chrome DevTools** (F12 → pestañas *Elements* y *Console*).

### 2.1 Flujo de entrada (1 min)
| Paso | Acción | Qué se muestra |
|------|--------|----------------|
| 1 | Abrir `http://localhost:3000` | Escena 3D de oficina (bienvenida) |
| 2 | Seleccionar especialidad **🎓 Prácticas Profesionales** | Tercera especialidad del wizard |
| 3 | Confirmar rol **Practicante de Contabilidad** | Cargo, empresa, horario |
| 4 | Iniciar | Se persiste `sim_specialty='practicas'` en localStorage |

**DevTools**: `Application → Local Storage` muestra `sim_specialty: practicas` y `sim_assigned_job`.

### 2.2 Escritorio del Practicante (2 min)
- Banner púrpura **"🎓 Prácticas Profesionales — Contabilidad"**.
- Header: **Practicante de Contabilidad · Logística del Norte S.A.** · fecha sim *miércoles 08-jul-2026* · hora real.
- Iconos de app (solo las del rol prácticas):
  - **📚 Módulos** — currículum de 6 módulos
  - **📅 Tracker** — programa semanal de mecanización
  - **🎓 Curso** — teoría con NPC capacitador
  - **📋 Tareas** — bandeja de tareas del día

**DevTools**: *Elements* → inspeccionar el banner y el set de iconos (`practicasApps`).

### 2.3 Pantalla Módulos — currículum guiado (5 min)
Se muestran los **6 módulos reales** (fuente `/api/sim/practicas/modules`):

| # | Módulo | Semanas | Pasos | Prueba |
|---|--------|---------|:-----:|:------:|
| 1 | 🧾 Facturación electrónica (CFDI 4.0) | 1-2 | 4 | 4 preg |
| 2 | 💳 Gastos internos: comida empresarial | 2-3 | 4 | 4 preg |
| 3 | 💰 Cobranza y registro de pagos | 3-4 | 3 | 3 preg |
| 4 | 📦 Proveedores y CFDI de gastos | 4-5 | 3 | 3 preg |
| 5 | 👥 Nómina: sueldos, ISR e IMSS | 5-6 | 3 | 3 preg |
| 6 | 🏦 Conciliación bancaria y cierre | 6-8 | 3 | 3 preg |

**Demo**: abrir **módulo 2 — Gastos** (4 pasos):
1. 💡 Guía: qué es deducible / no deducible
2. 📝 Tarea real: **Registrar comida empresarial** (workflow `business_expense`)
3. 📒 Asiento: Cargo `5-03 Gastos de admón.` + `2-03 IVA por pagar` + `5-08 No deducibles` / Abono `1-02 Bancos`
4. 💡 Guía: IVA acreditable y límite 65 % restaurantes

**DevTools**: *Network* → `practicas/modules` responde 200 con JSON (6 módulos, pasos, prueba, curso).

### 2.4 Pantalla Tracker — mecanización semanal (4 min)
Fuente `/api/sim/practicas/tracker` (derivado del **plan real** `generateMonthPlan`):

| Semana | Tema | Repeticiones |
|:------:|------|:------------:|
| 1 | Facturación electrónica (CFDI 4.0) | 2 |
| 2 | Gastos internos y comida empresarial | 3 |
| 3 | Cobranza y proveedores | 4 |
| 4 | Nómina, conciliación y cierre | 4 |

**Demo**: semana 2 muestra **Registrar comida empresarial ×2**, **Emitir factura ×1**, **Registrar CFDI de proveedor ×1**, cada una con su **explicación de por qué se repite** (mecanización = memoria muscular). Botones "▶ Hacer tarea" y "Tomar prueba".

**DevTools**: *Console* → verificar que no hay errores; *Network* → `practicas/tracker` 200.

### 2.5 Pantalla Curso — teoría con NPC capacitador (4 min)
Fuente `/api/sim/practicas/curso/:id`. Visor tipo chat con **avatar 🎓 del capacitador**:
- Introducción narrada, secciones con teoría + puntos clave, cierre.
- Navegación Anterior/Siguiente y barra de progreso.

**Demo**: abrir **Curso básico: gastos internos y deducibilidad** (3 secciones) — incluye la regla del **65 % restaurantes** y la propina **NO deducible**.

**DevTools**: *Elements* → avatar con color `#f59e0b`; *Network* → `practicas/curso/mod-gastos` 200.

### 2.6 Prueba de conocimiento por tema (5 min)
Al final de cada módulo hay un **quiz** (POST `/api/sim/practicas/prueba/:id`):
- Preguntas con opciones, índice correcto y explicación pedagógica.
- Aprobación con **score ≥ 60 %** (configurable por módulo vía `aprobarMin`).
- Botón **↻ Reintentar**; resultado persistido en `localStorage('practicas_prueba_results')`.

**Demo**: contestar el quiz de **Gastos** (4 preguntas):
1. ¿Qué parte de la cuenta NO es deducible? → *La propina*
2. IVA correcto → **16 %** (trampa: no 10 %)
3. Límite de restaurantes → **65 %**
4. IVA acreditable → *El IVA sobre el gasto deducible*

Enviar → **4/4 · 100 % · Aprobada** con retroalimentación verde por pregunta.

**DevTools**: *Network* → `POST practicas/prueba/mod-gastos` devuelve `{scorePct:100, aprobado:true}`.

### 2.7 Tarea contable con guía procedural (5 min)
Botón **▶ Abrir tarea** → abre el workflow `business_expense` real:
- Email del jefe → hoja de cálculo → validación.
- **Burbuja 💡 Guía** flotante explica cada campo (portal SAT, CFDI 4.0, RFC exacto, IVA 16 %, uso CFDI, trampa IVA 10 %).
- Validación por `workflowId` → 100 % si es correcta; la trampa (IVA 10 %) se detecta con feedback explicativo.

**DevTools**: *Elements* → inspeccionar `data-guide` en campos de formulario y filas de la hoja.

### 2.8 Cierre — valor comprobable (5 min)
Resumir el **expediente verificable** (R-08) y el **modo staff**:
- Logros cuantificados (tareas aprobadas, trampas detectadas, incidentes resueltos).
- **Sello de verificación ✓** con link público revocable.
- **Staff**: Centro de Control con progreso de alumnos, tracker de práctica, CV de egreso e **entrevista entrenada** sobre los logros reales.

---

## 3. Guion del presentador (talking points)

### Apertura (2 min)
> "Hoy les voy a mostrar cómo un estudiante de contabilidad, sin salir de casa, hace **prácticas profesionales reales**: emite CFDI, registra gastos, calcula nómina y concilia bancos — en un simulador 3D que corrige, explica y **mide** cada paso."

### Sobre el módulo de gastos (clímax del demo, 8 min)
> "Este es el corazón: el estudiante recibe el email del jefe, abre la tarea de **comida empresarial**, y una burbuja de guía le enseña qué es deducible. Emite el asiento correcto. Luego el **tracker** la repite 3 veces en la semana — porque la habilidad contable es memoria muscular. Y al terminar el tema, una **prueba** verifica que comprendió: no solo 'hizo la tarea', **demostró que la entiende**."

### La trampa pedagógica (2 min)
> "A propósito, el sistema introduce errores reales de oficio — como calcular IVA al 10 % en vez de 16 %. Si el estudiante no lo detecta, la validación lo explica. Así se entrena el **ojo crítico**, no solo el tecleo."

### Valor para el socio (3 min)
> "Esto no es un juego: es un **programa de prácticas acreditable**. Cada logro genera **evidencia verificable** que el alumno puede presentar. La escuela/empresa ve el progreso en el Centro de Control. Y el alumno sale con un **CV y un expediente** de lo que realmente sabe hacer."

---

## 4. Mensajes clave para socios

| Mensaje | Soporte |
|---------|---------|
| **Escala sin costo marginal**: simulación 100 % virtual, ilimitada, sin riesgo SAT | 6 módulos + N repeticiones + mundo vivo |
| **Aprendizaje verificable**: no basta "hacer", hay que demostrar comprensión | Prueba por tema + expediente verificable |
| **Memoria muscular real**: la repetición intencional entrena el procedimiento | Tracker semanal con explicación de mecanización |
| **Guía pedagógica procedural**: el alumno nunca se pierde | Burbujas de guía en cada tarea |
| **Narrativa inmersiva**: NPCs (jefe, capacitador) dan contexto laboral | Mundo vivo + curso con capacitador |
| **Evidencia para el egreso**: CV, entrevista entrenada, expediente | R-08, R-09, R-13.5 |

---

## 5. Datos duros para el cierre

- **6 módulos** de práctica guiada, **6 pruebas** de conocimiento, **6 cursos** con capacitador.
- **Tracker** de **4 semanas** con repeticiones (mecanización) derivadas del **plan real**.
- **Guías procedurales** integradas en **4+ workflows** contables reales (incluido `business_expense`).
- **Trampas pedagógicas** (IVA 10 %, propina no deducible) para entrenar detección de errores.
- Validación real por **motores contables** (`autoEntries`, `paymentMatching`), no comparación de texto.
- **267 tests** · **106 checks** de auditoría de coherencia · builds limpios.

---

## 6. Preparación técnica del demo (checklist Chrome DevTools)

- [ ] Backend dev corriendo (`:3001`, mocks habilitados).
- [ ] Frontend dev corriendo (`:3000`).
- [ ] Abrir DevTools con *Elements*, *Network* y *Console* visibles.
- [ ] Limpiar `localStorage` antes de empezar (para re-hacer el onboarding).
- [ ] Pre-cargar el módulo de **Gastos** (clímax del demo).
- [ ] Tener a mano la respuesta del quiz (4/4) para mostrarla limpia.
- [ ] Verificar que `POST practicas/prueba/mod-gastos` devuelva `aprobado:true`.
- [ ] Validar que **no haya errores en Console** durante el recorrido.

---

## 7. Posibles preguntas y respuestas

**¿Es solo para contabilidad?** No. El mismo marco de *módulos guiados + tracker + prueba + curso* está diseñado para extenderse a datos (DataFlow) y a cualquier oficio procedimental.

**¿Cómo se evita que el alumno "adivine" la prueba?** La prueba exige elegir la respuesta correcta **y** se evalúa la tarea real (asiento que cuadra, validado por motor). Además hay trampas pedagógicas que el sistema detecta y explica.

**¿Qué evidencia obtiene el egresado?** Un **expediente verificable** con sello ✓ y link público, un **CV semántico** (PDF con metadata ATS) y una **entrevista entrenada** basada en sus logros reales.

**¿Qué ve la escuela/empresa?** Un **Centro de Control** (staff) con el progreso por alumno: módulos completados, pruebas aprobadas, repeticiones hechas, trampas detectadas y estado del mundo simulado.

**¿Depende de un ERP real o del SAT?** No. Todo es simulación interna (ERP realista tipo Odoo, CFDI simulado), por lo que **no hay riesgo** de emitir documentos fiscales falsos ni datos expuestos.

---

## 8. Siguientes pasos tras la presentación

1. Compartir el **pitch de 1 página** y el **video del demo** (grabado con DevTools / capture).
2. Ofrecer **piloto con N alumnos** de la carrera de contabilidad (ruta `practicas` ya activa).
3. Agendar **siguiente sesión** para el roadmap: evaluación del staff/mentor, certificado de prácticas, y extensión a rutas de datos.