import { describe, expect, it } from 'vitest';
import { CATEGORY_PALETTE, CATEGORY_SWATCHES, colorForSave, colorToSave, previewColor, resolveCategoryColor, swatchName } from '../src/utils/categoryColor';
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

describe('previewColor', () => {
  it('lo elegido gana sobre lo guardado y sobre el padre', () => {
    expect(previewColor({ picked: '#A78BFA', saved: '#5B8DEF', id: 'x', parentColor: '#F472B6' })).toBe('#A78BFA');
  });
  it('sin elegir usa el color guardado', () => {
    expect(previewColor({ picked: null, saved: '#5B8DEF', id: 'x', parentColor: null })).toBe('#5B8DEF');
  });
  it('una subcategoría sin color propio muestra el del padre', () => {
    expect(previewColor({ picked: null, saved: null, id: 's', parentColor: '#F472B6' })).toBe('#F472B6');
  });
  it('una categoría principal sin color usa el estable por id', () => {
    expect(previewColor({ picked: null, saved: null, id: 'cat-1', parentColor: null })).toBe(resolveCategoryColor(null, 'cat-1'));
  });
  it('una categoría nueva usa el color estable de reserva, no el primer color', () => {
    expect(previewColor({ picked: null, saved: null, id: null, parentColor: null })).toBe(resolveCategoryColor(null, 'new'));
  });
});

describe('colorForSave', () => {
  it('sin elegir conserva lo guardado (abrir y guardar no persiste nada nuevo)', () => {
    expect(colorForSave(null, null)).toBeNull();
    expect(colorForSave(null, '#5B8DEF')).toBe('#5B8DEF');
  });
  it('lo elegido reemplaza lo guardado', () => {
    expect(colorForSave('#A78BFA', '#5B8DEF')).toBe('#A78BFA');
  });
});

describe('colorToSave', () => {
  it('guarda hex válidos y descarta el resto', () => {
    expect(colorToSave('#A78BFA')).toBe('#A78BFA');
    expect(colorToSave('rojo')).toBeNull();
    expect(colorToSave(null)).toBeNull();
  });
});

describe('swatchName', () => {
  it('cada color de la paleta tiene un nombre en español', () => {
    for (const c of CATEGORY_SWATCHES) expect(swatchName(c).length).toBeGreaterThan(0);
    expect(swatchName('#5B8DEF')).toBe('Azul');
  });
});
