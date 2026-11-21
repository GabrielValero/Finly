import { safeUsd } from './movementRows';
import type { Currency } from './money';

export interface TopCategoryTx {
  id: string;
  kind: 'income' | 'expense' | 'transfer';
  accountCurrency: Currency;
  amountMinor: number;
  rateScaled: number | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface TopCategory {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  count: number;
}

/** Categorías de gasto más usadas del periodo: por cantidad de movimientos, desempate por monto en USD. */
export function topCategories(rows: readonly TopCategoryTx[], n: number): TopCategory[] {
  const acc = new Map<string, TopCategory & { totalMinor: number }>();
  for (const r of rows) {
    if (r.kind !== 'expense' || !r.categoryId) continue;
    const cur = acc.get(r.categoryId) ?? { categoryId: r.categoryId, name: r.categoryName ?? '', icon: r.categoryIcon, color: r.categoryColor, count: 0, totalMinor: 0 };
    cur.count += 1;
    cur.totalMinor += Math.abs(safeUsd(r) ?? 0);
    acc.set(r.categoryId, cur);
  }
  return [...acc.values()]
    .sort((a, b) => b.count - a.count || b.totalMinor - a.totalMinor || a.name.localeCompare(b.name, 'es'))
    .slice(0, n)
    .map(({ totalMinor: _total, ...c }) => c);
}
