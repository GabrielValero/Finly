import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useUi } from '../store/ui';
import { isExcluded } from '../utils/categories';
import { addMonths, dayOf, daysBetween, formatDayLabel, formatMonthLabel, recentMonths, toLocalIso } from '../utils/dates';
import { formatMinor, formatMoney, formatRate } from '../utils/money';
import { portfolioTotal } from '../utils/portfolio';
import { groupByDay, monthTotals } from '../utils/summary';
import { usdEquivalent } from '../utils/transactions';
import { useAccountsWithBalance, useLatestRate, useMonthTransactions, type TxRow } from './useData';

export interface MovementRowVm {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  amount: string;
  tone: 'default' | 'income';
  caption: string | null;
}

export interface MovementGroupVm {
  day: string;
  label: string;
  total: string;
  rows: MovementRowVm[];
}

/** Valor en USD si se puede calcular (Bs sin tasa -> null). */
function safeUsd(tx: TxRow): number | null {
  try {
    return usdEquivalent(tx);
  } catch {
    return null;
  }
}

function signedUsd(minor: number): string {
  return `${minor > 0 ? '+' : ''}${formatMoney(minor, 'USD')}`;
}

function toRow(tx: TxRow): MovementRowVm {
  const usd = safeUsd(tx);
  const isTransfer = tx.kind === 'transfer';
  const originalInBs = tx.listedCurrency === 'VES' || (tx.accountCurrency === 'VES' && tx.listedCurrency === null);
  return {
    id: tx.id,
    icon: isTransfer ? 'transfer' : (tx.categoryIcon ?? 'wallet'),
    title: tx.concept.trim() || (isTransfer ? 'Transferencia' : (tx.categoryName ?? 'Movimiento')),
    subtitle: tx.accountName.toUpperCase(),
    amount: usd === null ? formatMoney(tx.amountMinor, tx.accountCurrency) : signedUsd(usd),
    tone: tx.kind === 'income' || (isTransfer && tx.amountMinor > 0) ? 'income' : 'default',
    caption: originalInBs ? 'en Bs' : null,
  };
}

export function useMovementsScreen() {
  const router = useRouter();
  const month = useUi((s) => s.selectedMonth);
  const setSelectedMonth = useUi((s) => s.setSelectedMonth);

  const rows = useMonthTransactions(month);
  const previousRows = useMonthTransactions(addMonths(month, -1));
  const accounts = useAccountsWithBalance();
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

    const groups: MovementGroupVm[] = groupByDay(rows).map((g) => {
      const dayTotal = monthTotals(g.items, excluded);
      const dayNet = dayTotal.incomeUsdMinor - dayTotal.expenseUsdMinor;
      return { day: g.day, label: formatDayLabel(g.day, today), total: signedUsd(dayNet), rows: g.items.map(toRow) };
    });

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
      balanceLabel: `$ ${formatMinor(portfolio.usdMinor)}`,
      balanceNote: portfolio.missingRate ? 'Hay saldo en Bs sin valorar: falta la tasa' : null,
      deltaLabel: delta === null ? null : `${delta >= 0 ? '+' : '-'}${formatMoney(Math.abs(delta), 'USD')} vs mes pasado`,
      deltaPositive: delta === null ? true : delta >= 0,
      expenseLabel: formatMoney(totals.expenseUsdMinor, 'USD'),
      incomeLabel: formatMoney(totals.incomeUsdMinor, 'USD'),
      banner,
      groups,
      hasAccounts: accounts.length > 0,
      isEmpty: rows.length === 0,
      setMonth: setSelectedMonth,
      openCapture: () => router.push('/capture'),
      openRate: () => router.push('/rate'),
      openNewAccount: () => router.push('/account/new'),
      openDetail: (id: string) => router.push({ pathname: '/movement/[id]', params: { id } }),
    };
  }, [rows, previousRows, accounts, rate, month, today, currentMonth, setSelectedMonth, router]);
}
