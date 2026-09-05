# Plan de Integración — Práctica Contable Realista (R-14)

**Fecha**: 20-ago-2026
**Ruta**: practicas · Especialidad Contabilidad
**Objetivo**: Convertir la ruta en un ciclo contable realista y repetible,
que simule el flujo real de un contador: ticket -> factura -> SAT -> sistema
contable -> banco -> asientos -> cierre -> declaracion.

---

## 1. Principio de diseno

Cada modulo es un CICLO contable completo y autonomo:

    [Documento fuente] -> [Generar factura] -> [SAT] -> [Sistema contable]
       -> [Banco] -> [Asientos] -> [Quiz + Curso] -> [Siguiente modulo]

El estudiante REPITE cada modulo con tickets/datos DIFERENTES para
mecanizar la extraccion de datos en formatos variados.

---

## 2. Vista dual (nucleo de cada tarea)

### Layout
+---------------------+---------------------+
|  PORTAL (izquierda)  |  DOCUMENTO (derecha)|
|  SAT / Odoo / Banco  |  ticket / recibo /  |
|                     |  estado de cuenta   |
+---------------------+---------------------+

### DataHighlight
El documento resalta automaticamente (circulo/glow) los datos clave que el
estudiante DEBE copiar al portal:
  - RFC del emisor
  - Razon social del emisor
  - Subtotal
  - IVA
  - Total
  - Fecha
Al pasar el mouse sobre el dato resaltado, muestra su etiqueta
(por ejemplo: "RFC del emisor - copialo al campo RFC").

---

## 3. Modulos propuestos (ciclo completo)

### Modulo 1 - Facturacion CFDI (REDISENADO)
1. Vista dual: ticket de compra (derecha) + portal SAT (izquierda)
2. Remarcar en ticket: RFC emisor, razon social, subtotal, IVA, total
3. Portal SAT: llenar campos con datos fiscales de la empresa (patron contador)
4. Generar factura simbolica: PDF + XML (descargables)
5. Subir/timbrar en SAT (simulado)
6. Registrar en sistema contable (Odoo) -> asiento automatico
7. Como fue con tarjeta: ver estado de cuenta bancario + movimiento
8. Quiz + mini curso

### Modulo 2 - Gastos internos (CORREGIDO)
1. Ticket de restaurante/comida con datos DIFERENTES
2. Vista dual: extraer deducible (65%) vs no deducible (propina)
3. Registrar gasto en sistema contable
4. Asiento (5-03, 2-03, 1-02)
5. Quiz + curso (regla 65%, LISR art.28)

### Modulo 3 - Cobranza
1. Recibo de pago / SPEI de cliente
2. Vista dual: aplicar pago a factura correcta
3. Saldo pendiente
4. Asiento (1-02 Bancos / 1-03 Clientes)
5. Quiz + curso

### Modulo 4 - Proveedores (CFDI de gasto)
1. CFDI de proveedor real (Transportes Express, etc.)
2. Vista dual: validar RFC, IVA acreditable
3. Registrar pasivo con IVA acreditable
4. Asiento (5-01, 2-03, 2-01)
5. Quiz + curso

### Modulo 5 - Nomina
1. Recibo de nomina / planilla
2. Calcular ISR (tabla), IMSS, neto
3. Asiento (5-04, 2-04, 2-08, 1-02)
4. Quiz + curso (tabla progresiva vs 15% fijo)

### Modulo 6 - Conciliacion y cierre de mes
1. Estado de cuenta bancario completo
2. Conciliar (depositos en transito, cheques sin cobrar)
3. Balanza de comprobacion
4. CERRAR MES -> Declaracion de impuestos (simulada)
5. Ver RESULTADO del mes (utilidad/perdida)
6. Quiz + curso

---

## 4. Componentes tecnicos a crear

### Backend
| Componente | Archivo | Funcion |
|-----------|---------|---------|
| Motor documentos conectado a datos reales | documentGenerator.ts (refactor) | Leer de persistentData |
| Generador deterministico (seed) | mulberry32 | Reproducible |
| Generador factura PDF+XML | generateInvoicePdfXml | PDF + XML simbolico |
| Generador CFDI proveedor | generateSupplierInvoice | Proveedor real |
| Generador ticket compra | generatePurchaseTicket | Ticket con datos variados |
| Generador estado cuenta | generateBankStatement (fix) | Movimientos coherentes |
| Auditor de documento | auditDocument.ts | 9 checks coherencia |
| Generador declaracion impuestos | generateTaxDeclaration | Cierre de mes |

### Frontend
| Componente | Funcion |
|-----------|---------|
| DualViewLayout | Layout 2 columnas (portal + documento) |
| DataHighlight | Remarca datos clave del documento |
| SatPortal | Portal SAT simulado (facturacion + timbre) |
| AccountingPortal | Odoo/Contalink/Compac (seleccionable) |
| BankPortal | Estado de cuenta + movimientos |
| TaxPortal | Declaracion de impuestos |
| TermGlossary | Glosario de conceptos por modulo |
| QuickTips | Atajos y consejos por modulo |
| PdfXmlViewer | Visualizar/descargar PDF + XML generados |

---

## 5. Glosario y ayuda por modulo (conceptos de la carrera)

Cada modulo tiene:
- **TermGlossary**: definiciones de terminos exclusivos
  (CFDI, UUID, sello digital, IVA acreditable, PUE/PPD, SPEI, ISR, IMSS,
   PTU, balanza, asiento, debe/haber, depositos en transito, cheques sin cobrar)
- **QuickTips**: atajos y consejos ("el RFC del emisor SIEMPRE va primero",
  "el IVA se calcula sobre el subtotal, no sobre el total")
- **Guia procedural**: burbujas paso a paso

---

## 6. Mecanizacion (repetir con datos diferentes)

Cada modulo genera tickets con datos DISTINTOS cada vez:
- Cliente diferente (Comercial del Norte, Transportes Rapidos, etc.)
- Producto/servicio diferente
- Montos diferentes
- RFC/folio diferente

El tracker semanal muestra las repeticiones, igual que ahora, pero cada
repeticion es un ticket con datos nuevos para mecanizar la extraccion.

---

## 7. Quiz + Mini curso (fin de cada modulo)

- **Mini curso**: narrado por el NPC capacitador, asienta la teoria
  (ya existe en PracticasCurso)
- **Quiz**: examen de comprension (ya existe en PracticasModules)
- Al aprobar el quiz, se habilita el siguiente modulo

---

## 8. Datos reales coherentes

Todos los documentos usan datos de persistentData:
- 5 clientes con RFC real
- 4 proveedores con RFC real
- 8 productos con precio real
- Empresa: Operadora Logistica del Norte + RFC OLN-220701-ABC

Y el reloj sim (julio 2026), no fecha real.

---

## 9. Pruebas (tests)

- auditDocument.test.ts: 9 checks por documento (cliente existe, RFC valido,
  subtotal cuadra, IVA 16%, total, empresa, fecha sim, sin mojibake)
- documentRealism.test.ts: cada documento referencia datos de persistentData
- determinism.test.ts: misma seed -> mismo documento

---

## 10. Prioridad de implementacion

1. Refactor documentGenerator a persistentData + fix typos + fecha sim
2. Generador determinista (seed mulberry32)
3. Generadores nuevos (factura PDF/XML, CFDI proveedor, ticket, declaracion)
4. Vista dual + DataHighlight
5. Portales (SAT, Odoo, Banco, Tax)
6. Glosario + atajos
7. Conexion a modulos 1-6 (rediseno)
8. Cierre de mes + declaracion
9. Tests + audit
10. Deploy
