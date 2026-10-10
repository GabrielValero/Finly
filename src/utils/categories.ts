export type CategoryKind = 'income' | 'expense';

export interface CategoryNode {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
}

export interface CategoryDraft {
  /** null al crear. */
  id: string | null;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
}

const MAX_NAME = 40;

/**
 * Reglas de dominio de una categoría. Devuelve el primer problema o null si es válida.
 * - Máximo 2 niveles (un padre no puede tener padre).
 * - La subcategoría hereda el tipo del padre.
 * - Nombre único entre hermanas.
 * - Una categoría con subcategorías no puede convertirse en subcategoría ni cambiar de tipo.
 */
export function validateCategory(draft: CategoryDraft, all: readonly CategoryNode[]): string | null {
  const name = draft.name.trim();
  if (name.length === 0) return 'Ponle un nombre';
  if (name.length > MAX_NAME) return `Máximo ${MAX_NAME} caracteres`;

  const hasChildren = draft.id !== null && all.some((c) => c.parentId === draft.id);
  const existing = draft.id === null ? null : (all.find((c) => c.id === draft.id) ?? null);

  if (draft.parentId !== null) {
    if (draft.parentId === draft.id) return 'Una categoría no puede estar dentro de sí misma';
    const parent = all.find((c) => c.id === draft.parentId);
    if (!parent) return 'La categoría padre no existe';
    if (parent.parentId !== null) return 'Solo se permiten 2 niveles';
    if (parent.kind !== draft.kind) return 'La subcategoría debe ser del mismo tipo que su padre';
    if (hasChildren) return 'Tiene subcategorías: no puede quedar dentro de otra';
  }
  if (existing && hasChildren && existing.kind !== draft.kind) {
    return 'Tiene subcategorías: cámbialas antes de cambiar el tipo';
  }

  const lower = name.toLowerCase();
  const clash = all.some((c) => c.id !== draft.id && c.parentId === draft.parentId && c.kind === draft.kind && c.name.trim().toLowerCase() === lower);
  if (clash) return 'Ya existe una con ese nombre';
  return null;
}

export interface CategoryTreeItem<T extends CategoryNode> {
  category: T;
  /** Movimientos propios + los de sus subcategorías. */
  count: number;
  children: { category: T; count: number }[];
}

/** Agrupa en padres con sus hijas; el conteo del padre incluye el de sus hijas. */
export function buildCategoryTree<T extends CategoryNode>(rows: readonly T[], counts: ReadonlyMap<string, number>): CategoryTreeItem<T>[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, 'es');
  return rows
    .filter((c) => c.parentId === null)
    .sort(byName)
    .map((parent) => {
      const children = rows
        .filter((c) => c.parentId === parent.id)
        .sort(byName)
        .map((category) => ({ category, count: counts.get(category.id) ?? 0 }));
      const count = (counts.get(parent.id) ?? 0) + children.reduce((sum, c) => sum + c.count, 0);
      return { category: parent, count, children };
    });
}

/** "Mercado › Víveres" o solo el nombre si no tiene padre. */
export function categoryPath(name: string | null, parentName: string | null): string | null {
  if (!name) return null;
  return parentName ? `${parentName} › ${name}` : name;
}

/** Una categoría queda fuera de reportes si ella o su padre lo marcan. */
export function isExcluded(own: boolean | null, parent: boolean | null): boolean {
  return own === true || parent === true;
}
