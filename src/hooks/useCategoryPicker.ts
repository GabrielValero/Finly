import { useCallback, useMemo, useState } from 'react';
import { buildPickerRows, type PickerCategory } from '../utils/categoryPicker';

interface Params {
  categories: readonly PickerCategory[];
  selectedId: string | null;
  disabledIds?: readonly string[];
}

/** Estado del selector de categorías: búsqueda y grupos abiertos (el de lo ya elegido arranca abierto). */
export function useCategoryPicker({ categories, selectedId, disabledIds = [] }: Params) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => {
    const parentId = categories.find((c) => c.id === selectedId)?.parentId ?? null;
    return new Set(parentId ? [parentId] : []);
  });

  const toggle = useCallback((id: string) => {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rows = useMemo(
    () => buildPickerRows(categories, { query, expanded, selectedId, disabledIds: new Set(disabledIds) }),
    [categories, query, expanded, selectedId, disabledIds],
  );

  return { query, setQuery, searching: query.trim().length > 0, rows, toggle };
}
