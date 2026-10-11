import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { finalizePurchase, insertItem, reopenList, setItemChecked } from '../data/repos/shopping';
import { usePreferences } from '../store/preferences';
import { allocateSpending, budgetKind, itemResolver, type BudgetTx } from '../utils/budget';
import { categoryPath, isExcluded } from '../utils/categories';
import { dayOf, formatMonthLabel, monthOf, toLocalIso } from '../utils/dates';
import { formatMoney, formatRate, usdToVes } from '../utils/money';
import { usdEquivalent } from '../utils/transactions';
import {
  LIST_KIND_LABEL,
  PRIORITY_LABEL,
  formatQuantity,
  lineUsd,
  limitStatus,
  planPurchase,
  resolveListRate,
  sortItems,
  summarizeList,
} from '../utils/shopping';
import { useAccountsWithBalance, useAllCategoryRows, useBudgetItems, useMonthTransactions } from './useData';
import { useRateRows, useShoppingItems, useShoppingList } from './useShopping';

export interface ProductRowVm {
  id: string;
  name: string;
  detail: string;
  amount: string;
  checked: boolean;
  purchased: boolean;
  badge: string | null;
}

function magnitude(tx: Parameters<typeof usdEquivalent>[0]): number {
  try {
    return Math.abs(usdEquivalent(tx));
  } catch {
    return 0;
  }
}

export function useListDetail(id: string) {
  const router = useRouter();
  const list = useShoppingList(id);
  const items = useShoppingItems(id);
  const rates = useRateRows();
  const categories = useAllCategoryRows();
  const accounts = useAccountsWithBalance();
  const lastAccountId = usePreferences((s) => s.lastAccountId);
  const setLastAccountId = usePreferences((s) => s.setLastAccountId);

  const month = monthOf(`${dayOf(toLocalIso(new Date()))}T00:00:00`);
  const budgetItems = useBudgetItems(month);
  const monthTxs = useMonthTransactions(month);

  const [purchaseIds, setPurchaseIds] = useState<string[] | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rate = list ? resolveListRate(list, rates) : null;
  const labelOf = (categoryId: string | null): string | null => {
    const c = categories.find((x) => x.id === categoryId);
    return c ? (categoryPath(c.name, categories.find((p) => p.id === c.parentId)?.name ?? null) ?? c.name) : null;
  };

  const view = useMemo(() => {
    if (!list) return null;
    const totals = summarizeList(items, rate?.rateScaled ?? null);
    // En mercado el límite se compara contra lo planeado (todo lo pendiente); el carrito se muestra aparte.
    const limit = limitStatus(totals.totalUsd, list.limitMinor);
    const rows: ProductRowVm[] = sortItems(items, list.kind).map((i) => {
      const usd = lineUsd(i, rate?.rateScaled ?? null);
      const qty = i.quantityMilli === 1000 ? '' : `${formatQuantity(i.quantityMilli)} × `;
      const price = i.priceMinor === null ? 'Sin precio' : `${qty}${formatMoney(i.priceMinor, i.priceCurrency)}`;
      const own = i.categoryId ? labelOf(i.categoryId) : null;
      return {
        id: i.id,
        name: i.name,
        detail: [price, own].filter(Boolean).join(' · '),
        amount: usd === null ? (i.priceMinor === null ? '—' : 'Sin tasa') : formatMoney(usd, 'USD'),
        checked: i.checked,
        purchased: i.purchasedAt !== null,
        badge: list.kind === 'wish' && i.priority && i.purchasedAt === null ? PRIORITY_LABEL[i.priority] : null,
      };
    });
    return { totals, limit, rows };
  }, [list, items, rate, categories]);

  // Cuánto queda del presupuesto del mes para la categoría de la lista (si está planificada).
  const budgetHint = useMemo(() => {
    if (!list?.categoryId || list.kind !== 'market') return null;
    const lite = budgetItems.map((b) => ({ id: b.id, categoryId: b.categoryId, kind: b.kind, plannedMinor: b.plannedMinor, isFixed: b.isFixed }));
    const planned = itemResolver(lite, categories)({ kind: 'expense', categoryId: list.categoryId });
    if (!planned) return null;
    const txs: BudgetTx[] = monthTxs.map((t) => ({
      kind: budgetKind(t) ?? 'transfer',
      usdMinor: magnitude(t),
      categoryId: t.categoryId,
      excluded: isExcluded(t.excludeFromReports, t.parentExcludeFromReports),
    }));
    const spent = allocateSpending(lite, txs, categories).byItem.get(planned.id) ?? 0;
    return `Presupuesto de ${labelOf(planned.categoryId) ?? 'la categoría'} en ${formatMonthLabel(month)}: te quedan ${formatMoney(Math.max(planned.plannedMinor - spent, 0), 'USD')} de ${formatMoney(planned.plannedMinor, 'USD')}`;
  }, [list, budgetItems, monthTxs, categories, month]);

  const purchase = useMemo(() => {
    if (!list || purchaseIds === null) return null;
    const chosen = items.filter((i) => purchaseIds.includes(i.id) && i.purchasedAt === null);
    const plan = planPurchase(chosen, list.categoryId, rate?.rateScaled ?? null);
    const account = accounts.find((a) => a.id === accountId) ?? null;
    const total = plan.groups.reduce((s, g) => s + g.usdMinor, 0);
    const skipped = plan.skipped.noPrice.length + plan.skipped.noRate.length + plan.skipped.noCategory.length;
    const needsRate = account?.currency === 'VES';
    return {
      plan,
      account,
      total,
      totalLabel: formatMoney(total, 'USD'),
      skipped,
      blocked: plan.groups.length === 0 || !account || (needsRate && rate === null),
      groups: plan.groups.map((g) => ({ key: g.categoryId, label: labelOf(g.categoryId) ?? 'Sin categoría', amount: formatMoney(g.usdMinor, 'USD'), count: g.itemIds.length })),
      inBs: account?.currency === 'VES' && rate ? formatMoney(usdToVes(total, rate.rateScaled), 'VES') : null,
      warnings: [
        plan.skipped.noPrice.length ? `${plan.skipped.noPrice.length} sin precio (quedan pendientes)` : null,
        plan.skipped.noRate.length ? `${plan.skipped.noRate.length} en Bs sin tasa disponible (quedan pendientes)` : null,
        plan.skipped.noCategory.length ? `${plan.skipped.noCategory.length} sin categoría (quedan pendientes)` : null,
        needsRate && rate === null ? 'No hay tasa para pagar desde una cuenta en Bs' : null,
      ].filter((w): w is string => w !== null),
    };
  }, [list, items, purchaseIds, accountId, accounts, rate, categories]);

  const openPurchase = (ids?: string[]) => {
    if (!list) return;
    const target = ids ?? items.filter((i) => i.checked && i.purchasedAt === null).map((i) => i.id);
    if (target.length === 0) {
      Alert.alert('Nada en el carrito', 'Marca los productos que vas metiendo al carrito para registrar la compra.');
      return;
    }
    setError(null);
    setAccountId((cur) => cur ?? (accounts.find((a) => a.id === lastAccountId) ?? accounts[0])?.id ?? null);
    setPurchaseIds(target);
  };

  const confirmPurchase = async () => {
    if (!list || !purchase?.account || purchase.blocked) return;
    setSaving(true);
    setError(null);
    try {
      await finalizePurchase({
        listId: list.id,
        itemIds: purchaseIds ?? [],
        accountId: purchase.account.id,
        accountCurrency: purchase.account.currency,
        rate,
        now: new Date(),
      });
      setLastAccountId(purchase.account.id);
      setPurchaseIds(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la compra');
    } finally {
      setSaving(false);
    }
  };

  return {
    notFound: list === null,
    title: list ? list.name.toUpperCase() : '',
    kind: list?.kind ?? 'market',
    kindLabel: list ? LIST_KIND_LABEL[list.kind] : '',
    completed: list?.completedAt != null,
    categoryLabel: list ? labelOf(list.categoryId) : null,
    totalLabel: formatMoney(view?.totals.totalUsd ?? 0, 'USD'),
    cartLabel: formatMoney(view?.totals.checkedUsd ?? 0, 'USD'),
    checkedCount: view?.totals.checkedCount ?? 0,
    pendingCount: view?.totals.pendingCount ?? 0,
    limit: list?.limitMinor ? { ...view!.limit, label: formatMoney(list.limitMinor, 'USD'), remaining: formatMoney(Math.abs(view!.limit.remainingMinor), 'USD') } : null,
    incomplete: view ? [view.totals.unpricedCount ? `${view.totals.unpricedCount} sin precio` : null, view.totals.unconvertedCount ? `${view.totals.unconvertedCount} en Bs sin tasa` : null].filter((x): x is string => x !== null).join(' · ') : '',
    rateLabel: rate ? `${formatRate(rate.rateScaled)} Bs · ${rate.source === 'bcv' ? 'BCV' : 'Manual'}` : 'Sin tasa',
    rows: view?.rows ?? [],
    budgetHint,
    purchase,
    accountOptions: accounts.map((a) => ({ value: a.id, label: a.name, hint: a.currency === 'USD' ? 'USD' : 'Bs' })),
    accountId,
    setAccountId,
    purchaseOpen: purchaseIds !== null,
    purchaseError: error,
    purchaseSaving: saving,
    openPurchase,
    closePurchase: () => setPurchaseIds(null),
    confirmPurchase,
    toggle: (itemId: string, checked: boolean) => void setItemChecked(itemId, checked, new Date()),
    quickAdd: (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      void insertItem(id, { name: clean, quantityMilli: 1000, priceMinor: null, priceCurrency: 'USD', categoryId: null, priority: null, note: null }, new Date());
    },
    reopen: () => void reopenList(id, new Date()),
    openItem: (itemId: string) => router.push({ pathname: '/list-item/[id]', params: { id: itemId, listId: id } }),
    addItem: () => router.push({ pathname: '/list-item/[id]', params: { id: 'new', listId: id } }),
    edit: () => router.push({ pathname: '/list-form/[id]', params: { id } }),
    back: () => router.back(),
  };
}
