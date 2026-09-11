// Caja informativa "¿Cómo se genera este reporte?".
export default function DIOTInfoBox() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <h4 className="font-semibold text-blue-900 mb-1">¿Cómo se genera este reporte?</h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• Se alimenta de facturas de egresos, notas de crédito conciliadas y pólizas</li>
        <li>• Toma la fecha de pago/conciliación, no la fecha de la factura</li>
        <li>• Puedes cuadrarlo contra la Hoja de Trabajo para Impuestos</li>
      </ul>
    </div>
  );
}
