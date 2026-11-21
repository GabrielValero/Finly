/** Camino SVG suave (Catmull-Rom → Bézier) para una serie, escalada a `width` x `height` con `pad` de margen vertical. */
export function trendPath(values: readonly number[], width: number, height: number, pad = 2): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const inner = height - pad * 2;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: span === 0 ? height / 2 : pad + inner - ((v - min) / span) * inner,
  }));
  const r = (n: number) => Math.round(n * 100) / 100;
  let d = `M ${r(pts[0]!.x)} ${r(pts[0]!.y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1y = Math.min(Math.max(p1.y + (p2.y - p0.y) / 6, pad), height - pad);
    const c2y = Math.min(Math.max(p2.y - (p3.y - p1.y) / 6, pad), height - pad);
    d += ` C ${r(p1.x + (p2.x - p0.x) / 6)} ${r(c1y)} ${r(p2.x - (p3.x - p1.x) / 6)} ${r(c2y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  return d;
}
