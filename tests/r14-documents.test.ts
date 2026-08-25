import { describe, it, expect } from 'vitest';
import { generateInvoice, generateSupplierInvoice, generatePurchaseTicket, generateBankStatement, generateTaxDeclaration, generatePaymentReceipt } from '../backend/src/services/documentGenerator';
import { auditDocument } from '../backend/src/services/auditDocument';
import { mulberry32, docSeed, randRng, pickRng } from '../backend/src/lib/rng';
import { generateCfdiXml, generateCfdiPdfHtml } from '../backend/src/services/cfdiGenerator';

describe('R14 — Audit de documentos (9 checks de coherencia)', () => {
  it('audita la factura: pasa todos los checks', () => {
    const doc = generateInvoice('user-1');
    const audit = auditDocument('invoice', doc.data, 'user-1');
    expect(audit.passed).toBe(true);
    expect(audit.checks).toHaveLength(9);
  });

  it('audita el CFDI de proveedor: cliente/proveedor existe', () => {
    const doc = generateSupplierInvoice('user-1');
    const audit = auditDocument('supplier_invoice', doc.data, 'user-1');
    expect(audit.passed).toBe(true);
    const entidadCheck = audit.checks.find(c => c.name === 'Entidad existe en persistentData');
    expect(entidadCheck?.ok).toBe(true);
  });

  it('audita el ticket de compra: subtotal/IVA/total cuadran', () => {
    const doc = generatePurchaseTicket('user-1');
    const audit = auditDocument('purchase_ticket', doc.data, 'user-1');
    expect(audit.passed).toBe(true);
    const subtotal = audit.checks.find(c => c.name === 'Subtotal cuadra');
    const iva = audit.checks.find(c => c.name === 'IVA 16% correcto');
    const total = audit.checks.find(c => c.name === 'Total cuadra');
    expect(subtotal?.ok).toBe(true);
    expect(iva?.ok).toBe(true);
    expect(total?.ok).toBe(true);
  });

  it('documentos NO contienen mojibake', () => {
    for (const gen of [generateInvoice, generateSupplierInvoice, generatePurchaseTicket, generateBankStatement, generatePaymentReceipt]) {
      const doc = gen('user-1');
      expect(doc.html).not.toMatch(/Ã|Â\u00D0|\u00C2/);
    }
  });
});

describe('R14 — Determinismo (misma seed → mismo documento)', () => {
  it('docSeed es reproducible para mismo userId+fecha+tipo', () => {
    const s1 = docSeed('user-1', '08-jul', 'invoice');
    const s2 = docSeed('user-1', '08-jul', 'invoice');
    expect(s1).toBe(s2);
  });

  it('docSeed difiere con diferente tipo', () => {
    const s1 = docSeed('user-1', '08-jul', 'invoice');
    const s2 = docSeed('user-1', '08-jul', 'purchase_ticket');
    expect(s1).not.toBe(s2);
  });

  it('mulberry32 genera secuencia determinista', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    const a = [rng1(), rng1(), rng1()];
    const b = [rng2(), rng2(), rng2()];
    expect(a).toEqual(b);
  });

  it('randRng respeta el rango', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = randRng(rng, 1, 100);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('pickRng selecciona del array', () => {
    const rng = mulberry32(7);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(pickRng(rng, arr));
    }
  });
});

describe('R14 — Generador PDF/XML del CFDI', () => {
  it('genera XML con estructura CFDI 4.0', () => {
    const data = { client: 'Comercial del Norte', clientRfc: 'CNS-990101-HIJ', subtotal: 1000, iva: 160, total: 1160, invoiceNumber: 'FAC-2026-001', items: [{ desc: 'Servicio', qty: 1, unitPrice: 1000, amount: 1000 }] };
    const xml = generateCfdiXml(data);
    expect(xml).toContain('cfdi:Comprobante');
    expect(xml).toContain('Version="4.0"');
    expect(xml).toContain('Total="1160.00"');
    expect(xml).toContain('CNS-990101-HIJ');
  });

  it('genera PDF HTML con totales cuadrados', () => {
    const data = { client: 'Comercial del Norte', clientRfc: 'CNS-990101-HIJ', subtotal: 1000, iva: 160, total: 1160, items: [{ desc: 'Servicio', qty: 1, unitPrice: 1000, amount: 1000 }] };
    const html = generateCfdiPdfHtml(data);
    expect(html).toContain('CFDI');
    expect(html).toContain('$1,160.00');
  });
});