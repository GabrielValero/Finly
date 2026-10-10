import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { buildCategoryTree } from '../utils/categories';
import { useCategoryRows, useCategoryUsage } from './useData';

export type CategoryTab = 'expense' | 'income';

export interface CategoryRowVm {
  id: string;
  name: string;
  icon: string;
  subtitle: string;
  children: { id: string; name: string; count: number }[];
}

export function useCategoriesScreen() {
  const router = useRouter();
  const rows = useCategoryRows();
  const usage = useCategoryUsage();
  const [tab, setTab] = useState<CategoryTab>('expense');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo<CategoryRowVm[]>(() => {
    const tree = buildCategoryTree(rows.filter((c) => c.kind === tab), usage);
    return tree.map((t) => ({
      id: t.category.id,
      name: t.category.name,
      icon: t.category.icon,
      subtitle: t.category.excludeFromReports ? 'NO CUENTA EN REPORTES' : `${t.count} ${t.count === 1 ? 'MOVIMIENTO' : 'MOVIMIENTOS'}`,
      children: t.children.map((c) => ({ id: c.category.id, name: c.category.name, count: c.count })),
    }));
  }, [rows, usage, tab]);

  return {
    tab,
    setTab,
    items,
    expandedId,
    toggle: (id: string) => setExpandedId((cur) => (cur === id ? null : id)),
    openNew: () => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: tab } }),
    openNewSub: (parentId: string) => router.push({ pathname: '/category/[id]', params: { id: 'new', kind: tab, parentId } }),
    openEdit: (id: string) => router.push({ pathname: '/category/[id]', params: { id } }),
    back: () => router.back(),
  };
}
