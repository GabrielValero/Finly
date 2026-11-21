import { describe, expect, it } from 'vitest';
import { trendPath } from '../src/utils/trendPath';

describe('trendPath', () => {
  it('vacío o un punto no dibuja', () => {
    expect(trendPath([], 100, 40)).toBe('');
    expect(trendPath([5], 100, 40)).toBe('');
  });
  it('el mínimo va abajo-izquierda y el máximo arriba-derecha', () => {
    const d = trendPath([0, 10], 100, 40, 2);
    expect(d.startsWith('M 0 38')).toBe(true);
    expect(d.endsWith('100 2')).toBe(true);
  });
  it('serie plana queda a media altura', () => {
    expect(trendPath([3, 3, 3], 100, 40, 0)).toContain('M 0 20');
  });
});
