import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { formatMoney } from '../utils/money';
import { LIST_KIND_LABEL, limitStatus, resolveListRate, summarizeList, type LimitState } from '../utils/shopping';
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

  const rows = useMemo(() => {
    const toRow = (l: (typeof lists)[number]): ListRowVm => {
      const own = items.filter((i) => i.listId === l.id);
      const rate = resolveListRate(l, rates);
      const totals = summarizeList(own, rate?.rateScaled ?? null);
      const limit = limitStatus(totals.totalUsd, l.limitMinor);
      const bought = own.length - totals.pendingCount;
      const subtitle = l.completedAt
        ? `Completada · ${bought} ${bought === 1 ? 'producto' : 'productos'}`
        : totals.pendingCount === 0
          ? 'Sin productos'
          : `${totals.pendingCount} ${totals.pendingCount === 1 ? 'pendiente' : 'pendientes'}${l.kind === 'market' ? ` · ${totals.checkedCount} en el carrito` : ''}`;
      return {
        id: l.id,
        title: l.name,
        kindLabel: LIST_KIND_LABEL[l.kind],
        subtitle,
        amount: l.completedAt ? '' : formatMoney(totals.totalUsd, 'USD'),
        progress: Math.min(limit.ratio, 1),
        state: limit.state,
        showBar: !l.completedAt && limit.state !== 'none',
      };
    };
    return {
      open: lists.filter((l) => !l.completedAt).map(toRow),
      done: lists.filter((l) => l.completedAt).map(toRow),
    };
  }, [lists, items, rates]);

  return {
    ...rows,
    isEmpty: lists.length === 0,
    openList: (id: string) => router.push({ pathname: '/list/[id]', params: { id } }),
    newList: () => router.push({ pathname: '/list-form/[id]', params: { id: 'new' } }),
  };
}
