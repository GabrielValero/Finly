import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { categoryPath } from '../utils/categories';
import { resolveCategoryColor } from '../utils/categoryColor';
import { formatMoney } from '../utils/money';
import { LIST_KIND_LABEL, isHistoryList, limitStatus, resolveListRate, summarizeList, type LimitState } from '../utils/shopping';
import { limitCaption, listCardSubtitle } from '../utils/shoppingDisplay';
import { useAllCategoryRows } from './useData';
import { useAllShoppingItems, useRateRows, useShoppingLists } from './useShopping';

export interface ListRowVm {
  id: string;
  title: string;
  /** "Mercado · Comida". */
  kindLabel: string;
  /** Color de la categoría de la lista (dato). */
  color: string | null;
  icon: 'cart' | 'star';
  subtitle: string;
  amount: string;
  progress: number;
  state: LimitState;
  showBar: boolean;
  /** "Te quedan $X de $Y"; null sin límite. */
  limitText: string | null;
  dim: boolean;
}

export function useListsScreen() {
  const router = useRouter();
  const lists = useShoppingLists();
  const items = useAllShoppingItems();
  const rates = useRateRows();
  const categories = useAllCategoryRows();
  const [historyOpen, setHistoryOpen] = useState(false);

  const rows = useMemo(() => {
    const toRow = (l: (typeof lists)[number]): ListRowVm => {
      const own = items.filter((i) => i.listId === l.id);
      const rate = resolveListRate(l, rates);
      const totals = summarizeList(own, rate?.rateScaled ?? null);
      const limit = limitStatus(totals.totalUsd, l.limitMinor);
      const category = categories.find((c) => c.id === l.categoryId) ?? null;
      const parent = category ? (categories.find((p) => p.id === category.parentId) ?? null) : null;
      const categoryLabel = category ? (categoryPath(category.name, parent?.name ?? null) ?? category.name) : null;
      const history = isHistoryList(l);
      const showBar = !history && limit.state !== 'none';
      return {
        id: l.id,
        title: l.name,
        kindLabel: [LIST_KIND_LABEL[l.kind], categoryLabel].filter(Boolean).join(' · '),
        color: category ? resolveCategoryColor(category.color ?? parent?.color ?? null, category.id) : null,
        icon: l.kind === 'market' ? 'cart' : 'star',
        subtitle: listCardSubtitle({
          kind: l.kind,
          completed: l.completedAt !== null,
          archived: l.archivedAt !== null,
          pending: totals.pendingCount,
          checked: totals.checkedCount,
          total: own.length,
        }),
        amount: history ? '' : formatMoney(totals.totalUsd, 'USD'),
        progress: Math.min(limit.ratio, 1),
        state: limit.state,
        showBar,
        limitText: showBar && l.limitMinor ? limitCaption(limit.state, formatMoney(Math.abs(limit.remainingMinor), 'USD'), formatMoney(l.limitMinor, 'USD')) : null,
        dim: history,
      };
    };
    return {
      open: lists.filter((l) => !isHistoryList(l)).map(toRow),
      history: lists.filter(isHistoryList).map(toRow),
    };
  }, [lists, items, rates, categories]);

  return {
    ...rows,
    isEmpty: lists.length === 0,
    historyOpen,
    toggleHistory: () => setHistoryOpen((v) => !v),
    openList: (id: string) => router.push({ pathname: '/list/[id]', params: { id } }),
    newList: () => router.push({ pathname: '/list-form/[id]', params: { id: 'new' } }),
  };
}
