import { addMonths, monthOf } from './dates';
import { safeUsd } from './movementRows';
import type { Currency } from './money';
import type { TagLink } from './tagFilter';

/** Lo mínimo que necesita un reporte de un movimiento (subconjunto de `TxRow`). */
export interface ReportTx {
  id: string;
  kind: 'income' | 'expense' | 'transfer';
  accountCurrency: Currency;
  amountMinor: number;
  rateScaled: number | null;
  categoryId: string | null;
  occurredAt: string;
  /** Categoría marcada "no cuenta en reportes" (propia o del padre). */
  excluded: boolean;
}

export interface ReportCategory {
  id: string;
  name: string;
  parentId: string | null;
}

export interface ReportTotals {
  incomeUsdMinor: number;
  expenseUsdMinor: number;
  /** Movimientos en Bs sin tasa: no se pueden valorar y quedan fuera. */
  unvalued: number;
}

/** Gastos e ingresos en USD con la tasa congelada. Excluye transferencias y categorías fuera de reportes (igual que el Home). */
export function totalsOf(txs: readonly ReportTx[]): ReportTotals {
  const out: ReportTotals = { incomeUsdMinor: 0, expenseUsdMinor: 0, unvalued: 0 };
  for (const tx of txs) {
    if (tx.kind === 'transfer' || tx.excluded) continue;
    const usd = safeUsd(tx);
    if (usd === null) {
      out.unvalued += 1;
      continue;
    }
    if (tx.kind === 'expense') out.expenseUsdMinor += -usd;
    else out.incomeUsdMinor += usd;
  }
  return out;
}

export interface Slice {
  key: string;
  label: string;
  usdMinor: number;
  /** 0..1 del total de gastos. */
  share: number;
}

function toSlices(sums: Map<string, { label: string; usd: number }>): Slice[] {
  const total = [...sums.values()].reduce((s, v) => s + v.usd, 0);
  return [...sums.entries()]
    .filter(([, v]) => v.usd > 0)
    .map(([key, v]) => ({ key, label: v.label, usdMinor: v.usd, share: total > 0 ? v.usd / total : 0 }))
    .sort((a, b) => b.usdMinor - a.usdMinor);
}

/** Gasto por categoría de primer nivel (las subcategorías suman en su padre), de mayor a menor. */
export function expenseByCategory(txs: readonly ReportTx[], categories: readonly ReportCategory[]): Slice[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const sums = new Map<string, { label: string; usd: number }>();
  for (const tx of txs) {
    if (tx.kind !== 'expense' || tx.excluded) continue;
    const usd = safeUsd(tx);
    if (usd === null) continue;
    const own = tx.categoryId ? byId.get(tx.categoryId) : undefined;
    const top = own?.parentId ? (byId.get(own.parentId) ?? own) : own;
    const key = top?.id ?? 'none';
    const cur = sums.get(key) ?? { label: top?.name ?? 'Sin categoría', usd: 0 };
    cur.usd += -usd;
    sums.set(key, cur);
  }
  return toSlices(sums);
}

/** Gasto por etiqueta. Un movimiento con varias etiquetas suma en cada una (por eso no suma al total). */
export function expenseByTag(txs: readonly ReportTx[], links: readonly TagLink[], tags: readonly { id: string; name: string }[]): Slice[] {
  const names = new Map(tags.map((t) => [t.id, t.name]));
  const tagsOf = new Map<string, string[]>();
  for (const l of links) tagsOf.set(l.transactionId, [...(tagsOf.get(l.transactionId) ?? []), l.tagId]);
  const sums = new Map<string, { label: string; usd: number }>();
  for (const tx of txs) {
    if (tx.kind !== 'expense' || tx.excluded) continue;
    const usd = safeUsd(tx);
    if (usd === null) continue;
    for (const tagId of tagsOf.get(tx.id) ?? []) {
      const cur = sums.get(tagId) ?? { label: `#${names.get(tagId) ?? '?'}`, usd: 0 };
      cur.usd += -usd;
      sums.set(tagId, cur);
    }
  }
  return toSlices(sums);
}

export interface MonthFlow {
  month: string;
  incomeUsdMinor: number;
  expenseUsdMinor: number;
}

/** Ingresos y gastos de los `count` meses que terminan en `endMonth` (incluye meses vacíos). */
export function monthlyFlow(txs: readonly ReportTx[], endMonth: string, count: number): MonthFlow[] {
  const months = Array.from({ length: count }, (_, i) => addMonths(endMonth, i - (count - 1)));
  const byMonth = new Map<string, ReportTx[]>(months.map((m) => [m, []]));
  for (const tx of txs) byMonth.get(monthOf(tx.occurredAt))?.push(tx);
  return months.map((month) => {
    const t = totalsOf(byMonth.get(month) ?? []);
    return { month, incomeUsdMinor: t.incomeUsdMinor, expenseUsdMinor: t.expenseUsdMinor };
  });
}

/** Variación porcentual entera vs el periodo anterior; null si no hay base (anterior = 0). */
export function percentChange(previous: number, current: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Deja las `max` mayores y junta el resto en "Otras" (si sobra más de una). */
export function topSlices(slices: readonly Slice[], max: number): Slice[] {
  if (slices.length <= max) return [...slices];
  const head = slices.slice(0, max - 1);
  const rest = slices.slice(max - 1);
  return [...head, { key: 'others', label: 'Otras', usdMinor: rest.reduce((s, x) => s + x.usdMinor, 0), share: rest.reduce((s, x) => s + x.share, 0) }];
}
