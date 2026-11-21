import { describe, expect, it } from 'vitest';
import { arcPath, donutSlices } from '../src/utils/donut';
import type { Slice } from '../src/utils/reports';

const slice = (key: string, share: number, usdMinor = share * 10_000): Slice => ({ key, label: key, usdMinor, share });

describe('donutSlices', () => {
  it('reparte 360 grados según el porcentaje, empezando arriba', () => {
    const arcs = donutSlices([slice('a', 0.5), slice('b', 0.25), slice('c', 0.25)]);
    expect(arcs.map((a) => [a.startDeg, a.endDeg])).toEqual([[0, 180], [180, 270], [270, 360]]);
  });

  it('junta las porciones chicas en "Otros" al final', () => {
    const arcs = donutSlices([slice('a', 0.9), slice('b', 0.03), slice('c', 0.03), slice('d', 0.04)], { minShare: 0.05 });
    expect(arcs.map((a) => a.key)).toEqual(['a', 'others']);
    expect(arcs[1]!.label).toBe('Otros');
    expect(arcs[1]!.share).toBeCloseTo(0.1);
    expect(arcs[1]!.endDeg).toBeCloseTo(360);
  });

  it('una sola porción chica se queda como está', () => {
    const arcs = donutSlices([slice('a', 0.97), slice('b', 0.03)], { minShare: 0.05 });
    expect(arcs.map((a) => a.key)).toEqual(['a', 'b']);
  });

  it('un total 0 no dibuja nada', () => {
    expect(donutSlices([])).toEqual([]);
    expect(donutSlices([slice('a', 0, 0)])).toEqual([]);
  });

  it('una porción única ocupa el círculo completo', () => {
    const arcs = donutSlices([slice('a', 1)]);
    expect(arcs).toHaveLength(1);
    expect(arcs[0]!.endDeg - arcs[0]!.startDeg).toBe(360);
  });
});

describe('arcPath', () => {
  it('un cuarto de vuelta termina a la derecha del centro', () => {
    const d = arcPath(50, 50, 40, 0, 90);
    expect(d.startsWith('M 50 10')).toBe(true);
    expect(d).toContain('A 40 40 0 0 1 90 50');
  });
  it('más de media vuelta marca el arco grande', () => {
    expect(arcPath(50, 50, 40, 0, 270)).toContain('A 40 40 0 1 1');
  });
  it('el círculo completo se recorta para no degenerar', () => {
    const d = arcPath(50, 50, 40, 0, 360);
    expect(d).toContain('A 40 40 0 1 1');
    expect(d).not.toContain('NaN');
  });
});
