import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useUi } from '../store/ui';
import { itemStatus, progressOf, txsOfItem } from '../utils/budget';
import { STATUS_STYLE, statusLabel } from '../utils/budgetDisplay';
import { categoryPath, isExcluded } from '../utils/categories';
import { dayOf, formatMonthLabel, monthOf, recentMonths, toLocalIso } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { accountFlow, buildMovementGroups, safeUsd } from '../utils/movementRows';
import { useAccountsWithBalance, useAllCategoryRows, useBudgetItems, useMonthTransactions, type TxRow } from './useData';

export type MovementScope = { type: 'account'; id: string } | { type: 'budget'; id: string; month: string };

const today = () => dayOf(toLocalIso(new Date()));

function usdMagnitude(tx: TxRow): number {
  const usd = safeUsd(tx);
  return usd === null ? 0 : Math.abs(usd);
}

/**
 * Lista de movimientos de UN ámbito: una cuenta (por mes, en su moneda) o una partida del presupuesto
 * (los mismos movimientos que suman en su total, ya repartidos con la regla única de `itemResolver`).
 */
export function useScopedMovements(scope: MovementScope) {
  const router = useRouter();
  const selectedMonth = useUi((s) => s.selectedMonth);
  const [pickedMonth, setPickedMonth] = useState(selectedMonth);
  const month = scope.type === 'budget' ? scope.month : pickedMonth;

  const rows = useMonthTransactions(month);
  const accounts = useAccountsWithBalance();
  const items = useBudgetItems(scope.type === 'budget' ? scope.month : month);
  const categories = useAllCategoryRows();
  const currentMonth = monthOf(`${today()}T00:00:00`);

  return useMemo(() => {
    const base = {
      months: scope.type === 'account' ? recentMonths(currentMonth, 12).map((m) => ({ value: m, label: formatMonthLabel(m) })) : null,
      monthLabel: formatMonthLabel(month),
      selectedMonth: month,
      setMonth: setPickedMonth,
      openDetail: (id: string) => router.push({ pathname: '/movement/[id]', params: { id } }),
      close: () => router.back(),
    };

    if (scope.type === 'account') {
      const account = accounts.find((a) => a.id === scope.id) ?? null;
      const own = rows.filter((r) => r.accountId === scope.id);
      const flow = accountFlow(own);
      return {
        ...base,
        found: account !== null || accounts.length === 0,
        loading: accounts.length === 0,
        title: account?.name ?? 'Cuenta',
        icon: account?.icon ?? 'wallet',
        subtitle: account ? account.currency : '',
        headline: account ? formatMoney(account.balanceMinor, account.currency) : '',
        headlineLabel: 'Saldo actual',
        stats: account
          ? [
              { label: 'Entradas', value: formatMoney(flow.inMinor, account.currency), tone: 'income' as const },
              { label: 'Salidas', value: formatMoney(flow.outMinor, account.currency), tone: 'default' as const },
            ]
          : [],
        progress: null,
        status: null,
        groups: buildMovementGroups(own, { mode: 'native', today: today(), excluded: new Set() }),
        isEmpty: own.length === 0,
        emptyText: 'Sin movimientos de esta cuenta este mes',
        edit: () => router.push({ pathname: '/account/[id]', params: { id: scope.id } }),
      };
    }

    const item = items.find((i) => i.id === scope.id) ?? null;
    const lite = items.map((i) => ({ id: i.id, categoryId: i.categoryId, kind: i.kind, plannedMinor: i.plannedMinor, isFixed: i.isFixed }));
    const excludedRow = (t: TxRow) => isExcluded(t.excludeFromReports, t.parentExcludeFromReports);
    const own = item ? txsOfItem(item.id, lite, categories, rows, excludedRow) : [];
    const actual = own.reduce((sum, t) => sum + usdMagnitude(t), 0);
    const status = item ? itemStatus(item, actual) : null;
    const style = status ? STATUS_STYLE[status] : null;
    return {
      ...base,
      found: item !== null || items.length === 0,
      loading: items.length === 0,
      title: item ? (categoryPath(item.categoryName, item.parentName) ?? item.categoryName) : 'Partida',
      icon: item?.categoryIcon ?? 'wallet',
      subtitle: item ? (item.kind === 'income' ? 'INGRESO PLANIFICADO' : item.isFixed ? 'GASTO FIJO' : 'GASTO VARIABLE') : '',
      headline: item ? `${formatMoney(actual, 'USD')} / ${formatMoney(item.plannedMinor, 'USD')}` : '',
      headlineLabel: item?.kind === 'income' ? 'Recibido' : 'Gastado',
      stats: [],
      progress: item && style ? { value: progressOf(item.plannedMinor, actual), color: style.barColor } : null,
      status: item && status && style ? { label: statusLabel(item.kind, item.isFixed, status, Math.max(item.plannedMinor - actual, 0)), color: style.statusColor } : null,
      groups: buildMovementGroups(own, { mode: 'usd', today: today(), excluded: new Set() }),
      isEmpty: own.length === 0,
      emptyText: 'Aún no hay movimientos en esta partida',
      edit: () => router.push({ pathname: '/budget/[id]', params: { id: scope.id, month: scope.month } }),
    };
  }, [scope, month, rows, accounts, items, categories, currentMonth, router]);
}

