// Tipos del módulo DIOT (ContaLink) — espejo del scenario engine del lab.
export type DiotMode = 'piloto' | 'practica' | 'examen';
export type TipoOperacion = 1 | 2 | 3 | 4 | 5;
export type TasaIVA = '16' | '8' | '0' | 'exento';
export type OrigenOperacion = 'Factura' | 'Nota de crédito' | 'Póliza';

export interface EmpresaDIOT {
  nombre: string;
  regimen: string;
  pais: string;
  nacionalidad: 'Nacional' | 'Extranjero';
  tipoContraparte: 'PM' | 'PF';
  rfc?: string;
}

export interface OperacionDIOT {
  id: number;
  rfc: string;
  nombre: string;
  pais: string;
  nacionalidad: 'Nacional' | 'Extranjero';
  tipoContraparte: 'PM' | 'PF';
  tipo: TipoOperacion;
  tasa: TasaIVA;
  monto: number;
  iva: number;
  origen: OrigenOperacion;
  folio: string;
  fecha: string;
}

export type CampoOperacion = 'rfc' | 'monto' | 'iva' | 'tipo' | 'tasa' | 'nacionalidad';

export interface ErrorInyectado {
  operacionId: number;
  campo: CampoOperacion;
  error: string;
  pista: string;
  valorIncorrecto: unknown;
  valorCorrecto: unknown;
}

export interface ScenarioDIOT {
  empresa: EmpresaDIOT;
  operaciones: OperacionDIOT[];
  erroresInyectados: ErrorInyectado[];
  cantErrores: number;
}

export interface PasoTutorial {
  selector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  titulo: string;
  descripcion: string;
  teoria: string;
  referencia: string;
  accionLabel: string;
}

/** RNG inyectable (default Math.random; tests pasan seed determinista). */
export type Rng = () => number;
