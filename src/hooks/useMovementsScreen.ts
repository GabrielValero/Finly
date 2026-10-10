import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useUi } from '../store/ui';
import { isExcluded } from '../utils/categories';
import { addMonths, dayOf, daysBetween, formatMonthLabel, recentMonths, toLocalIso } from '../utils/dates';
import { formatMinor, formatMoney, formatRate } from '../utils/money';
import { portfolioTotal } from '../utils/portfolio';
import { buildMovementGroups } from '../utils/movementRows';
import { monthTotals } from '../utils/summary';
import { useAccountsWithBalance, useLatestRate, useMonthTransactions, type TxRow } from './useData';

export type { MovementGroupVm, MovementRowVm } from '../utils/movementRows';

export function useMovementsScreen() {
  const router = useRouter();
  const month = useUi((s) => s.selectedMonth);
  const setSelectedMonth = useUi((s) => s.setSelectedMonth);

  const allRows = useMonthTransactions(month);
  const allPreviousRows = useMonthTransactions(addMonths(month, -1));
  const accounts = useAccountsWithBalance();
  /** null = todas las cuentas. */
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const filterAccount = accounts.find((a) => a.id === accountFilter) ?? null;
  const filterId = filterAccount?.id ?? null;
  const rows = useMemo(() => (filterId ? allRows.filter((r) => r.accountId === filterId) : allRows), [allRows, filterId]);
  const previousRows = useMemo(() => (filterId ? allPreviousRows.filter((r) => r.accountId === filterId) : allPreviousRows), [allPreviousRows, filterId]);
  const rate = useLatestRate();

  const today = dayOf(toLocalIso(new Date()));
  const currentMonth = today.slice(0, 7);

  return useMemo(() => {
    const excludedOf = (list: readonly TxRow[]) => new Set(list.filter((r) => r.categoryId && isExcluded(r.excludeFromReports, r.parentExcludeFromReports)).map((r) => r.categoryId!));
    const excluded = excludedOf(rows);
    const prevExcluded = excludedOf(previousRows);
    const totals = monthTotals(rows, excluded);
    const prevTotals = monthTotals(previousRows, prevExcluded);

    const portfolio = portfolioTotal(accounts, rate?.rateScaled ?? null);

    const net = totals.incomeUsdMinor - totals.expenseUsdMinor;
    const prevNet = prevTotals.incomeUsdMinor - prevTotals.expenseUsdMinor;
    const delta = previousRows.length > 0 ? net - prevNet : null;

    const groups = buildMovementGroups(rows, { mode: 'usd', today, excluded });

    const staleDays = rate ? daysBetween(rate.validFrom, today) : null;
    const banner =
      rate === null
        ? 'Define la tasa del día'
        : staleDays !== null && staleDays >= 1
          ? staleDays === 1 ? 'Tasa de ayer' : `Tasa de hace ${staleDays} días`
          : null;

    return {
      monthLabel: formatMonthLabel(month),
      months: recentMonths(currentMonth, 12).map((m) => ({ value: m, label: formatMonthLabel(m) })),
      selectedMonth: month,
      rateLabel: rate ? `Bs ${formatRate(rate.rateScaled)} / $` : 'Sin tasa',
      balanceTitle: filterAccount ? `Saldo de ${filterAccount.name}` : 'Balance total',
      balanceLabel: filterAccount ? formatMoney(filterAccount.balanceMinor, filterAccount.currency) : `$ ${formatMinor(portfolio.usdMinor)}`,
      balanceNote: !filterAccount && portfolio.missingRate ? 'Hay saldo en Bs sin valorar: falta la tasa' : null,
      deltaLabel: delta === null ? null : `${delta >= 0 ? '+' : '-'}${formatMoney(Math.abs(delta), 'USD')} vs mes pasado`,
      accountChips: [{ id: null as string | null, name: 'Todas' }, ...accounts.map((a) => ({ id: a.id as string | null, name: a.name }))],
      accountFilter: filterId,
      setAccountFilter,
      filterName: filterAccount?.name ?? null,
      deltaPositive: delta === null ? true : delta >= 0,
      expenseLabel: formatMoney(totals.expenseUsdMinor, 'USD'),
      incomeLabel: formatMoney(totals.incomeUsdMinor, 'USD'),
      banner,
      groups,
      hasAccounts: accounts.length > 0,
      isEmpty: rows.length === 0,
      hasAnyRows: allRows.length > 0,
      setMonth: setSelectedMonth,
      openCapture: () => router.push('/capture'),
      openRate: () => router.push('/rate'),
      openNewAccount: () => router.push('/account/new'),
      openDetail: (id: string) => router.push({ pathname: '/movement/[id]', params: { id } }),
    };
  }, [rows, previousRows, allRows, accounts, filterAccount, filterId, rate, month, today, currentMonth, setSelectedMonth, router]);
}
