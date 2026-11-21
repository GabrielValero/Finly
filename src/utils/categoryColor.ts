import { isHex } from './color';

/** Colores de categoría del diseño: azul, ámbar, verde azulado, morado, rosa. */
export const CATEGORY_PALETTE = ['#5B8DEF', '#F5B544', '#2DD4BF', '#A78BFA', '#F472B6'] as const;

/** Colores que se pueden elegir en el formulario de categoría: la paleta base más tres de apoyo. */
export const CATEGORY_SWATCHES = [...CATEGORY_PALETTE, '#4ADE80', '#FB923C', '#22D3EE'] as const;

/** Color seleccionado al abrir el formulario: el guardado, el estable de la categoría, o el primero si es nueva. */
export function swatchFor(color: string | null, categoryId: string | null): string {
  return resolveCategoryColor(color, categoryId) ?? CATEGORY_SWATCHES[0];
}

/** Valor que se escribe en la columna `color`: solo hex válidos; cualquier otra cosa queda en null. */
export function colorToSave(color: string | null): string | null {
  return color !== null && isHex(color) ? color : null;
}

/**
 * Color con el que se pinta una categoría. Si no tiene uno guardado (aún no se puede elegir),
 * toma uno de la paleta de forma estable según su id.
 */
export function resolveCategoryColor(color: string | null, categoryId: string | null): string | null {
  if (color && isHex(color)) return color;
  if (!categoryId) return null;
  let h = 0;
  for (let i = 0; i < categoryId.length; i++) h = (h * 31 + categoryId.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[h % CATEGORY_PALETTE.length]!;
}
