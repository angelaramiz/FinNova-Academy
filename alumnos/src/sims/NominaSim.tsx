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
  vistaPreviaCFDI,
  type VistaPreviaCFDI,
  type Empleado,
} from './nominaEngine';
import { etiquetaAgrupador } from './catalogoAgrupador';
import { reportarSim } from './reportarSim';
import TourSim from './TourSim';
import { TOURS } from './toursContalink';

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
  const [preview, setPreview] = useState<VistaPreviaCFDI | null>(null);
  const [errPreview, setErrPreview] = useState<string | null>(null);
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

  function confirmarTimbrado() {
    const r = timbrar({ seleccionados: 3, total: 3, contraCaja: true, fechaXML: '2026-07-26' });
    setResTimbrado(r.mensaje);
    setPreview(null);
    if (r.ok) reportarSim({ taskType: 'nomina_practica', title: 'Nómina Contalink — timbrado 3/3', score: 100, passed: true });
  }

  function abrirPreview() {
    const receptor = empleados.find((e) => e.rfc.trim().length === 13);
    if (!receptor) {
      setErrPreview('Sin receptor válido: agrega un empleado con RFC de 13 caracteres en el paso Alta. 📚 El CFDI necesita un receptor con RFC válido o el SAT lo rechaza antes de timbrar.');
      return;
    }
    setErrPreview(null);
    setPreview(vistaPreviaCFDI({
      razon: emp.razon, regimen: emp.regimen, cp: emp.cp,
      empleadoNombre: receptor.nombre, empleadoRfc: receptor.rfc, empleadoCurp: receptor.curp, empleadoNss: receptor.nss,
      diario: Number(ficha.diario), dias: 7, bruto: nom.bruto, isr: nom.isr, imss: nom.imss, neto: nom.neto,
      fecha: '2026-07-26',
    }));
  }

  const idx = PASOS.indexOf(paso);
  const faseDe = (p: Paso) => FASES.find((f) => f.pasos.includes(p))!;
  const faseActiva = faseDe(paso);

  function agregarEmpleado() {
    const errs: string[] = [];
    if (!nuevo.nombre.trim()) errs.push('nombre requerido 📚 El nombre debe coincidir con CURP y constancia del trabajador: es la llave para identificarlo ante IMSS e Infonavit.');
    if (nuevo.rfc.trim().length !== 13) errs.push('RFC debe tener 13 caracteres (PF) 📚 Persona física: 4 letras + 6 de fecha (AAMMDD) + 3 de homoclave. Con 12 sería persona moral y el timbrado lo rechaza.');
    if (nuevo.curp.trim().length !== 18) errs.push('CURP debe tener 18 caracteres 📚 4 letras + 6 de fecha + 6 de nacimiento + 2 verificadores: el IMSS la usa para afiliar al trabajador.');
    if (!/^\d{11}$/.test(nuevo.nss.trim())) errs.push('NSS debe tener 11 dígitos 📚 El Número de Seguridad Social de 11 dígitos es la cuenta del trabajador ante el IMSS: sin NSS válido no hay alta.');
    if (!(Number(nuevo.diario) > 0)) errs.push('salario diario debe ser mayor a 0 📚 El salario diario base × días del periodo es el bruto del que sale todo (ISR, IMSS, neto): en cero, nada se calcula.');
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
    <label className="block text-xs text-slate-600">
      {label}
      <input value={v} onChange={(e) => set(e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-sm" />
    </label>
  );
  // Sistema claro ContaLink (mas.html): tarjetas blancas, borde #e2e8f0.
  const card = 'rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-2';

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 12 }}>
      {/* Hero ContaLink (mas.html: gradiente verde nómina #059669→#10b981) */}
      <div data-tour="nomina-hero" className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
        <div className="flex gap-1.5 flex-wrap mb-1.5">
          {['Módulo de Nómina', 'Anexo 20 RMF 2026', 'CFDI Nómina 4.0'].map((b) => (
            <span key={b} className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.2)' }}>{b}</span>
          ))}
        </div>
        <h2 className="text-lg font-bold">Gestión y Emisión de Nómina</h2>
        <p className="text-xs opacity-90">ISR por tarifa progresiva (Art. 96 LISR) — nunca % fijo · Art. 99 LISR</p>
      </div>

      <TourSim titulo={TOURS.nomina.titulo} pasos={TOURS.nomina.pasos} storageKey={TOURS.nomina.storageKey} onNavegar={(p) => setPaso(p as Paso)} />

      {/* Stat-cards blancas con icono en cuadro de color (mas.html) */}
      <div data-tour="nomina-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { v: String(empleados.length), l: 'Empleados', c: '#1e293b', bg: '#eff6ff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', ic: '#1e40af' },
          { v: `$${nom.bruto.toFixed(0)}`, l: 'Percepción ejemplo', c: '#065f46', bg: '#f0fdf4', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', ic: '#10b981' },
          { v: `$${(nom.isr + nom.imss).toFixed(0)}`, l: 'Deducciones (ISR+IMSS)', c: '#991b1b', bg: '#fef2f2', icon: 'M13 10V3L4 14h7v7l9-11h-7z', ic: '#ef4444' },
          { v: `$${nom.neto.toFixed(0)}`, l: 'Neto ejemplo', c: '#6b21a8', bg: '#faf5ff', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', ic: '#8b5cf6' },
        ].map((s) => (
          <div key={s.l} className="stat-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div><div className="stat-value" style={{ color: s.c }}>{s.v}</div><div className="stat-label">{s.l}</div></div>
              <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.ic} strokeWidth="2"><path d={s.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fases ContaLink */}
      <div data-tour="nomina-fases" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FASES.map((f) => (
          <button key={f.id} onClick={() => setPaso(f.pasos[0])}
            className={`text-left p-2.5 rounded-xl border-2 transition bg-white ${faseActiva.id === f.id ? '' : 'opacity-70 hover:opacity-100'}`}
            style={{ borderColor: faseActiva.id === f.id ? f.color : '#e2e8f0', background: faseActiva.id === f.id ? `${f.color}12` : 'white' }}>
            <div className="text-xs font-bold text-slate-800" style={{ borderLeft: `4px solid ${f.color}`, paddingLeft: 6 }}>{f.titulo}</div>
            <div className="text-[10px] text-slate-500 mt-0.5" style={{ paddingLeft: 10 }}>{f.detalle}</div>
            <div className="flex gap-1 mt-1.5" style={{ paddingLeft: 10 }}>
              {f.pasos.map((p) => (
                <span key={p} title={TITULOS[p]} className="h-1.5 flex-1 rounded-full" style={{ background: PASOS.indexOf(p) <= idx ? f.color : undefined }} />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="text-sm font-semibold text-slate-700">{TITULOS[paso]} <span className="text-[10px] font-normal text-slate-500">· paso {idx + 1}/{PASOS.length}</span></div>

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
        <div data-tour="nomina-alta" className={card}>
          <div><b>1. XML:</b> muñeco + → actualiza catálogo (CURP, RFC, contrato, régimen).</div>
          <div><b>2. Manual:</b> todos los campos del empleado.</div>
          <div><b>3. Masiva:</b> Excel con rojos obligatorios (empleados o asimilados).</div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="data-table">
              <thead><tr><th>Empleado</th><th style={{ textAlign: 'center' }}>Periodicidad</th><th>RFC</th><th style={{ textAlign: 'right' }}>Salario diario</th></tr></thead>
              <tbody>
                {empleados.map((e) => (
                  <tr key={e.nombre}>
                    <td style={{ fontSize: 12 }}>{e.nombre}</td>
                    <td style={{ textAlign: 'center' }}><span className="status-badge status-info">{e.periodicidad}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{e.rfc || '—'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{e.diario > 0 ? `$${e.diario.toFixed(2)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="font-bold text-slate-700">➕ Agregar empleado (PF: RFC 13 · CURP 18 · NSS 11 dígitos)</div>
            <div className="grid grid-cols-2 gap-2">
              {num(nuevo.nombre, (v) => setNuevo({ ...nuevo, nombre: v }), 'Nombre completo')}
              <label className="block text-xs text-slate-600">Periodicidad
                <select value={nuevo.periodicidad} onChange={(e) => setNuevo({ ...nuevo, periodicidad: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-sm">
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
            <button onClick={agregarEmpleado} className="btn btn-success">Agregar empleado</button>
            <div className="text-slate-500">Plantilla actual: {empleados.map((e) => e.nombre).join(', ')}</div>
          </div>
        </div>
      )}

      {paso === 'ficha' && (
        <div data-tour="nomina-ficha" className={card}>
          {num(ficha.diario, (v) => setFicha({ ...ficha, diario: v }), 'Salario diario (318.19 / 18 / mínimo)')}
          {num(ficha.vacaciones, (v) => setFicha({ ...ficha, vacaciones: v }), 'Días vacaciones (22)')}
          <div>PTU: <input type="checkbox" checked={ficha.ptu} onChange={(e) => setFicha({ ...ficha, ptu: e.target.checked })} /> checkbox</div>
          <div className="text-amber-700">⚠️ Actualizar + Refrescar obligatorio tras cambiar el diario (recalcula cotización con prima vacacional).</div>
          <div>Semanal: {nom.bruto.toFixed(2)} · ISR {nom.isr} · IMSS {nom.imss.toFixed(2)} · Neto {nom.neto.toFixed(2)}</div>
          <div className="text-slate-500">IMSS 5% fijo = simplificación didáctica (la LSS real cotiza por ramos de seguro). ISR siempre por tarifa progresiva, nunca % fijo.</div>
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
          {errCuentas.length === 0 ? <div className="text-green-600">✓ Todas con cuenta.</div> : errCuentas.map((e, i) => <div key={i} className="text-amber-700">⚠️ {e}</div>)}
          <div className="text-slate-500">Toda percepción/deducción lleva cuenta contable.</div>
          <div className="text-[10px] text-slate-500">SAT Anexo 24 → Sueldos: {etiquetaAgrupador('501-01')} · ISR retenido: {etiquetaAgrupador('211-01')}</div>
        </div>
      )}

      {paso === 'timbrado' && (
        <div data-tour="nomina-timbrado" className={card}>
          <div>Palomita: todos o uno por uno. En efectivo → contra caja con fecha del XML.</div>
          <div>Modalidad CFDIs = pago automático.</div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={abrirPreview} className="btn btn-secondary">👁 Vista previa del CFDI</button>
            <button onClick={confirmarTimbrado} className="btn btn-primary">Timbrar 3/3</button>
          </div>
          {errPreview && <div className="text-red-600">• {errPreview}</div>}
          {resTimbrado && <div className="p-2 rounded bg-slate-50">✅ {resTimbrado}</div>}
        </div>
      )}

      {/* P2: Vista previa del CFDI de Nómina 4.0 antes de timbrar */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={() => setPreview(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 16, fontSize: 12, color: '#0f172a' }}>
            <div className="font-bold text-sm">🧾 CFDI de Nómina 4.0 · Vista previa (SIMULADO)</div>
            <div className="text-slate-500">Revisa el documento final antes de timbrar: esto es lo que recibirá el SAT.</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg border border-slate-200 p-2">
                <div className="font-bold">Emisor</div>
                <div>{preview.emisor.razon}</div>
                <div className="font-mono text-[11px]">Régimen {preview.emisor.regimen} · CP {preview.emisor.cp}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-2">
                <div className="font-bold">Receptor</div>
                <div>{preview.receptor.nombre}</div>
                <div className="font-mono text-[11px]">{preview.receptor.rfc}</div>
                <div className="font-mono text-[11px]">CURP {preview.receptor.curp || '—'} · NSS {preview.receptor.nss || '—'}</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2 mt-2">
              <div className="font-bold">Concepto · {preview.concepto.clave} {preview.concepto.descripcion}</div>
              <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>${preview.concepto.importe.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2 mt-2">
              <div className="font-bold">Complemento de nómina · {preview.complementoNomina.dias} días</div>
              <div>Percepciones: <b className="font-mono">${preview.complementoNomina.percepciones.toFixed(2)}</b></div>
              <div>Deducción ISR (Art. 96 LISR): <b className="font-mono">${preview.complementoNomina.deduccionISR.toFixed(2)}</b></div>
              <div>Deducción IMSS: <b className="font-mono">${preview.complementoNomina.deduccionIMSS.toFixed(2)}</b></div>
              <div>Neto a pagar: <b className="font-mono">${preview.complementoNomina.neto.toFixed(2)}</b></div>
            </div>
            <div className="rounded-lg p-2 mt-2 font-mono text-[10px] break-all" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="font-sans font-bold text-xs">Cadena original (simulada)</div>
              {preview.cadenaOriginal}
              <div className="font-sans font-bold text-xs mt-1">Sello digital (simulado)</div>
              {preview.selloSimulado}
              <div className="font-sans font-bold text-xs mt-1">UUID (simulado)</div>
              {preview.uuidSimulado}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={confirmarTimbrado} className="btn btn-primary">✅ Confirmar timbrado</button>
              <button onClick={() => setPreview(null)} className="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Teoría importada de mas.html */}
      <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46' }}>
        <b>📚 ¿Qué es el Módulo de Nómina?</b> Gestiona empleados, calcula percepciones y deducciones (ISR Art. 96 LISR por tarifa progresiva, cuotas obrero-patronales LSS), emite recibos timbrados (CFDI Nómina 4.0). Empleados PF: RFC 13 · CURP 18 · NSS 11 dígitos. Conceptos Anexo 20: percepciones 001-099, deducciones 019-051.
      </div>

      <div className="flex justify-between">
        <button onClick={() => setPaso(PASOS[Math.max(0, idx - 1)])} className="btn btn-secondary">← Atrás</button>
        {idx < PASOS.length - 1 && <button onClick={() => setPaso(PASOS[idx + 1])} className="btn btn-primary">Siguiente →</button>}
      </div>
    </div>
  );
}
