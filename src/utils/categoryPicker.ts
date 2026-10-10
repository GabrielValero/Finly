export interface PickerCategory {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
}

export type PickerRow =
  | { type: 'parent'; id: string; name: string; icon: string; expandable: boolean; expanded: boolean; selected: boolean; disabled: boolean }
  | { type: 'child'; id: string; name: string; icon: string; selected: boolean; disabled: boolean }
  /** Fila "+ Nueva subcategoría" al final de un grupo abierto. */
  | { type: 'addSub'; parentId: string; parentName: string };

interface Options {
  query: string;
  /** Padres abiertos a mano (con una búsqueda activa se abren solos los que tienen coincidencias). */
  expanded: ReadonlySet<string>;
  selectedId: string | null;
  disabledIds: ReadonlySet<string>;
}

/** Minúsculas y sin tildes, para que "ali" encuentre "Alimentación". */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const byName = (a: PickerCategory, b: PickerCategory) => a.name.localeCompare(b.name, 'es');

/**
 * Lista plana y ordenada para el selector de categorías (2 niveles).
 * - Sin búsqueda: padres con las subcategorías de los abiertos.
 * - Con búsqueda: un padre aparece si coincide él (con todas sus hijas) o alguna hija (solo las que coinciden).
 */
export function buildPickerRows(categories: readonly PickerCategory[], { query, expanded, selectedId, disabledIds }: Options): PickerRow[] {
  const q = normalizeSearch(query);
  const searching = q.length > 0;
  const matches = (c: PickerCategory) => normalizeSearch(c.name).includes(q);
  const rows: PickerRow[] = [];

  for (const parent of categories.filter((c) => c.parentId === null).sort(byName)) {
    const children = categories.filter((c) => c.parentId === parent.id).sort(byName);
    const parentMatches = !searching || matches(parent);
    const shownChildren = searching ? (parentMatches ? children : children.filter(matches)) : children;
    if (searching && !parentMatches && shownChildren.length === 0) continue;

    const open = searching ? shownChildren.length > 0 : expanded.has(parent.id);
    rows.push({
      type: 'parent',
      id: parent.id,
      name: parent.name,
      icon: parent.icon,
      expandable: children.length > 0,
      expanded: open && children.length > 0,
      selected: parent.id === selectedId,
      disabled: disabledIds.has(parent.id),
    });
    if (!open) continue;
    for (const c of shownChildren) {
      rows.push({ type: 'child', id: c.id, name: c.name, icon: c.icon, selected: c.id === selectedId, disabled: disabledIds.has(c.id) });
    }
    if (!searching) rows.push({ type: 'addSub', parentId: parent.id, parentName: parent.name });
  }
  return rows;
}
