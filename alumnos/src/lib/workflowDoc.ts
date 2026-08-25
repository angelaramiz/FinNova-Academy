// Genera HTML de documento para la vista dual basado en el tipo de workflow
export function getWorkflowDocumentHtml(taskType: string, stepData: any): string {
  const rows = stepData?.rows;
  const fields = stepData?.fields;
  const ctx = { company: 'Operadora Logística del Norte S.A. de C.V.', rfc: 'OLN-220701-ABC' };

  if (rows) {
    // Spreadsheet style document
    const rowHtml = rows.map((r: any) => {
      const val = r.cell_B !== undefined ? `$${Number(r.cell_B).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '';
      const formula = r.formula ? `<span style="color:#666;font-size:9px">${r.formula}</span>` : '';
      return `<tr><td style="padding:6px 8px;border:1px solid #ddd;font-size:11px">${r.label}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-weight:bold">${val}</td><td style="padding:6px 8px;font-size:9px;color:#888">${formula}</td></tr>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Courier New',monospace;font-size:11px;padding:20px;color:#1a1a1a}h2{font-size:14px;border-bottom:2px solid #000;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#f0f0f0;font-size:10px;padding:6px;border:1px solid #ddd;text-align:left}.footer{margin-top:20px;font-size:9px;text-align:center;color:#888}</style></head><body>
      <h2>${getDocTitle(taskType)}</h2>
      <p style="font-size:10px;color:#666">${ctx.company} · RFC: ${ctx.rfc}</p>
      <table><thead><tr><th>Concepto</th><th style="text-align:right">Valor</th><th></th></tr></thead><tbody>${rowHtml}</tbody></table>
      <div class="footer">Documento educativo · Simulador Laboral</div></body></html>`;
  }

  if (fields) {
    // Form style document
    const fieldHtml = fields.map((f: any) => {
      const val = f.correct !== undefined ? (typeof f.correct === 'number' ? `$${Number(f.correct).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : f.correct) : '___';
      return `<tr><td style="padding:6px 8px;border:1px solid #ddd;font-size:11px">${f.label}</td><td style="padding:6px 8px;border:1px solid #ddd;font-weight:bold">${val}</td></tr>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Courier New',monospace;font-size:11px;padding:20px;color:#1a1a1a}h2{font-size:14px;border-bottom:2px solid #000;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#f0f0f0;font-size:10px;padding:6px;border:1px solid #ddd;text-align:left}.footer{margin-top:20px;font-size:9px;text-align:center;color:#888}</style></head><body>
      <h2>${getDocTitle(taskType)}</h2>
      <p style="font-size:10px;color:#666">${ctx.company} · RFC: ${ctx.rfc}</p>
      <table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>${fieldHtml}</tbody></table>
      <div class="footer">Documento educativo · Simulador Laboral</div></body></html>`;
  }

  return `<div style="padding:20px;text-align:center;color:#888;font-family:monospace">Documento no disponible para este tipo de tarea</div>`;
}

function getDocTitle(taskType: string): string {
  const titles: Record<string, string> = {
    invoice_emission: '📋 FACTURA CFDI',
    payment_registration: '💳 RECIBO DE PAGO',
    business_expense: '🧾 TICKET DE COMPRA',
    supplier_invoice: '📦 CFDI DE PROVEEDOR',
    bank_reconciliation: '🏦 ESTADO DE CUENTA',
    journal_entry: '📒 PÓLIZA DE DIARIO',
    payroll: '👥 NÓMINA QUINCENAL',
    cash_cut: '🏧 CORTE DE CAJA',
    tax_calculation: '📊 BALANZA DE COMPROBACIÓN',
    depreciation: '📉 DEPRECIACIÓN DE ACTIVOS',
  };
  return titles[taskType] || '📄 DOCUMENTO';
}

// Extrae datos clave del workflow para DataHighlight
export function getWorkflowHighlightFields(taskType: string, stepData: any): { label: string; value: string; icon?: string }[] {
  const fields: { label: string; value: string; icon?: string }[] = [];

  if (stepData?.rows) {
    // Spreadsheet: extraer filas como campos
    for (const r of stepData.rows) {
      if (r.cell_B !== undefined) {
        fields.push({ label: r.label, value: `$${Number(r.cell_B).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, icon: '📌' });
      }
    }
  }

  if (stepData?.fields) {
    // Form: extraer campos correctos
    for (const f of stepData.fields) {
      if (f.correct !== undefined) {
        const val = typeof f.correct === 'number' ? `$${Number(f.correct).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : String(f.correct);
        fields.push({ label: f.label, value: val, icon: '📌' });
      }
    }
  }

  return fields;
}
