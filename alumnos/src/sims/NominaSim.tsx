// TASK-D4 — NominaSim: flujo de la capacitacion de nomina (transcripcion
// verificada). 13 pantallas + tarifa ISR R-14 obligatoria. Cero LLM.
// Diseno ContaLink (mas.html): hero verde, stat-cards vivas del motor,
// 4 fases, alta de empleados con formulario real (RFC 13 / CURP 18 /
// NSS 11). Matematicas SIEMPRE del motor (NUNCA 10% fijo ni UUID random).
import { useMemo, useState } from 'react';
import {
  calcularISR,
  calcularNomina,
  validarEmpresa,
  periodos,
  filtroOrdinaria,
  aplicarIncidencias,
  validarCuentas,
  timbrar,
  type Empleado,
} from './nominaEngine';
import { etiquetaAgrupador } from './catalogoAgrupador';

type Paso = 'empresa' | 'confnomina' | 'periodos' | 'alta' | 'ficha' | 'percepciones' | 'fijas' | 'asimilados' | 'extraordinaria' | 'ordinaria' | 'incidencias' | 'cuentas' | 'timbrado';
const PASOS: Paso[] = ['empresa', 'confnomina', 'periodos', 'alta', 'ficha', 'percepciones', 'fijas', 'asimilados', 'extraordinaria', 'ordinaria', 'incidencias', 'cuentas', 'timbrado'];
const TITULOS: Record<Paso, string> = {
  empresa: 'Configuración de empresa',
  confnomina: 'Configuración de nómina',
  periodos: 'Periodos',
  alta: 'Alta de empleados (3 vías)',
  ficha: 'Ficha del empleado',
  percepciones: 'Percepciones automáticas',
  fijas: 'Percepciones fijas extra',
  asimilados: 'Asimilados',
  extraordinaria: 'Nómina extraordinaria',
  ordinaria: 'Nómina ordinaria',
  incidencias: 'Incidencias',
  cuentas: 'Cuentas contables',
  timbrado: 'Timbrado y pago',
};

// Fases visuales ContaLink que agrupan los 13 pasos del video.
const FASES: { id: string; titulo: string; detalle: string; color: string; pasos: Paso[] }[] = [
  { id: 'config', titulo: '1. Configuración', detalle: 'Empresa, nómina y periodos', color: '#3b82f6', pasos: ['empresa', 'confnomina', 'periodos'] },
  { id: 'empleados', titulo: '2. Empleados', detalle: 'RFC, CURP, NSS, salario', color: '#10b981', pasos: ['alta', 'ficha'] },
  { id: 'calculo', titulo: '3. Cálculo', detalle: 'ISR tarifa, IMSS, neto', color: '#f59e0b', pasos: ['percepciones', 'fijas', 'asimilados', 'extraordinaria', 'ordinaria', 'incidencias'] },
  { id: 'timbrado', titulo: '4. Timbrado', detalle: 'CFDI Nómina 4.0', color: '#7c3aed', pasos: ['cuentas', 'timbrado'] },
];

interface EmpleadoFiscal extends Empleado {
  rfc: string;
  curp: string;
  nss: string;
  diario: number;
}

// Seed del video (6 empleados con periodicidad); el alta agrega con datos fiscales.
const EMPLEADOS_SEED: EmpleadoFiscal[] = [
  { nombre: 'Ana', periodicidad: 'semanal', rfc: '', curp: '', nss: '', diario: 0 },
  { nombre: 'Beto', periodicidad: 'quincenal', rfc: '', curp: '', nss: '', diario: 0 },
  { nombre: 'Camila', periodicidad: 'semanal', rfc: '', curp: '', nss: '', diario: 0 },
  { nombre: 'Emilio', periodicidad: 'quincenal', rfc: '', curp: '', nss: '', diario: 0 },
  { nombre: 'Julia Martínez', periodicidad: 'semanal', rfc: '', curp: '', nss: '', diario: 0 },
  { nombre: 'Luis', periodicidad: 'quincenal', rfc: '', curp: '', nss: '', diario: 0 },
];

export default function NominaSim() {
  const [paso, setPaso] = useState<Paso>('empresa');
  const [emp, setEmp] = useState({ razon: 'Logística del Norte', regimen: '601', cp: '32575', cer: 'csd.cer', key: 'csd.key', pass: '****', logoMB: '1.5' });
  const [conf, setConf] = useState({ diasBase: '15', minimoISR: 'no', patronal: 'RP-001 + default' });
  const [quinc, setQuinc] = useState<'15' | '15.2'>('15');
  const [ficha, setFicha] = useState({ diario: '318.19', vacaciones: '22', ptu: true });
  const [finiquito, setFiniquito] = useState({ fechaTermino: '2026-07-15', exento: '5000', gravable: '12000' });
  const [resTimbrado, setResTimbrado] = useState<string | null>(null);
  const [empleados, setEmpleados] = useState<EmpleadoFiscal[]>(EMPLEADOS_SEED);
  const [nuevo, setNuevo] = useState({ nombre: '', periodicidad: 'semanal', rfc: '', curp: '', nss: '', diario: '' });
  const [errAlta, setErrAlta] = useState<string[]>([]);

  const errEmp = useMemo(() => validarEmpresa({ razon: emp.razon, regimen: emp.regimen, cp: emp.cp, cer: emp.cer, key: emp.key, pass: emp.pass, logoMB: Number(emp.logoMB) }), [emp]);
  const nom = useMemo(() => calcularNomina({ diario: Number(ficha.diario), dias: 7, esMinimo: false, causaISR: true, asimilada: false }), [ficha]);
  const nomMin = useMemo(() => calcularNomina({ diario: 248.93, dias: 7, esMinimo: true, causaISR: false, asimilada: false }), []);
  const asi = useMemo(() => calcularNomina({ diario: 0, dias: 0, esMinimo: false, causaISR: true, asimilada: true, montoAsimilada: 10000 }), []);
  const semanales = useMemo(() => filtroOrdinaria(empleados, 'semanal'), [empleados]);
  const inc = useMemo(() => aplicarIncidencias('20–26 jul', { vacaciones: 3, he: 2, festivo: 1 }), []);
  const errCuentas = useMemo(() => validarCuentas([{ concepto: 'Sueldos', cuenta: '501-01' }, { concepto: 'ISR retenido', cuenta: '211-01' }, { concepto: 'Finiquito', cuenta: '' }]), []);

  const idx = PASOS.indexOf(paso);
  const faseDe = (p: Paso) => FASES.find((f) => f.pasos.includes(p))!;
  const faseActiva = faseDe(paso);

  function agregarEmpleado() {
    const errs: string[] = [];
    if (!nuevo.nombre.trim()) errs.push('nombre requerido');
    if (nuevo.rfc.trim().length !== 13) errs.push('RFC debe tener 13 caracteres (PF)');
    if (nuevo.curp.trim().length !== 18) errs.push('CURP debe tener 18 caracteres');
    if (!/^\d{11}$/.test(nuevo.nss.trim())) errs.push('NSS debe tener 11 dígitos');
    if (!(Number(nuevo.diario) > 0)) errs.push('salario diario debe ser mayor a 0');
    setErrAlta(errs);
    if (errs.length > 0) return;
    setEmpleados([...empleados, {
      nombre: nuevo.nombre.trim(),
      periodicidad: nuevo.periodicidad as 'semanal' | 'quincenal',
      rfc: nuevo.rfc.trim().toUpperCase(),
      curp: nuevo.curp.trim().toUpperCase(),
      nss: nuevo.nss.trim(),
      diario: Number(nuevo.diario),
    }]);
    setNuevo({ nombre: '', periodicidad: 'semanal', rfc: '', curp: '', nss: '', diario: '' });
  }

  const num = (v: string, set: (s: string) => void, label: string) => (
    <label className="block text-xs text-slate-600 dark:text-slate-300">
      {label}
      <input value={v} onChange={(e) => set(e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
    </label>
  );
  const card = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-2';

  return (
    <div className="p-4 space-y-3 bg-slate-50 dark:bg-slate-900 min-h-full">
      {/* Hero ContaLink */}
      <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
        <div className="flex gap-1.5 flex-wrap mb-1.5">
          {['Módulo de Nómina', 'Anexo 20 RMF 2026', 'CFDI Nómina 4.0'].map((b) => (
            <span key={b} className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.2)' }}>{b}</span>
          ))}
        </div>
        <h2 className="text-lg font-bold">Gestión y Emisión de Nómina</h2>
        <p className="text-xs opacity-90">ISR por tarifa progresiva (Art. 96 LISR) — nunca % fijo · Art. 99 LISR</p>
      </div>

      {/* Stat-cards vivas del motor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { v: String(empleados.length), l: 'Empleados', c: '#1e293b' },
          { v: `$${nom.bruto.toFixed(0)}`, l: 'Percepción ejemplo', c: '#065f46' },
          { v: `$${(nom.isr + nom.imss).toFixed(0)}`, l: 'Deducciones (ISR+IMSS)', c: '#991b1b' },
          { v: `$${nom.neto.toFixed(0)}`, l: 'Neto ejemplo', c: '#6b21a8' },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5">
            <div className="text-lg font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[10px] text-slate-500">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Fases ContaLink */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FASES.map((f) => (
          <button key={f.id} onClick={() => setPaso(f.pasos[0])}
            className={`text-left p-2.5 rounded-xl border-2 transition ${faseActiva.id === f.id ? '' : 'opacity-70 hover:opacity-100'}`}
            style={{ borderColor: faseActiva.id === f.id ? f.color : undefined, background: faseActiva.id === f.id ? `${f.color}12` : undefined }}>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100" style={{ borderLeft: `4px solid ${f.color}`, paddingLeft: 6 }}>{f.titulo}</div>
            <div className="text-[10px] text-slate-500 mt-0.5" style={{ paddingLeft: 10 }}>{f.detalle}</div>
            <div className="flex gap-1 mt-1.5" style={{ paddingLeft: 10 }}>
              {f.pasos.map((p) => (
                <span key={p} title={TITULOS[p]} className="h-1.5 flex-1 rounded-full" style={{ background: PASOS.indexOf(p) <= idx ? f.color : undefined }} />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{TITULOS[paso]} <span className="text-[10px] font-normal text-slate-500">· paso {idx + 1}/{PASOS.length}</span></div>

      {paso === 'empresa' && (
        <div className={card}>
          {num(emp.razon, (v) => setEmp({ ...emp, razon: v }), 'Razón social (vs constancia)')}
          {num(emp.regimen, (v) => setEmp({ ...emp, regimen: v }), 'Régimen')}
          {num(emp.cp, (v) => setEmp({ ...emp, cp: v }), 'CP')}
          {num(emp.logoMB, (v) => setEmp({ ...emp, logoMB: v }), 'Logo MB (máx 2)')}
          <div className="text-slate-500">CSD: cer + key + password (opinión de cumplimiento e Infonavit piden registro patronal).</div>
          {errEmp.length === 0 ? <div className="text-green-600">✓ Empresa válida.</div> : errEmp.map((e, i) => <div key={i} className="text-red-600">• {e}</div>)}
        </div>
      )}

      {paso === 'confnomina' && (
        <div className={card}>
          {num(conf.diasBase, (v) => setConf({ ...conf, diasBase: v }), 'Días base (aguinaldo → SDI y cotización)')}
          <div>Salario mínimo: ISR <b>{conf.minimoISR === 'no' ? 'NO se retiene (en 0)' : 'SÍ se retiene (causar)'}</b>
            <button onClick={() => setConf({ ...conf, minimoISR: conf.minimoISR === 'no' ? 'si' : 'no' })} className="ml-2 px-2 py-0.5 border rounded text-[10px]">cambiar</button>
          </div>
          {num(conf.patronal, (v) => setConf({ ...conf, patronal: v }), 'Registros patronales (+ default)')}
          <div className="text-slate-500">Incidencias default: descanso, horas extra, vacaciones.</div>
        </div>
      )}

      {paso === 'periodos' && (
        <div className={card}>
          <div>Semanal (desde 20-jul): {periodos('semanal').join(' · ')}</div>
          <div>Quincenal corte 16: {periodos('quincenal', quinc).join(' · ')}
            <button onClick={() => setQuinc(quinc === '15' ? '15.2' : '15')} className="ml-2 px-2 py-0.5 border rounded text-[10px]">usar {quinc === '15' ? '15.2' : '15'}</button>
          </div>
          <div className="text-slate-500">Crear periodos 2026 · borrar con checkbox + bote (duplicados fuera).</div>
        </div>
      )}

      {paso === 'alta' && (
        <div className={card}>
          <div><b>1. XML:</b> muñeco + → actualiza catálogo (CURP, RFC, contrato, régimen).</div>
          <div><b>2. Manual:</b> todos los campos del empleado.</div>
          <div><b>3. Masiva:</b> Excel con rojos obligatorios (empleados o asimilados).</div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-700 dark:text-slate-200">➕ Agregar empleado (PF: RFC 13 · CURP 18 · NSS 11 dígitos)</div>
            <div className="grid grid-cols-2 gap-2">
              {num(nuevo.nombre, (v) => setNuevo({ ...nuevo, nombre: v }), 'Nombre completo')}
              <label className="block text-xs text-slate-600 dark:text-slate-300">Periodicidad
                <select value={nuevo.periodicidad} onChange={(e) => setNuevo({ ...nuevo, periodicidad: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                </select>
              </label>
              {num(nuevo.rfc, (v) => setNuevo({ ...nuevo, rfc: v }), 'RFC (13 caracteres)')}
              {num(nuevo.curp, (v) => setNuevo({ ...nuevo, curp: v }), 'CURP (18 caracteres)')}
              {num(nuevo.nss, (v) => setNuevo({ ...nuevo, nss: v }), 'NSS (11 dígitos)')}
              {num(nuevo.diario, (v) => setNuevo({ ...nuevo, diario: v }), 'Salario diario')}
            </div>
            {errAlta.length > 0 && errAlta.map((e, i) => <div key={i} className="text-red-600">• {e}</div>)}
            <button onClick={agregarEmpleado} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Agregar empleado</button>
            <div className="text-slate-500">Plantilla actual: {empleados.map((e) => e.nombre).join(', ')}</div>
          </div>
        </div>
      )}

      {paso === 'ficha' && (
        <div className={card}>
          {num(ficha.diario, (v) => setFicha({ ...ficha, diario: v }), 'Salario diario (318.19 / 18 / mínimo)')}
          {num(ficha.vacaciones, (v) => setFicha({ ...ficha, vacaciones: v }), 'Días vacaciones (22)')}
          <div>PTU: <input type="checkbox" checked={ficha.ptu} onChange={(e) => setFicha({ ...ficha, ptu: e.target.checked })} /> checkbox</div>
          <div className="text-amber-700 dark:text-amber-300">⚠️ Actualizar + Refrescar obligatorio tras cambiar el diario (recalcula cotización con prima vacacional).</div>
          <div>Semanal: {nom.bruto.toFixed(2)} · ISR {nom.isr} · IMSS {nom.imss.toFixed(2)} · Neto {nom.neto.toFixed(2)}</div>
        </div>
      )}

      {paso === 'percepciones' && (
        <div className={card}>
          <div>Salario {ficha.diario} &gt; mínimo → genera ISR ({nom.isr}) + seguridad social ({nom.imss.toFixed(2)}).</div>
          <div>Salario = mínimo → ISR {nomMin.isr} e IMSS {nomMin.imss} (se eliminan).</div>
          <div className="text-slate-500">Cálculo por salario diario base × días del periodo.</div>
        </div>
      )}

      {paso === 'fijas' && (
        <div className={card}>
          <div>Infonavit <b>300/semana</b> con clave → fija, no se recaptura.</div>
          <div className="text-slate-500">Las fijas quedan guardadas: no vuelvas a capturarlas cada periodo.</div>
        </div>
      )}

      {paso === 'asimilados' && (
        <div className={card}>
          <div>Julia Martínez 10000 → solo ISR {asi.isr}, sin IMSS. Neto {asi.neto}.</div>
          <div className="text-slate-500">Asimilada ≠ asalariada: ISR por tarifa tramo 2 (371), nada de seguridad social.</div>
        </div>
      )}

      {paso === 'extraordinaria' && (
        <div className={card}>
          {num(finiquito.fechaTermino, (v) => setFiniquito({ ...finiquito, fechaTermino: v }), 'Finiquito: fecha término')}
          {num(finiquito.exento, (v) => setFiniquito({ ...finiquito, exento: v }), 'Parte exenta (editable)')}
          {num(finiquito.gravable, (v) => setFiniquito({ ...finiquito, gravable: v }), 'Parte gravable (editable)')}
          <div>Prima a 5 con caso "excedió exento": el excedente grava con tarifa R-14 (ISR {calcularISR(Number(finiquito.gravable))}).</div>
        </div>
      )}

      {paso === 'ordinaria' && (
        <div className={card}>
          <div>Filtro periodicidad semanal: {empleados.length} empleados → entran <b>{semanales.map((e) => e.nombre).join(', ')}</b> ({semanales.length}).</div>
          <div className="text-slate-500">Lista de raya: PDF / Excel.</div>
        </div>
      )}

      {paso === 'incidencias' && (
        <div className={card}>
          <div>{inc.mensaje}</div>
          <div className="text-slate-500">Extras solo afectan el periodo 20–26.</div>
        </div>
      )}

      {paso === 'cuentas' && (
        <div className={card}>
          {errCuentas.length === 0 ? <div className="text-green-600">✓ Todas con cuenta.</div> : errCuentas.map((e, i) => <div key={i} className="text-amber-700 dark:text-amber-300">⚠️ {e}</div>)}
          <div className="text-slate-500">Toda percepción/deducción lleva cuenta contable.</div>
          <div className="text-[10px] text-slate-500">SAT Anexo 24 → Sueldos: {etiquetaAgrupador('501-01')} · ISR retenido: {etiquetaAgrupador('211-01')}</div>
        </div>
      )}

      {paso === 'timbrado' && (
        <div className={card}>
          <div>Palomita: todos o uno por uno. En efectivo → contra caja con fecha del XML.</div>
          <div>Modalidad CFDIs = pago automático.</div>
          <button onClick={() => setResTimbrado(timbrar({ seleccionados: 3, total: 3, contraCaja: true, fechaXML: '2026-07-26' }).mensaje)} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">Timbrar 3/3</button>
          {resTimbrado && <div className="p-2 rounded bg-slate-50 dark:bg-slate-900">✅ {resTimbrado}</div>}
        </div>
      )}

      {/* Teoría importada de mas.html */}
      <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46' }}>
        <b>📚 ¿Qué es el Módulo de Nómina?</b> Gestiona empleados, calcula percepciones y deducciones (ISR Art. 96 LISR, IMSS Art. 13 LSS), emite recibos timbrados (CFDI Nómina 4.0). Empleados PF: RFC 13 · CURP 18 · NSS 11 dígitos. Conceptos Anexo 20: percepciones 001-099, deducciones 019-051.
      </div>

      <div className="flex justify-between">
        <button onClick={() => setPaso(PASOS[Math.max(0, idx - 1)])} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs">← Atrás</button>
        {idx < PASOS.length - 1 && <button onClick={() => setPaso(PASOS[idx + 1])} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">Siguiente →</button>}
      </div>
    </div>
  );
}
