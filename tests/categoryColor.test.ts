import { describe, expect, it } from 'vitest';
import { CATEGORY_PALETTE, resolveCategoryColor } from '../src/utils/categoryColor';
import { isHex } from '../src/utils/color';

describe('resolveCategoryColor', () => {
  it('respeta el color guardado si es válido', () => {
    expect(resolveCategoryColor('#112233', 'x')).toBe('#112233');
  });
  it('sin color elige uno de la paleta, estable por id', () => {
    const a = resolveCategoryColor(null, 'cat-1');
    expect(CATEGORY_PALETTE).toContain(a);
    expect(resolveCategoryColor(null, 'cat-1')).toBe(a);
  });
  it('un color inválido cae a la paleta', () => {
    expect(isHex(resolveCategoryColor('rojo', 'z')!)).toBe(true);
  });
  it('sin categoría devuelve null', () => {
    expect(resolveCategoryColor(null, null)).toBeNull();
  });
});
