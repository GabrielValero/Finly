import { isHex } from './color';

/** Colores de categoría del diseño: azul, ámbar, verde azulado, morado, rosa. */
export const CATEGORY_PALETTE = ['#5B8DEF', '#F5B544', '#2DD4BF', '#A78BFA', '#F472B6'] as const;

/** Colores que se pueden elegir en el formulario de categoría: la paleta base más tres de apoyo. */
export const CATEGORY_SWATCHES = [...CATEGORY_PALETTE, '#4ADE80', '#FB923C', '#22D3EE'] as const;

const SWATCH_NAMES: Record<string, string> = {
  '#5B8DEF': 'Azul',
  '#F5B544': 'Ámbar',
  '#2DD4BF': 'Verde azulado',
  '#A78BFA': 'Morado',
  '#F472B6': 'Rosa',
  '#4ADE80': 'Verde',
  '#FB923C': 'Naranja',
  '#22D3EE': 'Celeste',
};

/** Nombre en español de un color de la paleta (etiqueta de accesibilidad). */
export function swatchName(color: string): string {
  return SWATCH_NAMES[color] ?? color;
}

interface PreviewInput {
  /** Color que el usuario eligió explícitamente en esta sesión (null = no ha elegido). */
  picked: string | null;
  saved: string | null;
  id: string | null;
  /** Color ya resuelto del padre, si es subcategoría. */
  parentColor: string | null;
}

/** Color que se muestra en el formulario: lo elegido, lo guardado, el del padre o el estable por id. */
export function previewColor({ picked, saved, id, parentColor }: PreviewInput): string {
  if (picked !== null && isHex(picked)) return picked;
  if (saved !== null && isHex(saved)) return saved;
  if (parentColor !== null) return parentColor;
  return resolveCategoryColor(null, id ?? 'new')!;
}

/** El color es opt-in: sin elección explícita se conserva lo guardado (null = hereda / estable). */
export function colorForSave(picked: string | null, saved: string | null): string | null {
  return colorToSave(picked ?? saved);
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
