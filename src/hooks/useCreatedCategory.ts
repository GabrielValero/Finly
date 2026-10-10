import { useEffect, useRef } from 'react';
import { useUi } from '../store/ui';

interface Created {
  id: string;
  kind: 'income' | 'expense';
  parentId: string | null;
}

/**
 * Cuando el usuario crea una categoría desde un selector (formulario abierto con `pick=1`) y vuelve,
 * esta pantalla recibe la categoría recién creada para elegirla sola.
 */
export function useCreatedCategory(categories: readonly Created[], onCreated: (category: Created) => void) {
  const createdId = useUi((s) => s.createdCategoryId);
  const clear = useUi((s) => s.setCreatedCategoryId);
  const handler = useRef(onCreated);
  handler.current = onCreated;
  useEffect(() => {
    if (!createdId) return;
    const created = categories.find((c) => c.id === createdId);
    if (!created) return;
    handler.current(created);
    clear(null);
  }, [createdId, categories, clear]);
}
