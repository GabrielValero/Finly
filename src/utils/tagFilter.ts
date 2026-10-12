export interface TagLink {
  transactionId: string;
  tagId: string;
}

/** Movimientos que tienen la etiqueta. `tagId` null = sin filtro. Las transferencias no llevan etiquetas, así que quedan fuera. */
export function filterByTag<T extends { id: string }>(rows: readonly T[], links: readonly TagLink[], tagId: string | null): T[] {
  if (tagId === null) return [...rows];
  const ids = new Set(links.filter((l) => l.tagId === tagId).map((l) => l.transactionId));
  return rows.filter((r) => ids.has(r.id));
}

/** Etiquetas usadas por al menos uno de los movimientos dados, con su cantidad, ordenadas por nombre. */
export function tagsInUse<T extends { id: string; name: string }>(
  tags: readonly T[],
  links: readonly TagLink[],
  rowIds: ReadonlySet<string>,
): (T & { count: number })[] {
  const counts = new Map<string, number>();
  for (const l of links) if (rowIds.has(l.transactionId)) counts.set(l.tagId, (counts.get(l.tagId) ?? 0) + 1);
  return tags
    .filter((t) => counts.has(t.id))
    .map((t) => ({ ...t, count: counts.get(t.id)! }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
