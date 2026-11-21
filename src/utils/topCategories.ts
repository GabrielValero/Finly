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
  categoryParentId?: string | null;
  categoryParentName?: string | null;
  categoryParentIcon?: string | null;
  categoryParentColor?: string | null;
}

export interface TopCategory {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  count: number;
}

/**
 * Categorías de gasto más usadas del periodo: por cantidad de movimientos, desempate por monto en USD.
 * Las subcategorías suman a su padre (que da nombre, ícono y color). `excluded` = categorías fuera de reportes.
 */
export function topCategories(rows: readonly TopCategoryTx[], n: number, excluded: ReadonlySet<string> = new Set()): TopCategory[] {
  const acc = new Map<string, TopCategory & { totalMinor: number }>();
  for (const r of rows) {
    if (r.kind !== 'expense' || !r.categoryId || excluded.has(r.categoryId)) continue;
    const underParent = r.categoryParentId ?? null;
    const id = underParent ?? r.categoryId;
    const cur =
      acc.get(id) ??
      (underParent
        ? { categoryId: id, name: r.categoryParentName ?? '', icon: r.categoryParentIcon ?? r.categoryIcon, color: r.categoryParentColor ?? null, count: 0, totalMinor: 0 }
        : { categoryId: id, name: r.categoryName ?? '', icon: r.categoryIcon, color: r.categoryColor, count: 0, totalMinor: 0 });
    cur.count += 1;
    cur.totalMinor += Math.abs(safeUsd(r) ?? 0);
    acc.set(id, cur);
  }
  return [...acc.values()]
    .sort((a, b) => b.count - a.count || b.totalMinor - a.totalMinor || a.name.localeCompare(b.name, 'es'))
    .slice(0, n)
    .map((c) => ({ categoryId: c.categoryId, name: c.name, icon: c.icon, color: c.color, count: c.count }));
}
