import type { Slice } from './reports';

export interface DonutArc {
  key: string;
  label: string;
  /** 0..1 del total. */
  share: number;
  /** Grados desde las 12 en punto, en sentido horario. */
  startDeg: number;
  endDeg: number;
}

interface Options {
  /** Las porciones menores a esto se juntan en "Otros" (solo si son al menos dos). */
  minShare?: number;
}

/** Geometría de la dona: ángulos a partir de los porcentajes. Total 0 → sin arcos. */
export function donutSlices(slices: readonly Slice[], { minShare = 0.04 }: Options = {}): DonutArc[] {
  const live = slices.filter((s) => s.share > 0);
  if (live.length === 0) return [];
  const big = live.filter((s) => s.share >= minShare);
  const small = live.filter((s) => s.share < minShare);
  const parts: { key: string; label: string; share: number }[] =
    small.length >= 2
      ? [...big, { key: 'others', label: 'Otros', share: small.reduce((sum, s) => sum + s.share, 0) }]
      : [...big, ...small];
  const total = parts.reduce((sum, p) => sum + p.share, 0);
  let cursor = 0;
  return parts.map((p) => {
    const startDeg = cursor;
    cursor += (p.share / total) * 360;
    return { key: p.key, label: p.label, share: p.share, startDeg, endDeg: cursor };
  });
}

const FULL_TURN_CAP = 359.99;

/** Trazo SVG de un arco de círculo (para dibujarlo con `stroke`, sin relleno). */
export function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const end = Math.min(endDeg, startDeg + FULL_TURN_CAP);
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [round(cx + r * Math.cos(rad)), round(cy + r * Math.sin(rad))] as const;
  };
  const [x0, y0] = point(startDeg);
  const [x1, y1] = point(end);
  const large = end - startDeg > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
