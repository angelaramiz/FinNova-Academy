import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// P1/P2/P3 cableados en la UI: la fuente de cada Sim debe invocar al motor
// correspondiente y rendir sus controles. (El smoke de render vive en el
// build de vite + deploy; aquí se audita el cableado en fuente porque el
// SSR mezcla dos copias de React en este monorepo.)
import NominaSim from '../alumnos/src/sims/NominaSim';
import ConciliacionSim from '../alumnos/src/sims/ConciliacionSim';
import PolizaSim from '../alumnos/src/sims/PolizaSim';

const NOM = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'NominaSim.tsx'), 'utf8');
const CON = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'ConciliacionSim.tsx'), 'utf8');
const DIO = readFileSync(join(__dirname, '..', 'alumnos', 'public', 'sims', 'diot.html'), 'utf8');
const POL = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'PolizaSim.tsx'), 'utf8');

describe('P1/P2/P3 cableado UI', () => {
  it('P2 nómina: preview invoca vistaPreviaCFDI y confirma timbrado real', () => {
    expect(NOM).toContain('vistaPreviaCFDI({');
    expect(NOM).toContain('abrirPreview');
    expect(NOM).toContain('Confirmar timbrado');
    expect(NOM).toContain('Cadena original');
    expect(NOM).toContain('Sello digital');
    expect(NOM).toContain('confirmarTimbrado');
  });
  it('P2 DIOT: abrirPreview llena ids que existen en el modal', () => {
    for (const id of ['previewModal', 'prevOps', 'prevBase', 'prevIva', 'prevFolio', 'prevSello']) {
      expect(DIO).toContain(`id="${id}"`);
      expect(DIO).toContain(`'${id}'`);
    }
  });
  it('P3 conciliación: el Sim consume CASO_REAL_FILAS + resolverCasoReal', () => {
    expect(CON).toContain('CASO_REAL_FILAS');
    expect(CON).toContain('resolverCasoReal(lista)');
    expect(CON).toContain('Resolver Caso Real');
    expect(CON).toContain('value="corregir"');
    expect(CON).toContain('value="transito"');
    expect(CON).toContain('value="eliminar"');
  });
  it('los Sims importan sus motores (sin pantallas huecas)', () => {
    expect(typeof NominaSim).toBe('function');
    expect(typeof ConciliacionSim).toBe('function');
    expect(NOM).toContain("from './nominaEngine'");
    expect(CON).toContain("from './conciliacionEngine'");
  });
  it('sidebar retráctil: estado persistido + clase collapsed + botón toggle', () => {
    const SHELL = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'ContalinkShell.tsx'), 'utf8');
    expect(SHELL).toContain('contalink_sidebar');
    expect(SHELL).toContain('colapsado');
    expect(SHELL).toContain('clk-toggle');
    expect(SHELL).toContain('.clk-sidebar.collapsed');
    expect(SHELL).toContain('width: 60px');
    expect(SHELL).toContain('Retraer menú');
    expect(SHELL).toContain('Expandir menú');
  });
  it('pólizas: editor multilínea estilo captura Contalink + cuadre + guardar', () => {
    expect(typeof PolizaSim).toBe('function');
    for (const s of ['Agregar asiento', 'Eliminar', 'Guardar', 'Cancelar', 'Descargar XML', 'Descargar PDF', 'Notas Adicionales', 'CUENTA CONTABLE', 'DEBE', 'HABER']) {
      expect(POL).toContain(s);
    }
    expect(POL).toContain('/api/sim/polizas/generar');
    expect(POL).toContain('/api/sim/polizas/guardar');
    expect(POL).toContain("taskType: 'poliza_practica'");
    expect(POL).toContain('reportarSim(');
    expect(POL).toContain('1317D7E0-38AC-489F-9082-E75019D8975E');
  });
  it('pólizas: buscador por nombre con inserción y colisión 601.83', () => {
    expect(POL).toContain('buscarCuentasFront');
    expect(POL).toContain('[Usar]');
    expect(POL).toContain('registra');
    expect(POL).toContain('Si buscas renta deducible');
    expect(POL).toContain('fiscal');
  });
  it('pólizas: tour + shell + ruteo al 5º submódulo', () => {
    const TOUR = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'toursContalink.ts'), 'utf8');
    const SHELL = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'ContalinkShell.tsx'), 'utf8');
    const MAPA = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'simsContalink.ts'), 'utf8');
    for (const ancla of ['poliza-hero', 'poliza-doc', 'poliza-concilia', 'poliza-editor', 'poliza-balanza', 'poliza-guardar']) {
      expect(POL).toContain(`data-tour="${ancla}"`);
      expect(TOUR).toContain(ancla);
    }
    expect(TOUR).toContain('TOUR_POLIZA');
    expect(SHELL).toContain("modulo === 'poliza'");
    expect(SHELL).toContain('PolizaSim');
    expect(MAPA).toContain("'mod-polizas': 'sim-poliza'");
    expect(MAPA).toContain('poliza_practica');
  });
});
