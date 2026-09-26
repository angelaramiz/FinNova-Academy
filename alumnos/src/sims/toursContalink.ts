// toursContalink — pasos del piloto automático individual de cada Sim
// Contalink (Nómina, Conciliación, Auditoría). DIOT tiene su propio tour en
// public/sims/diot.html. Teoría de videos/webinars + mas.html. Cero LLM.
export interface PasoTour {
  selector: string;
  titulo: string;
  descripcion: string;
  teoria: string;
  referencia: string;
  // Paso interno del Sim al que navegar antes de mostrar (tabs condicionales).
  paso?: string;
  // Tour-acción: lo que el alumno debe HACER en este paso (el Siguiente se
  // bloquea hasta que el Sim lo verifica vía onVerificar).
  tarea?: string;
}

export const TOUR_NOMINA: PasoTour[] = [
  {
    selector: '[data-tour="nomina-hero"]',
    titulo: '🎯 Módulo de Nómina',
    descripcion: 'Gestión y emisión de nómina: configura empleados, calcula percepciones y deducciones, y timbra recibos CFDI Nómina 4.0.',
    teoria: 'El módulo de Nómina cumple con el Art. 99 LISR y el Anexo 20 RMF. Todo recibo timbrado es un CFDI con complemento de nómina.',
    referencia: 'Art. 99 LISR · Anexo 20 RMF 2026',
  },
  {
    selector: '[data-tour="nomina-fases"]',
    titulo: '🗺️ 4 fases del flujo',
    descripcion: 'Configuración → Empleados → Cálculo → Timbrado. Toca cada fase para saltar a sus pasos; sigue el orden del video.',
    teoria: 'Metodología "observa, practica, demuestra": primero configura la empresa, luego da de alta, calcula y timbra.',
    referencia: 'Video de nómina · Flujo ContaLink',
  },
  {
    selector: '[data-tour="nomina-stats"]',
    titulo: '📊 Métricas vivas',
    descripcion: 'Empleados, percepción, deducciones y neto se recalculan solos con el motor cuando cambias el salario diario.',
    teoria: 'Percepción = salario diario × días. Deducciones = ISR por tarifa + IMSS. Neto = percepción − deducciones.',
    referencia: 'Motor nominaEngine · Tarifa R-14',
  },
  {
    selector: '[data-tour="nomina-alta"]',
    titulo: '👥 Alta de empleados',
    descripcion: 'Tres vías: XML, manual o masiva. En manual exige RFC de 13, CURP de 18 y NSS de 11 dígitos.',
    teoria: 'Los empleados PF llevan RFC de 13 caracteres (4 letras + 6 de fecha + 3 homoclave), CURP de 18 y NSS de 11 dígitos.',
    referencia: 'Anexo 20 RMF · Datos fiscales',
    paso: 'alta',
  },
  {
    selector: '[data-tour="nomina-ficha"]',
    titulo: '💰 Ficha y cálculo',
    descripcion: 'El salario diario dispara el cálculo: ISR por tarifa progresiva y seguridad social. Cambia el diario y observa.',
    teoria: 'ISR por tarifa R-14 (tramos 0 / 6.4% / 10.88%): NUNCA porcentaje fijo. Salario mínimo no retiene ISR.',
    referencia: 'Art. 96 LISR · Tarifa R-14',
    paso: 'ficha',
  },
  {
    selector: '[data-tour="nomina-timbrado"]',
    titulo: '✅ Timbrado y pago',
    descripcion: 'Palomea todos o uno por uno. En efectivo va contra caja con fecha del XML. Al timbrar se registra tu avance.',
    teoria: 'Modalidad CFDIs = pago automático. La lista de raya sale en PDF/Excel. El timbrado genera el CFDI Nómina 4.0.',
    referencia: 'CFDI Nómina 4.0 · Complemento',
    paso: 'timbrado',
  },
];

export const TOUR_CONCILIACION: PasoTour[] = [
  {
    selector: '[data-tour="conciliacion-hero"]',
    titulo: '🎯 Conciliación Bancaria',
    descripcion: 'Casa cada movimiento del banco con su factura o póliza: configuración, carga, conciliación y cierre del periodo.',
    teoria: 'Conciliar = cobrar/pagar. Se respetan las entradas y salidas del banco: se concilia el movimiento, no la factura completa.',
    referencia: 'Webinar Pedro Castillo · Conciliación',
  },
  {
    selector: '[data-tour="conciliacion-stats"]',
    titulo: '📊 Carátula viva',
    descripcion: 'Inicial + depósitos − retiros debe dar el final al 100%. Si no cuadra, las tarjetas marcan rojo y no puedes cargar.',
    teoria: 'La carátula del estado de cuenta manda: todo lo que subas debe coincidir con ella al centavo antes de conciliar.',
    referencia: 'Carátula bancaria · Saldo inicial/final',
  },
  {
    selector: '[data-tour="conciliacion-carga"]',
    titulo: '📥 Carga correcta',
    descripcion: 'Sube el estado en el banco correcto y con el periodo del corte. Azul = depósitos, rojo = retiros.',
    teoria: 'Si subes el archivo en otro banco y concilias, hay que borrar y repetir. El periodo sigue al corte del banco.',
    referencia: 'Carga de estado de cuenta',
    paso: 'carga',
  },
  {
    selector: '[data-tour="conciliacion-manual"]',
    titulo: '🔍 Conciliación manual',
    descripcion: 'Elige un movimiento y el sistema sugiere por monto + folio. Filtra por periodo, RFC, folio fiscal, UUID y método de pago.',
    teoria: 'Limpia filtros, busca por cliente y agrega folios uno por uno. El folio/RFC en el Excel ayuda a atar el 100%.',
    referencia: 'Sugerencia monto + folio',
    paso: 'manual',
  },
  {
    selector: '[data-tour="conciliacion-casos"]',
    titulo: '🧩 8 casos reales',
    descripcion: 'Parciales, 1-vs-2, dólares, traspasos, rebotes y reembolsos. Resuelve cada uno con su regla (el puente 899 manda).',
    teoria: 'Traspasos SIEMPRE por cuenta puente 899/104: directo a otro banco duplica la póliza. Queda en ceros el mismo día.',
    referencia: 'Cuenta puente 899/104',
    paso: 'casos',
  },
  {
    selector: '[data-tour="conciliacion-cierre"]',
    titulo: '🔒 Cierre del periodo',
    descripcion: 'Fecha de póliza = fecha del movimiento y contrapartida distinta al banco. Al cerrar se bloquea la edición y genera folios.',
    teoria: 'El cierre bloquea el periodo para que nadie mueva lo conciliado. Casilla de revaluación para cuentas en USD.',
    referencia: 'Cierre y bloqueo del periodo',
    paso: 'cierre',
  },
];

export const TOUR_AUDITORIA: PasoTour[] = [
  {
    selector: '[data-tour="auditoria-hero"]',
    titulo: '🎯 Auditoría Contable',
    descripcion: 'Audita lo cobrado y pagado antes de llenar el SAT: revisa, arma la hoja, cuadra contra el portal y cierra con póliza.',
    teoria: 'Audita lo cobrado y pagado, no solo el CFDI. Tres vías: Detalle de Cobros, grid PUE/PPD y Tesorería → Conciliación.',
    referencia: 'Video de auditoría · Cobrado/pagado',
  },
  {
    selector: '[data-tour="auditoria-stats"]',
    titulo: '📊 Goldens del periodo',
    descripcion: 'Base DIOT 16%, IVA a cargo, ISR contra retenciones y neto por pagar. Son los números que todo debe cuadrar.',
    teoria: 'Si un número no coincide con el golden, el error está en la hoja o en el portal, no en la meta.',
    referencia: 'Goldens del video · Base 4606',
  },
  {
    selector: '[data-tour="auditoria-hoja"]',
    titulo: '📝 Hoja de trabajo',
    descripcion: 'Ingresos 10000, IVA trasladado 1600, egresos 2787.88, parcial 2507 al 60%, coeficiente 0.32 y prorrateo 50%. Exactos.',
    teoria: 'La hoja traduce la operación a criterios fiscales: parcialidades al factor que corresponda y coeficiente mensual.',
    referencia: 'Hoja de trabajo · Coeficiente 0.32',
    paso: 'hoja',
  },
  {
    selector: '[data-tour="auditoria-cuadre"]',
    titulo: '⚖️ El cuadre manda',
    descripcion: 'DIOT = hoja = reporte (4606). Trasladado cuadra y 464 = 464 → 0. Sin cuadre no hay cierre.',
    teoria: 'El cuadre es la prueba de que DIOT, hoja y reporte dicen lo mismo. Una diferencia de centavos bloquea el envío.',
    referencia: 'DIOT = hoja = reporte',
    paso: 'cuadre',
  },
  {
    selector: '[data-tour="auditoria-portal"]',
    titulo: '🏛️ Portal SAT',
    descripcion: 'PUE/PPD de ingresos y compras, no deducibles, ISR 464 contra retención 1000 (saldo a favor). IVA con ±1 de tolerancia.',
    teoria: 'PUE = pago en una exhibición, PPD = parcialidades. Sin complemento de pago, el PPD no acredita.',
    referencia: 'Portal SAT · PUE/PPD',
    paso: 'portal',
  },
  {
    selector: '[data-tour="auditoria-certificado"]',
    titulo: '🏆 Cierre y certificado',
    descripcion: 'Casos A/B/C resueltos y póliza cuadrada (débitos = créditos). Registra tu auditoría para que cuente en tu progreso.',
    teoria: 'La póliza de cierre cancela las cuentas vivas de IVA. Registrar el cierre alimenta tu expediente verificable.',
    referencia: 'Póliza de cierre · Cuentas 113',
    paso: 'certificado',
  },
];

export const TOUR_POLIZA: PasoTour[] = [
  {
    selector: '[data-tour="poliza-hero"]',
    titulo: 'Póliza de la factura',
    descripcion: 'Del CFDI al asiento: concilia contra el banco, clasifica al agrupador SAT y cuadra DEBE = HABER antes de guardar.',
    teoria: 'La póliza es el documento del Anexo 24 sección C: fecha, concepto, UUID, RFC del tercero, monto total, moneda y líneas con debe/haber.',
    referencia: 'Anexo 24 RMF 2026 · Pólizas del periodo',
    tarea: 'Mira los totales en $0.00: tu póliza empieza vacía. Sigue al paso 2.',
  },
  {
    selector: '[data-tour="poliza-doc"]',
    titulo: 'Documento fuente',
    descripcion: 'El CFDI manda: UUID, subtotal, IVA y retenciones. El caso MARCELO F trae 70900 + ISR 7090 = total 63810.',
    teoria: 'PUE pagado = egreso; PPD = solo provisión. Antes de contabilizar se valida que el CFDI cuadre solo.',
    referencia: 'CFDI MARCELO F · UUID 1317D7E0',
    paso: 'documento',
    tarea: 'Compara papel vs alcancía y ve al paso 2: ahí capturas tus líneas a mano, una por una.',
  },
  {
    selector: '[data-tour="poliza-concilia"]',
    titulo: 'Cotejo bancario',
    descripcion: 'El total del CFDI debe aparecer igual en el estado de cuenta. Sin pago confirmado no se toca 102.01.',
    teoria: 'Cotejo registro-contra-estado-de-cuenta: si el monto no salió del banco, la operación queda en provisión (201.01).',
    referencia: 'EDO DE CUENTA RITO FINANCIERA',
    paso: 'documento',
    tarea: 'Lee el veredicto: verde ✅ u azul (PPD) y puedes seguir; rojo 🛑 y no toques el banco.',
  },
  {
    selector: '[data-tour="poliza-editor"]',
    titulo: 'Editor multilínea',
    descripcion: 'Cuenta interna o agrupador por línea, Eliminar y Agregar asiento. Guardar se bloquea hasta que cuadre.',
    teoria: 'Tu cuenta 601-83 viaja al SAT como agrupador 601.45. El IVA PPD va a 119.01 pendiente, no a 118.01.',
    referencia: 'Póliza Contalink · Agregar asiento',
    paso: 'poliza',
    tarea: 'Revisa tus líneas: el columpio DEBE = HABER debe quedar parejo.',
  },
  {
    selector: '[data-tour="poliza-balanza"]',
    titulo: 'Balanza por agrupador',
    descripcion: 'Cada póliza guardada alimenta su agrupador: saldo final = debe − haber en deudoras y al revés en acreedoras.',
    teoria: 'Es la sección B de la balanza electrónica: saldo inicial + movimientos = saldo final por cuenta.',
    referencia: 'Anexo 24 · Balanza de comprobación',
    paso: 'balanza',
    tarea: 'Tu póliza guardada aparece aquí por agrupador, con GRAN TOTAL = 0.',
  },
  {
    selector: '[data-tour="poliza-guardar"]',
    titulo: 'Guardar con folio',
    descripcion: 'Guardar se bloquea hasta que DEBE = HABER. Al guardar sale el folio, se registra tu avance y la balanza se alimenta.',
    teoria: 'Sin cuadre no hay póliza: el gate DEBE = HABER es la partida doble. El folio + UUID amarran la póliza a su CFDI.',
    referencia: 'Partida doble · Folio + UUID',
    paso: 'poliza',
    tarea: 'Presiona Guardar en la pestaña 2 y vuelve: verás tu folio.',
  },
];

export const TOURS: Record<string, { pasos: PasoTour[]; storageKey: string; titulo: string }> = {
  nomina: { pasos: TOUR_NOMINA, storageKey: 'tour-sim-nomina', titulo: 'Piloto de Nómina' },
  conciliacion: { pasos: TOUR_CONCILIACION, storageKey: 'tour-sim-conciliacion', titulo: 'Piloto de Conciliación' },
  auditoria: { pasos: TOUR_AUDITORIA, storageKey: 'tour-sim-auditoria', titulo: 'Piloto de Auditoría' },
  poliza: { pasos: TOUR_POLIZA, storageKey: 'tour-sim-poliza', titulo: 'Piloto de Pólizas' },
};
