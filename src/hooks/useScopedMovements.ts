import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useUi } from '../store/ui';
import { itemStatus, progressOf, txsOfItem } from '../utils/budget';
import { STATUS_STYLE, statusLabel, type BarTone, type StatusTone } from '../utils/budgetDisplay';
import { categoryPath, isExcluded } from '../utils/categories';
import { resolveCategoryColor } from '../utils/categoryColor';
import { dayOf, formatMonthLabel, MONTH_NAMES, monthOf, recentMonths, toLocalIso } from '../utils/dates';
import { accountMonthSegments, scopeRemainingSegments, type Segment } from '../utils/humanVoice';
import { formatMoney, usdToVes, vesToUsd } from '../utils/money';
import { budgetPulse } from '../utils/monthInsights';
import { accountFlow, buildMovementGroups, safeUsd } from '../utils/movementRows';
import { useAccountsWithBalance, useAllCategoryRows, useBudgetItems, useLatestRate, useMonthTransactions, type TxRow } from './useData';

export type MovementScope = { type: 'account'; id: string } | { type: 'budget'; id: string; month: string };

export interface ScopeStat {
  label: string;
  value: string;
  tone: 'text' | 'income' | 'expense';
}

/** Tarjeta superior de la lista: saldo de una cuenta o avance de una partida. */
export type ScopeCard =
  | {
      type: 'account';
      icon: string;
      label: string;
      headline: string;
      equivalent: string | null;
      human: Segment[];
      stats: ScopeStat[];
      note: string;
    }
  | {
      type: 'budget';
      icon: string;
      color: string | null;
      eyebrow: string;
      badge: { label: string; tone: StatusTone };
      label: string;
      headline: string;
      progress: { value: number; color: BarTone };
      human: Segment[] | null;
    };

const today = () => dayOf(toLocalIso(new Date()));

function usdMagnitude(tx: TxRow): number {
  const usd = safeUsd(tx);
  return usd === null ? 0 : Math.abs(usd);
}

function monthNameOf(month: string): string {
  return MONTH_NAMES[Number(month.slice(5, 7)) - 1]!.toLowerCase();
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
  const rate = useLatestRate();
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
      const flow = accountFlow(own, { includeTransfers: false });
      const currency = account?.currency ?? 'USD';
      let equivalent: string | null = null;
      if (account && rate) {
        equivalent = account.currency === 'USD' ? `≈ ${formatMoney(usdToVes(account.balanceMinor, rate.rateScaled), 'VES')}` : `≈ ${formatMoney(vesToUsd(account.balanceMinor, rate.rateScaled), 'USD')}`;
      }
      const card: ScopeCard | null = account
        ? {
            type: 'account',
            icon: account.icon,
            label: 'SALDO ACTUAL',
            headline: formatMoney(account.balanceMinor, currency),
            equivalent,
            human: accountMonthSegments(monthNameOf(month), formatMoney(flow.inMinor, currency), formatMoney(flow.outMinor, currency)),
            stats: [
              { label: 'ENTRADAS', value: formatMoney(flow.inMinor, currency), tone: 'income' },
              { label: 'SALIDAS', value: formatMoney(flow.outMinor, currency), tone: 'expense' },
            ],
            note: 'Entradas y salidas no incluyen transferencias.',
          }
        : null;
      return {
        ...base,
        found: account !== null || accounts.length === 0,
        loading: accounts.length === 0,
        title: account?.name ?? 'Cuenta',
        card,
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
    let card: ScopeCard | null = null;
    if (item) {
      const status = itemStatus(item, actual);
      const style = STATUS_STYLE[status];
      const pulse = budgetPulse({ plannedMinor: item.plannedMinor, spentMinor: actual, today: today(), month });
      const kindLabel = item.kind === 'income' ? 'INGRESO' : item.isFixed ? 'GASTO FIJO' : 'GASTO VARIABLE';
      card = {
        type: 'budget',
        icon: item.categoryIcon,
        color: resolveCategoryColor(item.categoryColor ?? item.parentColor ?? null, item.categoryId),
        eyebrow: `${kindLabel} · ${monthNameOf(month).toUpperCase()}`,
        badge: { label: statusLabel(item.kind, item.isFixed, status, Math.max(item.plannedMinor - actual, 0)), tone: style.statusColor },
        label: item.kind === 'income' ? 'RECIBIDO' : 'GASTADO',
        headline: `${formatMoney(actual, 'USD')} / ${formatMoney(item.plannedMinor, 'USD')}`,
        progress: { value: progressOf(item.plannedMinor, actual), color: style.barColor },
        human: pulse
          ? scopeRemainingSegments({
              category: item.categoryName,
              monthName: monthNameOf(month),
              kind: item.kind,
              isFixed: item.isFixed,
              remaining: formatMoney(Math.abs(pulse.remainingMinor), 'USD'),
              perDay: formatMoney(pulse.perDayMinor, 'USD'),
              over: pulse.over,
              past: pulse.past,
              daysLeft: pulse.daysLeft,
            })
          : null,
      };
    }
    return {
      ...base,
      found: item !== null || items.length === 0,
      loading: items.length === 0,
      title: item ? (categoryPath(item.categoryName, item.parentName) ?? item.categoryName) : 'Partida',
      card,
      groups: buildMovementGroups(own, { mode: 'usd', today: today(), excluded: new Set() }),
      isEmpty: own.length === 0,
      emptyText: 'Aún no hay movimientos en esta partida',
      edit: () => router.push({ pathname: '/budget/[id]', params: { id: scope.id, month: scope.month } }),
    };
  }, [scope, month, rows, accounts, items, categories, rate, currentMonth, router]);
}
