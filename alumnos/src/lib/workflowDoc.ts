// Genera HTML de documento para la vista dual basado en el tipo de workflow
export function getWorkflowDocumentHtml(taskType: string, stepData: any): string {
  const rows = stepData?.rows;
  const fields = stepData?.fields;

  // Ticket real de restaurante (fuente) para business_expense: muestra los
  // valores que el alumno debe transcribir/calcular. Cabecera coherente con
  // el email de generateBusinessExpenseWorkflow (LPN = La Parrilla del Norte).
  if (taskType === 'business_expense' && rows) {
    const rowOf = (label: string): number => {
      const r = rows.find((x: any) => x.label === label);
      return r?.cell_B !== undefined ? Number(r.cell_B) : 0;
    };
    const emp = (rows.find((r: any) => r.label === 'Empresa / Razón social')?.cell_B) || 'La Parrilla del Norte';
    const rfc = (rows.find((r: any) => r.label === 'RFC del establecimiento')?.cell_B) || 'LPN-880707-ABC';
    const folio = (rows.find((r: any) => r.label === 'Folio del ticket')?.cell_B) || 'TK-00000';
    const subtotal = rowOf('Subtotal del ticket');
    const propina = rowOf('Propina (no deducible)');
    const iva = rowOf('IVA del consumo (16%)');
    const total = rowOf('Total pagado');
    const row = (l: string, v: string, note = '') =>
      `<tr><td style="padding:7px 10px;border:1px dashed #bbb;font-size:12px;font-family:'Courier New'">${l}</td><td style="padding:7px 10px;border:1px dashed #bbb;text-align:right;font-size:12px;font-family:'Courier New'">${v}</td><td style="padding:7px 10px;border:1px dashed #bbb;font-size:10px;color:#777">${note}</td></tr>`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Courier New',monospace;background:#fff;padding:0;margin:0}@page{margin:0}.ticket{max-width:340px;margin:16px auto;border:2px dashed #999;padding:16px 14px;font-size:12px;color:#111}.ttl{text-align:center;font-size:15px;font-weight:bold;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:4px}.sub{text-align:center;font-size:11px;color:#444;margin-bottom:10px}.meta{font-size:11px;margin-bottom:10px}.tot{font-weight:bold;border-top:2px solid #000;margin-top:6px}</style></head><body><div class="ticket">
      <div class="ttl">🧾 TICKET DE COMPRA</div>
      <div class="sub">${emp} · RFC ${rfc}</div>
      <div class="meta">Folio: <strong>${folio}</strong><br>Fecha: 08-jul-2026 · Restaurante La Parrilla del Norte</div>
      <table style="width:100%;border-collapse:collapse">${row('Subtotal (consumos)', `$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, '→ campo Subtotal')}${row('IVA (16%)', `$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, '→ campo IVA del consumo')}${row('Propina', `$${propina.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, '→ campo Propina (no deducible)')}${row('Total pagado', `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, '→ campo Total pagado')}</table>
      <div style="margin-top:10px;font-size:10px;color:#666">Deducción restaurantes 65% del subtotal. La propina NO es deducible ni genera IVA.</div>
      <div class="tot" style="padding-top:6px;text-align:center">GRACIAS POR SU VISITA</div>
      <div style="margin-top:8px;font-size:8px;text-align:center;color:#aaa">Documento educativo · Simulador Laboral</div>
    </div></body></html>`;
  }

  const ctx = taskType === 'business_expense'
    ? { company: 'La Parrilla del Norte', rfc: 'LPN-880707-ABC' }
    : { company: 'Operadora Logística del Norte S.A. de C.V.', rfc: 'OLN-220701-ABC' };

  if (rows) {
    // El documento MUESTRA la tabla pero los valores de filas editables (sin fórmula)
    // Se muestran las filas fuente (sin fórmula = dato de entrada) y se
    // enmascaran las calculadas (respuesta que el alumno debe deducir).
    const rowHtml = rows.map((r: any) => {
      const isComputed = !!r.formula;
      const val = isComputed
        ? '<span style="color:#b45309;background:#fef3c7;padding:2px 6px;border-radius:4px;font-size:10px">→ Calcúlalo</span>'
        : r.cell_B !== undefined ? `$${Number(r.cell_B).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '';
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

// Pistas de mapeo (como burbuja Guía): indica DÓNDE está cada dato y A DÓNDE va,
// sin revelar la respuesta de los campos que el alumno debe llenar.
// Incluye cabecera (RFC, empresa, folio) y filas editables como "Ver en TICKET".
export function getWorkflowHighlightFields(taskType: string, stepData: any): { label: string; value: string; icon?: string }[] {
  if (taskType === 'business_expense' && stepData?.rows) {
    return [
      { label: 'Empresa / Razón social', value: 'TICKET encabezado → campo Empresa', icon: '🏢' },
      { label: 'RFC del establecimiento', value: 'TICKET encabezado (RFC) → campo RFC', icon: '🪪' },
      { label: 'Folio del ticket', value: 'TICKET encabezado (TK-xxxxx) → referencia', icon: '🎫' },
      { label: 'Subtotal del ticket', value: 'TICKET línea 1 → campo editable "Subtotal del ticket"', icon: '📋' },
      { label: 'Propina (no deducible)', value: 'TICKET línea 2 → campo editable "Propina"', icon: '💡' },
      { label: 'IVA del consumo (16%)', value: 'Calculado: =B1×0.16', icon: '🧮' },
      { label: 'Total / Deducible / IVA acreditable', value: 'Calculados por fórmula — no copiar', icon: '🔒' },
    ];
  }

  const fields: { label: string; value: string; icon?: string }[] = [];

  if (stepData?.rows) {
    for (const r of stepData.rows) {
      if (r.cell_B === undefined) continue;
      // Filas sin fórmula son inputs del alumno — no revelar valor
      if (!r.formula) {
        fields.push({ label: r.label, value: 'Ver en documento → campo editable', icon: '📋' });
      } else {
        fields.push({ label: r.label, value: 'Calculado por fórmula', icon: '🧮' });
      }
    }
  }

  if (stepData?.fields) {
    for (const f of stepData.fields) {
      if (f.correct === undefined) continue;
      // Campos de captura (choice/text) — no revelar; calculados — pista
      if (f.type === 'calculated') {
        fields.push({ label: f.label, value: `Calculado: ${f.formula || '—'}`, icon: '🧮' });
      } else {
        fields.push({ label: f.label, value: 'Ver en documento/correo → completar', icon: '📋' });
      }
    }
  }

  return fields;
}
