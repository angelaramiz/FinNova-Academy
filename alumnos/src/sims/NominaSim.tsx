// TASK-D4 — NominaSim: flujo de la capacitacion de nomina (transcripcion
// verificada). 13 pantallas + tarifa ISR R-14 obligatoria. Cero LLM.
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

const EMPLEADOS = [
  { nombre: 'Ana', periodicidad: 'semanal' as const },
  { nombre: 'Beto', periodicidad: 'quincenal' as const },
  { nombre: 'Camila', periodicidad: 'semanal' as const },
  { nombre: 'Emilio', periodicidad: 'quincenal' as const },
  { nombre: 'Julia Martínez', periodicidad: 'semanal' as const },
  { nombre: 'Luis', periodicidad: 'quincenal' as const },
];

export default function NominaSim() {
  const [paso, setPaso] = useState<Paso>('empresa');
  const [emp, setEmp] = useState({ razon: 'Logística del Norte', regimen: '601', cp: '32575', cer: 'csd.cer', key: 'csd.key', pass: '****', logoMB: '1.5' });
  const [conf, setConf] = useState({ diasBase: '15', minimoISR: 'no', patronal: 'RP-001 + default' });
  const [quinc, setQuinc] = useState<'15' | '15.2'>('15');
  const [ficha, setFicha] = useState({ diario: '318.19', vacaciones: '22', ptu: true });
  const [finiquito, setFiniquito] = useState({ fechaTermino: '2026-07-15', exento: '5000', gravable: '12000' });
  const [resTimbrado, setResTimbrado] = useState<string | null>(null);

  const errEmp = useMemo(() => validarEmpresa({ razon: emp.razon, regimen: emp.regimen, cp: emp.cp, cer: emp.cer, key: emp.key, pass: emp.pass, logoMB: Number(emp.logoMB) }), [emp]);
  const nom = useMemo(() => calcularNomina({ diario: Number(ficha.diario), dias: 7, esMinimo: false, causaISR: true, asimilada: false }), [ficha]);
  const nomMin = useMemo(() => calcularNomina({ diario: 248.93, dias: 7, esMinimo: true, causaISR: false, asimilada: false }), []);
  const asi = useMemo(() => calcularNomina({ diario: 0, dias: 0, esMinimo: false, causaISR: true, asimilada: true, montoAsimilada: 10000 }), []);
  const semanales = useMemo(() => filtroOrdinaria(EMPLEADOS, 'semanal'), []);
  const inc = useMemo(() => aplicarIncidencias('20–26 jul', { vacaciones: 3, he: 2, festivo: 1 }), []);
  const errCuentas = useMemo(() => validarCuentas([{ concepto: 'Sueldos', cuenta: '501-01' }, { concepto: 'ISR retenido', cuenta: '211-01' }, { concepto: 'Finiquito', cuenta: '' }]), []);

  const idx = PASOS.indexOf(paso);
  const num = (v: string, set: (s: string) => void, label: string) => (
    <label className="block text-xs text-slate-600 dark:text-slate-300">
      {label}
      <input value={v} onChange={(e) => set(e.target.value)} className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
    </label>
  );
  const card = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs space-y-2';

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Nómina · ISR por tarifa (nunca % fijo)</h2>
      <div className="flex gap-0.5">
        {PASOS.map((p, i) => (
          <button key={p} onClick={() => setPaso(p)} className={`flex-1 h-1.5 rounded-full ${i <= idx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} aria-label={TITULOS[p]} />
        ))}
      </div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{TITULOS[paso]}</div>

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
          <div>Filtro periodicidad semanal: 6 empleados → entran <b>{semanales.map((e) => e.nombre).join(', ')}</b> (3).</div>
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

      <div className="flex justify-between">
        <button onClick={() => setPaso(PASOS[Math.max(0, idx - 1)])} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs">← Atrás</button>
        {idx < PASOS.length - 1 && <button onClick={() => setPaso(PASOS[idx + 1])} className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs">Siguiente →</button>}
      </div>
    </div>
  );
}
