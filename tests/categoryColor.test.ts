import { describe, expect, it } from 'vitest';
import { CATEGORY_PALETTE, CATEGORY_SWATCHES, colorToSave, resolveCategoryColor, swatchFor } from '../src/utils/categoryColor';
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

describe('CATEGORY_SWATCHES', () => {
  it('ofrece 8 colores hex únicos que incluyen la paleta base', () => {
    expect(CATEGORY_SWATCHES).toHaveLength(8);
    expect(new Set(CATEGORY_SWATCHES).size).toBe(8);
    for (const c of CATEGORY_SWATCHES) expect(isHex(c)).toBe(true);
    for (const c of CATEGORY_PALETTE) expect(CATEGORY_SWATCHES).toContain(c);
  });
});

describe('swatchFor', () => {
  it('usa el color guardado si es válido', () => {
    expect(swatchFor('#5B8DEF', 'x')).toBe('#5B8DEF');
  });
  it('sin color guardado usa el color estable de la categoría', () => {
    expect(swatchFor(null, 'cat-1')).toBe(resolveCategoryColor(null, 'cat-1'));
  });
  it('una categoría nueva arranca con el primer color', () => {
    expect(swatchFor(null, null)).toBe(CATEGORY_SWATCHES[0]);
  });
});

describe('colorToSave', () => {
  it('guarda hex válidos y descarta el resto', () => {
    expect(colorToSave('#A78BFA')).toBe('#A78BFA');
    expect(colorToSave('rojo')).toBeNull();
    expect(colorToSave(null)).toBeNull();
  });
});
