import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { formatMoney } from '../utils/money';
import { LIST_KIND_LABEL, isHistoryList, limitStatus, resolveListRate, summarizeList, type LimitState } from '../utils/shopping';
import { useAllShoppingItems, useRateRows, useShoppingLists } from './useShopping';

export interface ListRowVm {
  id: string;
  title: string;
  kindLabel: string;
  subtitle: string;
  amount: string;
  progress: number;
  state: LimitState;
  showBar: boolean;
}

export function useListsScreen() {
  const router = useRouter();
  const lists = useShoppingLists();
  const items = useAllShoppingItems();
  const rates = useRateRows();
  const [historyOpen, setHistoryOpen] = useState(false);

  const rows = useMemo(() => {
    const toRow = (l: (typeof lists)[number]): ListRowVm => {
      const own = items.filter((i) => i.listId === l.id);
      const rate = resolveListRate(l, rates);
      const totals = summarizeList(own, rate?.rateScaled ?? null);
      const limit = limitStatus(totals.totalUsd, l.limitMinor);
      const bought = own.length - totals.pendingCount;
      const count = `${bought} ${bought === 1 ? 'producto' : 'productos'}`;
      const subtitle = l.completedAt
        ? `Completada · ${count}`
        : l.archivedAt
          ? `Archivada · ${own.length} ${own.length === 1 ? 'producto' : 'productos'}`
          : totals.pendingCount === 0
          ? 'Sin productos'
          : `${totals.pendingCount} ${totals.pendingCount === 1 ? 'pendiente' : 'pendientes'}${l.kind === 'market' ? ` · ${totals.checkedCount} en el carrito` : ''}`;
      return {
        id: l.id,
        title: l.name,
        kindLabel: LIST_KIND_LABEL[l.kind],
        subtitle,
        amount: isHistoryList(l) ? '' : formatMoney(totals.totalUsd, 'USD'),
        progress: Math.min(limit.ratio, 1),
        state: limit.state,
        showBar: !isHistoryList(l) && limit.state !== 'none',
      };
    };
    return {
      open: lists.filter((l) => !isHistoryList(l)).map(toRow),
      history: lists.filter(isHistoryList).map(toRow),
    };
  }, [lists, items, rates]);

  return {
    ...rows,
    isEmpty: lists.length === 0,
    historyOpen,
    toggleHistory: () => setHistoryOpen((v) => !v),
    openList: (id: string) => router.push({ pathname: '/list/[id]', params: { id } }),
    newList: () => router.push({ pathname: '/list-form/[id]', params: { id: 'new' } }),
  };
}
