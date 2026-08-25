import { useState } from 'react';
import { themeColors, Theme } from '../lib/theme';

interface Term { id: string; term: string; short: string; detail: string; module: string; }

const TERMS: Term[] = [
  { id: 'cfdi', term: 'CFDI', short: 'Comprobante Fiscal Digital por Internet', detail: 'La factura electrónica que emites/recibes ante el SAT. Sin timbre no tiene validez fiscal. Versión actual: 4.0.', module: 'cfdi' },
  { id: 'uuid', term: 'UUID / Folio Fiscal', short: 'Identificador único del CFDI', detail: 'Cadena de 36 caracteres que el SAT asigna al timbrar un CFDI. Es la huella digital de tu factura.', module: 'cfdi' },
  { id: 'sello', term: 'Sello Digital', short: 'Firma electrónica del emisor', detail: 'Cadena cifrada con tu e.firma (CIEC) que demuestra que TÚ emitiste el CFDI. Si el sello no coincide, el SAT rechaza la factura.', module: 'cfdi' },
  { id: 'uso_cfdi', term: 'Uso de CFDI', short: 'Destino fiscal del comprobante', detail: 'Indica para qué usará el cliente el CFDI (G03 gastos en general, G01 adquisición de mercancías, D03 gastos de transporte).', module: 'cfdi' },
  { id: 'rfc', term: 'RFC', short: 'Registro Federal de Contribuyentes', detail: 'Identificador fiscal de la empresa/persona ante el SAT. El RFC debe ser EXACTO (homoclave incluida). Un error invalida el CFDI.', module: 'cfdi' },
  { id: 'iva', term: 'IVA', short: 'Impuesto al Valor Agregado', detail: 'Tasa general 16% (frontera 8%). Se cobra al cliente y se paga al SAT. El IVA acreditable se resta de lo que debes.', module: 'facturacion' },
  { id: 'iva_acred', term: 'IVA Acreditable', short: 'IVA que puedes deducir', detail: 'El IVA de una compra con CFDI válido se acredita: reduces lo que pagas de IVA al SAT. Ejemplo: si cobras $116 (100+16) y pagas $11.20 de IVA en compras, solo debes $4.80.', module: 'proveedores' },
  { id: 'spei', term: 'SPEI', short: 'Sistema de Pagos Electrónicos Interbancarios', detail: 'Transferencia bancaria electrónica. Es la forma de pago más común entre empresas. La referencia SPEI identifica el movimiento.', module: 'cobranza' },
  { id: 'pue_ppd', term: 'PUE / PPD', short: 'Método de pago', detail: 'PUE = Pago en Una sola Exhibición (pago completo al emitir). PPD = Pago en Parcialidades (credito). La mayoría de empresas usan PUE.', module: 'cfdi' },
  { id: 'deducible', term: 'Gasto Deducible', short: 'Gasto que reduce tu base gravable', detail: 'Gastos que la Ley del ISR permite restar de tus ingresos para calcular impuestos. Restaurantes: 65% del consumo. La propina NUNCA es deducible.', module: 'gastos' },
  { id: 'no_deducible', term: 'Gasto NO Deducible', short: 'Gasto que no reduce impuestos', detail: 'Gastos que no puedes restar de tus ingresos. La propina, multas, donativos (ciertos), y gastos personales NO son deducibles.', module: 'gastos' },
  { id: 'isr', term: 'ISR', short: 'Impuesto Sobre la Renta', detail: 'Impuesto que paga la empresa sobre su utilidad (30% para personas morales). Para empleados se retiene con tabla progresiva del SAT.', module: 'nomina' },
  { id: 'imss', term: 'IMSS', short: 'Instituto Mexicano del Seguro Social', detail: 'Cuota del trabajador (5%) que cubre riesgos de trabajo, enfermedad, retiro. Se descuenta del sueldo bruto junto con el ISR.', module: 'nomina' },
  { id: 'ptu', term: 'PTU', short: 'Participación de los Trabajadores en las Utilidades', detail: 'Porcentaje de las utilidades de la empresa que se reparte a los empleados (10%). Se paga anualmente, generalmente en abril.', module: 'nomina' },
  { id: 'conciliacion', term: 'Conciliación Bancaria', short: 'Cuadrar banco vs libros', detail: 'Comparar el saldo del banco con tu registro contable. Las diferencias típicas son: cheques sin cobrar, depósitos en tránsito, comisiones.', module: 'conciliacion' },
  { id: 'cheque_sc', term: 'Cheques sin Cobrar', short: 'Cheques emitidos no cobrados', detail: 'Cheques que ya registraste como gasto pero que el beneficiario AÚN NO cobró en el banco. Se restan del saldo bancario.', module: 'conciliacion' },
  { id: 'deposito_transito', term: 'Depósitos en Tránsito', short: 'Depósitos no reflejados en banco', detail: 'Depósitos que YA registraste pero que el banco AÚN NO procesó. Se suman al saldo bancario porque pronto aparecerán.', module: 'conciliacion' },
  { id: 'balanza', term: 'Balanza de Comprobación', short: 'Resumen DEBE vs HABER', detail: 'Documento que muestra todas las cuentas con sus saldos deudores (DEBE) y acreedores (HABER). Si cuadra, tus asientos están bien.', module: 'conciliacion' },
  { id: 'debe', term: 'DEBE (Cargo)', short: 'Lado izquierdo del asiento', detail: 'Se registra en DEBE cuando: la empresa gasta, pierde valor, o recibe un bien/servicio. Ejemplo: compra de materia prima.', module: 'asientos' },
  { id: 'haber', term: 'HABER (Abono)', short: 'Lado derecho del asiento', detail: 'Se registra en HABER cuando: la empresa ingresa, gana valor, o paga. Ejemplo: venta de producto, pago a proveedor.', module: 'asientos' },
  { id: 'poliza', term: 'Póliza de Diario', short: 'Registro contable de una operación', detail: 'Documento que registra una transacción con su DEBE y HABER. Ejemplo: depreciación → DEBE gasto, HABER depreciación acumulada.', module: 'asientos' },
];

interface GlossaryProps {
  theme: Theme;
  currentModule?: string;
}

export default function Glossary({ theme, currentModule }: GlossaryProps) {
  const colors = themeColors[theme];
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-full border-2 text-[10px] font-bold cursor-pointer shadow-lg hover:opacity-85 transition"
        style={{ borderColor: '#8b5cf6', background: '#8b5cf6', color: '#fff' }}>
        📖 Glosario
      </button>
    );
  }

  const relevantTerms = currentModule ? TERMS.filter(t => t.module === currentModule || t.module === 'cfdi') : TERMS;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 max-h-80 rounded-2xl border-2 overflow-hidden shadow-2xl" style={{ borderColor: '#8b5cf650', background: colors.cardBg }}>
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <span className="text-[11px] font-bold font-mono" style={{ color: '#8b5cf6' }}>📖 Glosario contable</span>
        <button onClick={() => setOpen(false)} className="text-[11px] cursor-pointer" style={{ color: colors.textMuted }}>✕</button>
      </div>
      <div className="overflow-auto max-h-64 p-2 space-y-1">
        {relevantTerms.map(t => (
          <div key={t.id}>
            <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] hover:opacity-80 transition"
              style={{ background: expanded === t.id ? '#8b5cf615' : 'transparent' }}>
              <span className="font-bold" style={{ color: colors.text }}>{t.term}</span>
              <span className="ml-1.5" style={{ color: colors.textMuted }}>— {t.short}</span>
            </button>
            {expanded === t.id && (
              <div className="px-3 py-2 text-[10px] leading-relaxed rounded-lg mb-1" style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', color: colors.textMuted }}>
                {t.detail}
                <span className="ml-1 text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>{t.module}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
