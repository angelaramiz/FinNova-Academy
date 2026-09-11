// Constantes del módulo DIOT — extraídas del lab (/lab/diot.html).
import type { EmpresaDIOT, PasoTutorial, TasaIVA, TipoOperacion } from './types';

export const EMPRESAS: EmpresaDIOT[] = [
  { nombre: 'DISTRIBUIDORA DE ALIMENTOS DEL NORTE SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'SERVICIOS LEGALES Y FISCALES INTEGRADOS SC', regimen: '612', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PF' },
  { nombre: 'TECNOLOGIA Y SISTEMAS AVANZADOS SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'CONSTRUCCIONES Y DESARROLLOS URBANOS SA', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'TRANSPORTES Y LOGISTICA DEL PACIFICO SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'PRODUCTOS QUIMICOS INDUSTRIALES SA', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'MATERIALES ELECTRICOS Y COMPONENTES SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'AGROINDUSTRIAL DEL VALLE DE MEXICO SA', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'TEXTILES Y CONFECCIONES DEL SUR SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'AUTOMOTRIZ Y REFACCIONES PREMIUM SA', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'FARMACEUTICA NACIONAL SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'PAPELERIA Y EMPAQUES DEL CENTRO SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'METALURGICA Y ACEROS INDUSTRIALES SA', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'ALIMENTOS Y BEBIDAS DEL BAJIO SA DE CV', regimen: '601', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PM' },
  { nombre: 'CONSULTORIA EMPRESARIAL MODERNA SC', regimen: '612', pais: 'MX', nacionalidad: 'Nacional', tipoContraparte: 'PF' },
  { nombre: 'GLOBAL TECH SOLUTIONS INC', regimen: '601', pais: 'US', nacionalidad: 'Extranjero', tipoContraparte: 'PM' },
  { nombre: 'EUROPEAN INDUSTRIAL SUPPLIES GMBH', regimen: '601', pais: 'DE', nacionalidad: 'Extranjero', tipoContraparte: 'PM' },
  { nombre: 'ASIA PACIFIC TRADING CO LTD', regimen: '601', pais: 'CN', nacionalidad: 'Extranjero', tipoContraparte: 'PM' },
];

export const TIPOS_OP: Record<TipoOperacion, string> = {
  1: 'Bienes',
  2: 'Servicios',
  3: 'Arrendamiento',
  4: 'Fideicomisos',
  5: 'Extranjeros',
};

export const TASAS_IVA: Record<TasaIVA, number> = { '16': 0.16, '8': 0.08, '0': 0, 'exento': 0 };

export const NIVELES_OPS = [8, 12, 15];
export const ERRORES_POR_FASE = { piloto: 0, practica: 2, examen: 4 } as const;

export const PILOT_STEPS: PasoTutorial[] = [
  { selector: '#spot-banner', position: 'bottom', titulo: 'Bienvenido al Reporte DIOT', descripcion: 'ContaLink genera este reporte automáticamente a partir de tus facturas de egresos, notas de crédito conciliadas y pólizas contables.', teoria: 'El DIOT es una declaración informativa mensual (Art. 32 CFF).', referencia: 'Art. 32 CFF · Anexo 1-A RMF 2025', accionLabel: 'Observando el banner' },
  { selector: '#spot-stats', position: 'bottom', titulo: 'Panel de Métricas', descripcion: 'Total de operaciones, base gravable e IVA acreditable calculados automáticamente.', teoria: 'DIOT 2025: 54 columnas (vs 23 en 2024).', referencia: 'Modificación SAT 2025 · 54 columnas', accionLabel: 'Resaltando métricas' },
  { selector: '#spot-table', position: 'top', titulo: 'Tabla de Operaciones', descripcion: 'Cada fila es una factura o nota de crédito conciliada. Aquí solo se revisa, no se edita.', teoria: 'El DIOT toma la FECHA DE PAGO, no la de la factura.', referencia: 'Art. 32 CFF · Fecha de pago', accionLabel: 'Recorriendo operaciones' },
  { selector: '#operationsBody', position: 'left', titulo: 'Campos Clave', descripcion: 'Fecha de pago, RFC (13), Nombre, Tipo (1-5), Monto e IVA.', teoria: 'Tipos: 1 Bienes · 2 Servicios · 3 Arrendamiento · 4 Fideicomisos · 5 Extranjeros.', referencia: 'Anexo 1-A RMF · Catálogo de tipos', accionLabel: 'Analizando primera operación' },
  { selector: '#spot-actions', position: 'bottom', titulo: 'Opciones de Descarga', descripcion: 'Excel agrupado, Excel a detalle o TXT oficial SAT (54 columnas pipe).', teoria: 'El TXT es el formato oficial del SAT.', referencia: 'Portal SAT · Formato TXT DIOT 2025', accionLabel: 'Mostrando descargas' },
  { selector: '#btn-presentar', position: 'top', titulo: 'Presentar Declaración', descripcion: 'Normal o Complementaria; con revisión previa o Definitivo; con datos o en ceros.', teoria: 'Normal: primera del periodo. Complementaria: corrige una normal.', referencia: 'Art. 32 CFF · Tipos de declaración', accionLabel: 'Simulando clic en enviar' },
  { selector: '#spot-table', position: 'top', titulo: 'Revisión Final', descripcion: 'ContaLink valida RFCs, montos positivos, IVA por tasa y campos obligatorios.', teoria: 'RFC: 3 letras + 6 fecha + 3 homoclave. Monto positivo, 2 decimales.', referencia: 'Validación SAT · Errores E01-E22', accionLabel: 'Validando operaciones' },
  { selector: '#spot-banner', position: 'bottom', titulo: 'Flujo Completado', descripcion: 'En Práctica harás esto con datos distintos y 2 errores intencionales.', teoria: 'El DIOT se presenta dentro de los primeros 15 días del mes siguiente.', referencia: 'Art. 32 CFF · Plazo: 15 días', accionLabel: 'Resumen final' },
];

export const PRACTICE_STEPS: PasoTutorial[] = [
  { selector: '#spot-banner', position: 'bottom', titulo: 'Tu Turno: Revisa el Reporte', descripcion: '2 errores intencionales: identifícalos y elimínalos con la papelera de cada fila.', teoria: 'El contador elimina pagos personales, canceladas y errores de conciliación.', referencia: 'Flujo ContaLink · Revisión → Eliminación → Envío', accionLabel: 'Instrucciones' },
  { selector: '#spot-table', position: 'top', titulo: 'Busca los Errores', descripcion: 'RFCs inválidos, montos negativos, IVA que no cuadra, tipos incorrectos.', teoria: 'RFC válido: 13 = 3 letras + 6 números + 3 alfanuméricos. Monto siempre positivo.', referencia: 'Validación SAT · Errores E01-E22', accionLabel: 'Analizando tabla' },
  { selector: '#spot-actions', position: 'bottom', titulo: 'Cuando Estés Listo', descripcion: 'Elimina TODAS las incorrectas antes de presentar; el sistema valida.', teoria: 'Con errores sin eliminar, el envío se bloquea indicando cuántos faltan.', referencia: 'Flujo ContaLink · Validación previa', accionLabel: 'Instrucciones finales' },
];

export const EXAM_INTRO: PasoTutorial[] = [
  { selector: '#spot-banner', position: 'bottom', titulo: 'Modo Examen', descripcion: '4 errores sutiles en 5 minutos, sin pistas. Demuestra competencia profesional.', teoria: 'Auditoría autónoma del reporte: errores que causarían rechazo del SAT.', referencia: 'Evaluación de competencia · Nivel profesional', accionLabel: 'Instrucciones del examen' },
];
