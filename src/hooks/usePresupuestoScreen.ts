import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert } from 'react-native';
import { copyBudgetFromPrevious } from '../data/repos/budgets';
import { useUi } from '../store/ui';
import { allocateSpending, budgetKind, budgetTotals, itemStatus, progressOf, type BudgetTx } from '../utils/budget';
import { STATUS_STYLE, statusLabel } from '../utils/budgetDisplay';
import { categoryPath, isExcluded } from '../utils/categories';
import { dayOf, formatMonthLabel, monthOf, recentMonths, toLocalIso } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { usdEquivalent } from '../utils/transactions';
import { useAllCategoryRows, useBudgetItems, useMonthTransactions, type TxRow } from './useData';

export interface BudgetRowVm {
  id: string;
  icon: string;
  title: string;
  status: string;
  statusColor: 'income' | 'accent' | 'expense' | 'textMuted';
  amounts: string;
  progress: number;
  barColor: 'income' | 'accent' | 'expense' | 'surface2';
}

function usdMagnitude(tx: TxRow): number {
  try {
    return Math.abs(usdEquivalent(tx));
  } catch {
    return 0;
  }
}

export function usePresupuestoScreen() {
  const router = useRouter();
  const month = useUi((s) => s.selectedMonth);
  const setMonth = useUi((s) => s.setSelectedMonth);
  const items = useBudgetItems(month);
  const txs = useMonthTransactions(month);
  const categories = useAllCategoryRows();
  const currentMonth = monthOf(`${dayOf(toLocalIso(new Date()))}T00:00:00`);

  const view = useMemo(() => {
    const lite = items.map((i) => ({ id: i.id, categoryId: i.categoryId, kind: i.kind, plannedMinor: i.plannedMinor, isFixed: i.isFixed }));
    const budgetTxs: BudgetTx[] = txs.map((t) => ({
      kind: budgetKind(t) ?? 'transfer',
      usdMinor: usdMagnitude(t),
      categoryId: t.categoryId,
      excluded: isExcluded(t.excludeFromReports, t.parentExcludeFromReports),
    }));
    const { byItem, unplanned } = allocateSpending(lite, budgetTxs, categories);
    const totals = budgetTotals(lite, byItem);
    const toRow = (i: (typeof items)[number]): BudgetRowVm => {
      const actual = byItem.get(i.id) ?? 0;
      const status = itemStatus(i, actual);
      const style = STATUS_STYLE[status];
      return {
        id: i.id,
        icon: i.categoryIcon,
        title: categoryPath(i.categoryName, i.parentName) ?? i.categoryName,
        status: statusLabel(i.kind, i.isFixed, status, Math.max(i.plannedMinor - actual, 0)),
        statusColor: style.statusColor,
        amounts: `${formatMoney(actual, 'USD')} / ${formatMoney(i.plannedMinor, 'USD')}`,
        progress: progressOf(i.plannedMinor, actual),
        barColor: style.barColor,
      };
    };
    return {
      fixed: items.filter((i) => i.kind === 'expense' && i.isFixed).map(toRow),
      variable: items.filter((i) => i.kind === 'expense' && !i.isFixed).map(toRow),
      income: items.filter((i) => i.kind === 'income').map(toRow),
      summary: {
        spent: formatMoney(totals.spentPlanned, 'USD'),
        planned: formatMoney(totals.plannedExpense, 'USD'),
        percent: Math.round(totals.percent * 100),
        progress: Math.min(totals.percent, 1),
        over: totals.percent > 1,
        plannedIncome: formatMoney(totals.plannedIncome, 'USD'),
        leftoverLabel: totals.leftover >= 0 ? 'Te sobran' : 'Te faltan',
        leftover: formatMoney(Math.abs(totals.leftover), 'USD'),
        leftoverNegative: totals.leftover < 0,
      },
      unplanned: unplanned.expense > 0 ? formatMoney(unplanned.expense, 'USD') : null,
    };
  }, [items, txs, categories]);

  const copyPrevious = () => {
    void copyBudgetFromPrevious(month, new Date()).then((n) =>
      Alert.alert(n > 0 ? 'Presupuesto copiado' : 'Nada que copiar', n > 0 ? `Se copiaron ${n} partidas del mes anterior.` : 'No hay un mes anterior con partidas, o ya están todas.'),
    );
  };

  return {
    monthLabel: formatMonthLabel(month),
    months: recentMonths(currentMonth, 12).map((m) => ({ value: m, label: formatMonthLabel(m) })),
    selectedMonth: month,
    setMonth,
    isEmpty: items.length === 0,
    ...view,
    copyPrevious,
    openAdd: () => router.push({ pathname: '/budget/[id]', params: { id: 'new', month } }),
    openItem: (id: string) => router.push({ pathname: '/budget-movements/[id]', params: { id, month } }),
  };
}
