import { usdEquivalent, type TransactionKind } from './transactions';
import type { Currency } from './money';

export interface SummaryTx {
  id: string;
  accountId: string;
  accountCurrency: Currency;
  kind: TransactionKind;
  amountMinor: number;
  rateScaled: number | null;
  categoryId: string | null;
  occurredAt: string;
  deletedAt?: number | null;
}

export interface MonthTotals {
  /** Magnitudes positivas en USD (centavos), con la tasa congelada de cada movimiento. */
  expenseUsdMinor: number;
  incomeUsdMinor: number;
}

/** Totales del mes. Las transferencias y las categorías "no cuenta en reportes" no entran. */
export function monthTotals(txs: readonly SummaryTx[], excludedCategoryIds: ReadonlySet<string> = new Set()): MonthTotals {
  let expense = 0;
  let income = 0;
  for (const tx of txs) {
    if (tx.deletedAt || tx.kind === 'transfer') continue;
    if (tx.categoryId && excludedCategoryIds.has(tx.categoryId)) continue;
    const usd = usdEquivalent(tx);
    if (tx.kind === 'expense') expense += -usd;
    else income += usd;
  }
  return { expenseUsdMinor: expense, incomeUsdMinor: income };
}

export interface DayGroup<T> {
  /** YYYY-MM-DD */
  day: string;
  items: T[];
}

/** Agrupa por día, más reciente primero (y dentro del día, también). */
export function groupByDay<T extends { occurredAt: string }>(items: readonly T[]): DayGroup<T>[] {
  const sorted = [...items].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
  const groups: DayGroup<T>[] = [];
  for (const item of sorted) {
    const day = item.occurredAt.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}
