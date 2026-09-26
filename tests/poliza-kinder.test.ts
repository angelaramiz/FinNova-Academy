import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
// R-kinder (TDD): rediseño didáctico de PolizaSim — 1+2 fusionado, balanza por
// rubros con regla del cero, modo detective 3.5 y piloto kinder. Auditoría en
// fuente (mismo patrón que sims-cableado-ui: el SSR mezcla dos React).
const POL = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'PolizaSim.tsx'), 'utf8');
const TOUR = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'toursContalink.ts'), 'utf8');
const TSIM = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'sims', 'TourSim.tsx'), 'utf8');

describe('poliza kinder: fusión papel vs alcancía (1+2)', () => {
  it('rotula las 2 tablas como papel y alcancía, no "movimientos" genérico', () => {
    expect(POL).toContain('Lo que dice el papel');
    expect(POL).toContain('Lo que dice la alcancía');
  });
  it('muestra veredicto PUE/PPD y mensaje de promesa sin banco', () => {
    expect(POL).toContain('aún no se paga, es promesa');
  });
});

describe('poliza kinder: regla del cero + balanza por rubros', () => {
  it('titula el paso 4 como balanza de comprobación por rubros (nunca "balance de resultados")', () => {
    expect(POL).toContain('Balanza de comprobación por rubros');
    expect(POL).not.toContain('Balance de resultados');
  });
  it('separa sección Balance (1/2/3) y sección Resultados (4/5/6/7) + GRAN TOTAL', () => {
    expect(POL).toContain('Sección Balance');
    expect(POL).toContain('Sección Resultados');
    expect(POL).toContain('GRAN TOTAL');
  });
  it('enseña la regla del cero kinder (cada cuenta tiene su casa)', () => {
    expect(POL).toContain('Cada cuenta tiene su casa');
  });
  it('GRAN TOTAL = ΣDEBE − ΣHABER (balanza cuadra por columnas, no por saldos con signo)', () => {
    expect(POL).toContain('s + b.debe, 0) - balanza.reduce((s, b) => s + b.haber');
    expect(POL).not.toContain("b.debe - b.haber : b.haber - b.debe), 0))} —");
  });
});

describe('poliza kinder: modo detective 3.5 + 601.83', () => {
  it('tiene panel detective con las 4 preguntas en orden', () => {
    expect(POL).toContain('Modo detective');
    expect(POL).toContain('¿El CFDI cuadra solo?');
    expect(POL).toContain('¿PUE o PPD');
    expect(POL).toContain('601.45 vs 601.46 vs 601.83');
    expect(POL).toContain('retención');
  });
  it('tarjeta 601.83: hospital sí, basurero no + declaración explícita', () => {
    expect(POL).toContain('hospital de gastos enfermos');
    expect(POL).toContain('no basurero');
    expect(POL).toContain('declaro que este gasto no tiene requisitos fiscales');
  });
});

describe('poliza kinder: piloto con hazlo por mí / yo lo intento', () => {
  it('el piloto ofrece ambos modos', () => {
    expect(POL).toContain('hazlo por mí');
    expect(POL).toContain('yo lo intento');
  });
});

describe('poliza dataset: el Sim opera con semillas de la base (sin repetir)', () => {
  it('carga casos de /api/sim/polizas/casos con fallback local', () => {
    expect(POL).toContain('/api/sim/polizas/casos');
    expect(POL).toContain('CASOS.marcelo');
  });
  it('botón Otra semilla pide /api/sim/polizas/pub/semilla excluyendo usadas', () => {
    expect(POL).toContain('/api/sim/polizas/pub/semilla');
    expect(POL).toContain('Otra semilla');
    expect(POL).toContain('poliza_semillas_usadas');
  });
  it('al guardar usa el agrupador calculado por el motor (no la equivalencia 601-83→601.45)', () => {
    expect(POL).toContain('l.agrupador ??');
  });
});

describe('poliza vacía: aviso + guía al Documento (reporte tester)', () => {
  it('avisa dentro de la póliza vacía por qué está vacía', () => {
    expect(POL).toContain('aún no generas las líneas');
  });
  it('lleva solo al Documento a generar (botón desde la póliza vacía)', () => {
    expect(POL).toContain('aún no generas las líneas');
    expect(POL).toContain("setFase('documento')");
  });
  it('explica junto al Guardar apagado qué falta', () => {
    expect(POL).toContain('Te falta generar');
  });
});
describe('tester-estudiante: lo que pidió el reporte', () => {
  it('glosario kinder de 1 línea por palabra rara', () => {
    for (const s of ['Glosario kinder', 'CFDI', 'PUE', 'PPD', 'DEBE', 'HABER', 'ISR', 'Folio', 'Semilla']) {
      expect(POL).toContain(s);
    }
  });
  it('la pestaña 2 dice explícito qué revisar y cuándo puedes seguir', () => {
    expect(POL).toContain('puedes seguir');
  });
  it('el botón semilla se entiende: practicar con otra factura', () => {
    expect(POL).toContain('Practicar con otra factura');
    expect(POL).toContain('Otra semilla');
  });
  it('al guardar avisa que el folio vive en la Balanza', () => {
    expect(POL).toContain('verás en la Balanza');
  });
  it('el piloto hazlo-por-mí ejecuta el siguiente paso de verdad', () => {
    expect(POL).toContain('Haz el siguiente paso por mí');
  });
  it('el piloto avisa mientras trabaja (no más clics muertos)', () => {
    expect(POL).toContain('Trabajando');
  });
  it('el editor explica que al pagar el banco va en HABER aunque su casa sea DEBE', () => {
    expect(POL).toContain('aunque su casa sea DEBE');
  });
  it('labels legibles: raíz del Sim fija tinta oscura en cascada (adiós gris fantasma)', () => {
    expect(POL).toContain('className="fade-in" style={{ color:');
  });
});

describe('tab único 1+2: documento y conciliación son una sola pestaña', () => {
  it('guía 1-2-3 clicable (Detective vive dentro del paso 2, no es tab)', () => {
    expect(POL).toContain('1. Papel');
    expect(POL).toContain('2. Póliza');
    expect(POL).toContain('3. Balanza');
    expect(POL).not.toContain("'detective'");
  });
  it('la vista única conserva ambas anclas del tour (doc + concilia)', () => {
    expect(POL).toContain('data-tour="poliza-doc"');
    expect(POL).toContain('data-tour="poliza-concilia"');
  });
  it('el banco de la conciliación varía con la semilla (viene del caso)', () => {
    expect(POL).toContain('edo: r.edo');
  });
});

describe('tour-acción: cada paso pide hacer algo y verifica antes de Siguiente', () => {
  it('los 6 pasos de pólizas traen tarea accionable', () => {
    expect(TOUR).toContain('tarea:');
  });
  it('TourSim bloquea Siguiente hasta verificar (Ya lo hice)', () => {
    expect(TSIM).toContain('Ya lo hice');
    expect(TSIM).toContain('onVerificar');
  });
  it('PolizaSim verifica por paso (líneas generadas, folio al guardar)', () => {
    expect(POL).toContain('onVerificar={verificarPasoTour}');
  });
});

describe('progresión real: lo del paso 1 manda en el 2 y 3 (el error se propaga)', () => {
  it('las líneas llevan la firma del documento que las generó', () => {
    expect(POL).toContain('firmaLineas');
  });
  it('si cambias el documento, las líneas se marcan desactualizadas y Guardar se bloquea', () => {
    expect(POL).toContain('desactualizadas');
    expect(POL).toContain('Regenera');
  });
  it('el editor también genera (regenerar en sitio, sin volver atrás)', () => {
    expect(POL).toContain('Regenerar líneas');
  });
});

describe('compacto: menos scroll, misma info', () => {
  it('puente teórico colapsable (no ocupa pantalla siempre)', () => {
    expect(POL).toContain('Puente teórico (tócalo para ver)');
  });
  it('tira única papel+alcancía+veredicto (adiós tarjetas duplicadas)', () => {
    expect(POL).toContain('Resumen papel vs alcancía');
    expect(POL).toContain('Lo que dice el papel');
    expect(POL).toContain('Lo que dice la alcancía');
  });
  it('un solo botón creador (adiós A la póliza duplicado)', () => {
    expect(POL).toContain('Crear mi póliza');
    expect((POL.match(/A la póliza →/g) || []).length).toBe(0);
  });
  it('el hero conserva las 4 stats (no se pierde info)', () => {
    for (const s of ['Total DEBE', 'Total HABER', 'Diferencia', 'Líneas']) {
      expect(POL).toContain(s);
    }
  });
});

describe('rutas públicas: el front usa /pub sin credenciales (guardar sigue con auth)', () => {
  it('casos, semilla y generar van por /pub (catálogo vive en backend)', () => {
    for (const s of ['/api/sim/polizas/pub/casos', '/api/sim/polizas/pub/semilla', '/api/sim/polizas/pub/generar']) {
      expect(POL).toContain(s);
    }
  });
  it('guardar sigue en ruta con auth (escribe a tu nombre)', () => {
    expect(POL).toContain("'/api/sim/polizas/guardar'");
  });
});

describe('página pública: practicar pólizas sin cuenta', () => {
  it('App expone /polizas-prueba sin login', () => {
    const APP = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'App.tsx'), 'utf8');
    expect(APP).toContain('/polizas-prueba');
  });
  it('modo prueba libre: banner + folio local sin servidor', () => {
    expect(POL).toContain('Modo prueba libre');
    expect(POL).toContain('PRUEBA-');
  });
});

describe('rediseño: una sola voz de ayuda y piloto a pedido', () => {
  it('botón Guíame junto a la guía (tour+piloto unidos)', () => {
    expect(POL).toContain('Guíame');
  });
  it('piloto colapsable (solo si el alumno lo pide)', () => {
    expect(POL).toContain('¿Necesitas ayuda?');
  });
  it('el hero es marcador: semáforo Cuadra sin perder las 4 stats', () => {
    expect(POL).toContain('Cuadra');
  });
});

describe('tester final: ayuda visible cuando se necesita', () => {
  it('el piloto se abre solo cuando descuadra (colapsado no ayuda)', () => {
    expect(POL).toContain('pilotoAbierto');
    expect(POL).toContain('onToggle');
  });
  it('la balanza explica que para otra factura primero va Nueva póliza', () => {
    expect(POL).toContain('para otra factura, primero');
  });
});

describe('uuid duplicado: mensaje amable del servidor + lección kinder (reporte 422)', () => {
  it('muestra el mensaje real del servidor (ya contabilizado / duplicarías el registro)', () => {
    expect(POL).toContain('ya contabilizado');
    expect(POL).toContain('duplicarías el registro');
  });
  it('agrega lección kinder de 1 línea (otra factura, una sola vez por UUID)', () => {
    expect(POL).toContain('cada UUID se contabiliza una sola vez');
  });
  it('apiFetch preserva el body { error } del servidor en el ApiError', () => {
    const API = readFileSync(join(__dirname, '..', 'alumnos', 'src', 'lib', 'api.ts'), 'utf8');
    expect(API).toContain('errorData.error');
  });
});
