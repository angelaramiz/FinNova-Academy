# Auditoria - Modulos Practica 2-6 no abren

**Fecha**: 20-ago-2026
**Sintoma**: Solo modulo 1 (CFDI) abre. Modulos 2-6 no responden al clic.
**Usuario**: student_tester@gmail.com / demo1234
**Prod**: https://finnova-academy.onrender.com/student

---

## 1. Que funciona vs que no

**Funciona**: Login, onboarding, 6 modulos se muestran, modulo 1 abre, workflow, guias.
**No funciona**: Clic en modulos 2-6 no abre nada.

---

## 2. Archivos a investigar

| Archivo | Linea | Que revisar |
|---------|-------|-------------|
| PracticasModules.tsx | 170 | onClick={() => setActive(m)} |
| PracticasModules.tsx | 77 | useState active |
| PracticasModules.tsx | 86-90 | useEffect carga modulos |
| PracticasModules.tsx | 190 | Renderizado condicional active |
| DesktopShell.tsx | 479-481 | Props a PracticasModules |
| practicasModules.ts | backend | Datos de modulos |
| simEngine.ts | 1224 | Endpoint modules |

---

## 3. Hipotesis

**A (MAS PROBABLE)**: Error silencioso en React. Modulo 1 tiene datos correctos. Modulos 2-6 tienen campo undefined que causa crash sin error visible.

**B**: State active se setea pero scroll no funciona (detalle fuera de viewport).

**C**: Conflicto con tutorial overlay interceptando clicks.

**D**: Modules array se actualiza despues del render.

---

## 4. Pruebas de auditoria

### Prueba 1: Endpoint modules
curl con auth - verificar 6 modulos con pasos/prueba/curso completos.

### Prueba 2: Consola del navegador
Abrir DevTools Console. Clic en modulo 2. Buscar TypeError, warnings.

### Prueba 3: React DevTools
Inspeccionar state active despues del clic. Verificar modules tiene 6 elementos.

### Prueba 4: Dev local
Levantar backend + frontend. Login demo. Clic en cada modulo. Verificar errores.

### Prueba 5: Datos de cada modulo
Verificar que cada modulo tiene: id, titulo, pasos[], prueba.preguntas[], curso.secciones[].

---

## 5. Checklist de correccion

- [ ] Cada modulo (1-6) abre su detalle
- [ ] Detalle muestra pasos, guias y quiz
- [ ] Volver a modulos funciona
- [ ] Abrir tarea funciona para cada modulo
- [ ] Quiz carga y valida
- [ ] Sin errores en consola
- [ ] Build pasa
- [ ] Tests pasan (267)
- [ ] Deploy exitoso

---

## 6. Datos de referencia

### Módulos del sistema
| ID | Titulo | Pasos | Prueba | Curso |
|----|--------|:-----:|:------:|:-----:|
| mod-cfdi | Facturacion electronica (CFDI 4.0) | 4 | 4 preg | 3 secciones |
| mod-gastos | Gastos internos: comida empresarial | 4 | 4 preg | 3 secciones |
| mod-cobranza | Cobranza y registro de pagos | 3 | 3 preg | 3 secciones |
| mod-proveedores | Proveedores y CFDI de gastos | 3 | 3 preg | 3 secciones |
| mod-nomina | Nomina: sueldos, ISR e IMSS | 3 | 3 preg | 3 secciones |
| mod-cierre | Conciliacion bancaria y cierre | 3 | 3 preg | 3 secciones |

### Estructura de un modulo (backend)
```json
{
  "id": "mod-cfdi",
  "titulo": "Facturacion electronica (CFDI 4.0)",
  "icono": "t",
  "pasos": [...],
  "prueba": { "titulo": "...", "aprobarMin": 80, "preguntas": [...] },
  "curso": { "id": "...", "titulo": "...", "secciones": [...] }
}
```

### Codigo relevante (PracticasModules.tsx)
```tsx
// Linea 170: Handler de clic
<button key={m.id} onClick={() => setActive(m)} ...>

// Linea 190: Renderizado condicional
{tab === 'modulos' && active && (
  <div>...detalle del modulo...</div>
)}
```

---

## 7. Prioridad

**ALTA** - Los modulos 2-6 son esenciales para la ruta de practicas.
Sin ellos, el estudiante solo puede practicar facturacion (CFDI).
