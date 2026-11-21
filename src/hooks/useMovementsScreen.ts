import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useUi } from '../store/ui';
import { allocateSpending, budgetKind, budgetTotals, type BudgetTx } from '../utils/budget';
import { isExcluded } from '../utils/categories';
import { resolveCategoryColor } from '../utils/categoryColor';
import { addMonths, dayOf, daysBetween, formatDayShort, formatMonthLabel, MONTH_NAMES, recentMonths, toLocalIso } from '../utils/dates';
import { formatMoney, formatRate, usdToVes } from '../utils/money';
import { balanceTrend, budgetPulse } from '../utils/monthInsights';
import {
  applyMovementFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  filterPeriod,
  toggleCategoryFilter,
  type DatePreset,
  type MovementFilters,
  type TypeFilter,
} from '../utils/movementFilters';
import { buildMovementGroups, safeUsd } from '../utils/movementRows';
import { monthTotals } from '../utils/summary';
import { tagsInUse } from '../utils/tagFilter';
import { topCategories } from '../utils/topCategories';
import { collapseTransfers } from '../utils/transfers';
import {
  useAccountsWithBalance,
  useAllCategoryRows,
  useBudgetItems,
  useCategoryRows,
  useLatestRate,
  useMonthTransactions,
  useRangeTagLinks,
  useRangeTransactions,
  useTags,
  type TxRow,
} from './useData';

export type { MovementGroupVm, MovementRowVm } from '../utils/movementRows';

const QUICK_TILES = 3;

const excludedOf = (list: readonly TxRow[]) => new Set(list.filter((r) => r.categoryId && isExcluded(r.excludeFromReports, r.parentExcludeFromReports)).map((r) => r.categoryId!));

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function usdMagnitude(tx: TxRow): number {
  return Math.abs(safeUsd(tx) ?? 0);
}

export function useMovementsScreen() {
  const router = useRouter();
  const month = useUi((s) => s.selectedMonth);
  const setSelectedMonth = useUi((s) => s.setSelectedMonth);
  const [filters, setFilters] = useState<MovementFilters>(EMPTY_FILTERS);
  /** La categoría activa se eligió con un atajo de la pantalla (no en la hoja): no cuenta en la insignia de "Filtros". */
  const [categoryFromTile, setCategoryFromTile] = useState(false);

  const { fromMonth, toMonth } = filterPeriod(filters.date, month);
  /** Movimientos del periodo del filtro de fecha (por defecto, el mes seleccionado). */
  const periodRows = useRangeTransactions(fromMonth, toMonth);
  const periodLinks = useRangeTagLinks(fromMonth, toMonth);
  /** Siempre el mes seleccionado: alimenta el balance, la tendencia, el presupuesto y los atajos. */
  const monthRows = useMonthTransactions(month);
  const accounts = useAccountsWithBalance();
  const allTags = useTags();
  const liveCategories = useCategoryRows();
  const allCategories = useAllCategoryRows();
  const budgetItems = useBudgetItems(month);
  const rate = useLatestRate();

  const today = dayOf(toLocalIso(new Date()));
  const currentMonth = today.slice(0, 7);

  const filtered = useMemo(() => applyMovementFilters(periodRows, filters, { month, tagLinks: periodLinks }), [periodRows, filters, month, periodLinks]);

  const update = useCallback((patch: Partial<MovementFilters>) => setFilters((f) => ({ ...f, ...patch })), []);

  return useMemo(() => {
    const monthExcluded = excludedOf(monthRows);
    const totals = monthTotals(monthRows, monthExcluded);
    const net = totals.incomeUsdMinor - totals.expenseUsdMinor;
    const [y, m] = month.split('-').map(Number) as [number, number];
    const monthDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const trendDays = month === currentMonth ? Number(today.slice(8, 10)) : month < currentMonth ? monthDays : 1;
    const monthName = MONTH_NAMES[m - 1]!.toLowerCase();
    const monthShort = MONTH_NAMES[m - 1]!.slice(0, 3).toUpperCase();

    const lite = budgetItems.map((i) => ({ id: i.id, categoryId: i.categoryId, kind: i.kind, plannedMinor: i.plannedMinor, isFixed: i.isFixed }));
    const budgetTxs: BudgetTx[] = monthRows.map((t) => ({
      kind: budgetKind(t) ?? 'transfer',
      usdMinor: usdMagnitude(t),
      categoryId: t.categoryId,
      excluded: isExcluded(t.excludeFromReports, t.parentExcludeFromReports),
    }));
    const { byItem } = allocateSpending(lite, budgetTxs, allCategories);
    const bt = budgetTotals(lite, byItem);
    const pulse = budgetPulse({ plannedMinor: bt.plannedExpense, spentMinor: bt.spentPlanned, today, month });

    const tiles = topCategories(monthRows, QUICK_TILES, monthExcluded).map((c) => ({ ...c, color: resolveCategoryColor(c.color, c.categoryId), selected: filters.categoryId === c.categoryId && !filters.subcategoryId }));
    const quickSelected = categoryFromTile && tiles.some((t) => t.selected);
    const filterBadge = Math.max(countActiveFilters(filters) - (quickSelected ? 1 : 0), 0);

    const staleDays = rate ? daysBetween(rate.validFrom, today) : null;
    const banner =
      rate === null
        ? 'Define la tasa del día'
        : staleDays !== null && staleDays >= 1
          ? staleDays === 1 ? 'Tasa de ayer' : `Tasa de hace ${staleDays} días`
          : null;

    const parents = liveCategories.filter((c) => c.parentId === null);
    const children = filters.categoryId ? liveCategories.filter((c) => c.parentId === filters.categoryId) : [];
    const parentName = parents.find((c) => c.id === filters.categoryId)?.name ?? '';
    const tagOptions = tagsInUse(allTags, periodLinks, new Set(periodRows.map((r) => r.id)));

    const groups = buildMovementGroups(filtered, { mode: 'usd', today, excluded: excludedOf(filtered) });
    const { date } = filters;
    const noYear = (day: string) => formatDayShort(day).replace(/ \d{4}$/, '');
    const rangeLabel = date.preset === 'range' && date.from && date.to ? `${noYear(date.from)} – ${noYear(date.to)}` : 'Rango de fechas';

    return {
      monthLabel: formatMonthLabel(month),
      months: recentMonths(currentMonth, 12).map((m2) => ({ value: m2, label: formatMonthLabel(m2) })),
      selectedMonth: month,
      setMonth: setSelectedMonth,
      rateLabel: rate ? `BCV · Bs ${formatRate(rate.rateScaled)}` : 'Sin tasa',
      banner,

      balanceLabel: formatMoney(net, 'USD'),
      balanceBsLabel: rate ? `≈ ${formatMoney(usdToVes(net, rate.rateScaled), 'VES')}` : null,
      trend: balanceTrend(monthRows, month, trendDays, monthExcluded),
      incomeTitle: `INGRESOS · ${monthShort}`,
      expenseTitle: `GASTOS · ${monthShort}`,
      incomeLabel: `+${formatMoney(totals.incomeUsdMinor, 'USD')}`,
      expenseLabel: `-${formatMoney(totals.expenseUsdMinor, 'USD')}`,

      pulse: pulse
        ? {
            over: pulse.over,
            lead: pulse.past ? `En ${monthName} te ${pulse.over ? 'pasaste ' : 'sobraron '}` : pulse.over ? 'Te pasaste ' : 'Te quedan ',
            amount: formatMoney(Math.abs(pulse.remainingMinor), 'USD'),
            tail: pulse.past ? (pulse.over ? ' del plan.' : '.') : pulse.over ? ` del plan de ${monthName}.` : ` para terminar ${monthName}.`,
            progress: Math.min(pulse.pct, 1),
            spentLabel: `Llevas ${formatMoney(bt.spentPlanned, 'USD')}${pulse.over || pulse.daysLeft === 0 ? '' : ` · ${formatMoney(pulse.perDayMinor, 'USD')}/día`}`,
            plannedLabel: `de ${formatMoney(bt.plannedExpense, 'USD')}`,
          }
        : null,

      tiles,
      filterBadge,
      filters,
      activeFilterCount: countActiveFilters(filters),
      toggleQuickCategory: (id: string) => {
        setCategoryFromTile(true);
        setFilters((f) => toggleCategoryFilter(f, id));
      },
      clearFilters: () => {
        setCategoryFromTile(false);
        setFilters(EMPTY_FILTERS);
      },
      periodLabel: filters.date.preset === 'prevMonth' ? formatMonthLabel(addMonths(month, -1)) : filters.date.preset === 'range' && filters.date.from && filters.date.to ? rangeLabel : null,
      clearPeriod: () => update({ date: { preset: 'month' } }),
      setType: (type: TypeFilter) => update({ type }),
      setDatePreset: (preset: DatePreset) => update({ date: { preset } }),
      setDateRange: (from: string, to: string) => update({ date: { preset: 'range', from: from <= to ? from : to, to: from <= to ? to : from } }),
      rangeLabel,
      toggleAccount: (id: string) => update({ accountIds: toggle(filters.accountIds, id) }),
      toggleTag: (id: string) => update({ tagIds: toggle(filters.tagIds, id) }),
      toggleCategory: (id: string) => {
        setCategoryFromTile(false);
        setFilters((f) => toggleCategoryFilter(f, id));
      },
      toggleSubcategory: (id: string) => update({ subcategoryId: filters.subcategoryId === id ? undefined : id }),
      accountOptions: accounts.map((a) => ({ id: a.id, name: a.name })),
      categoryOptions: parents.map((c) => ({ id: c.id, name: c.name })),
      subcategoryOptions: children.map((c) => ({ id: c.id, name: c.name })),
      subcategoryTitle: parentName,
      tagOptions: tagOptions.map((t) => ({ id: t.id, name: t.name })),
      resultCount: collapseTransfers(filtered).length,

      groups,
      hasAccounts: accounts.length > 0,
      isEmpty: filtered.length === 0,
      hasFilters: countActiveFilters(filters) > 0,
      previousMonthLabel: formatMonthLabel(addMonths(month, -1)),
      openSettings: () => router.push('/ajustes'),
      openRate: () => router.push('/rate'),
      openNewAccount: () => router.push('/account/new'),
      openDetail: (id: string) => router.push({ pathname: '/movement/[id]', params: { id } }),
    };
  }, [monthRows, periodRows, periodLinks, filtered, filters, categoryFromTile, accounts, allTags, liveCategories, allCategories, budgetItems, rate, month, today, currentMonth, setSelectedMonth, update, router]);
}
