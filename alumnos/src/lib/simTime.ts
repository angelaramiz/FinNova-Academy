// ─── Reloj único de simulación ─────────────────────────────────
// Todas las apps del simulador viven en julio 2026 (hoy sim = 06-jul-2026, lunes).
// Usar estas funciones en lugar de new Date() para fechas del mundo simulado.

export const SIM_YEAR = 2026;
export const SIM_MONTH = 6; // 0-based: julio
export const SIM_DAY = 8;   // miércoles 8 de julio de 2026 (semana 2, día 3 del plan)

export const SIM_DATE = new Date(SIM_YEAR, SIM_MONTH, SIM_DAY);

export function simToday(offsetDays = 0): Date {
  return new Date(SIM_YEAR, SIM_MONTH, SIM_DAY - offsetDays);
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// "03-jul" (estilo DataOps)
export function simShort(offsetDays = 0): string {
  const d = simToday(offsetDays);
  return `${String(d.getDate()).padStart(2, '0')}-${MESES[d.getMonth()]}`;
}

// "03/07" (estilo tabla de Airflow)
export function simSlash(offsetDays = 0): string {
  const d = simToday(offsetDays);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// "2026-07-06" (estilo BI / raw_ventas)
export function simIso(offsetDays = 0): string {
  const d = simToday(offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Header del escritorio: "lun 06 jul · 10:42" (fecha simulada, hora real)
export function simHeaderNow(): string {
  const now = new Date();
  const d = SIM_DATE;
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${hh}:${mi}`;
}