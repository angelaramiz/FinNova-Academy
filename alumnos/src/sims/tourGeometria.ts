// tourGeometria — el overlay del tour usa `fixed`, pero vive dentro de la
// ventana del escritorio (ancestro con transform) donde `fixed` se vuelve
// relativo al ancestro. Por eso el anillo se desplazaba (+62/+99 en Chrome).
// Fix: medir el target en viewport y restar el origen del contenedor raíz.
export interface RectLike { left: number; top: number; width: number; height: number }
export interface Origen { left: number; top: number }
export interface Geometria { l: number; t: number; w: number; h: number }

const PAD = 10;

export function geometriaSpotlight(target: RectLike, origen: Origen): Geometria {
  return {
    l: Math.max(6, target.left - origen.left - PAD),
    t: Math.max(6, target.top - origen.top - PAD),
    w: target.width + PAD * 2,
    h: target.height + PAD * 2,
  };
}
