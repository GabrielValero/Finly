import { isHex } from './color';

/** Colores de categoría del diseño: azul, ámbar, verde azulado, morado, rosa. */
export const CATEGORY_PALETTE = ['#5B8DEF', '#F5B544', '#2DD4BF', '#A78BFA', '#F472B6'] as const;

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
