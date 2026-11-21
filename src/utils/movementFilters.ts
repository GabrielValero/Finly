import { addMonths, monthOf } from './dates';
import type { TagLink } from './tagFilter';

export type TypeFilter = 'all' | 'income' | 'expense' | 'transfer';
export type DatePreset = 'month' | 'prevMonth' | 'range';

export interface DateFilter {
  preset: DatePreset;
  /** YYYY-MM-DD, solo con `range`. */
  from?: string;
  to?: string;
}

export interface MovementFilters {
  type: TypeFilter;
  date: DateFilter;
  accountIds: string[];
  /** Categoría (padre o hija). Un padre incluye sus subcategorías. */
  categoryId?: string;
  subcategoryId?: string;
  tagIds: string[];
}

export const EMPTY_FILTERS: MovementFilters = { type: 'all', date: { preset: 'month' }, accountIds: [], tagIds: [] };

export interface FilterableTx {
  id: string;
  kind: 'income' | 'expense' | 'transfer';
  accountId: string;
  categoryId: string | null;
  categoryParentId: string | null;
  occurredAt: string;
}

export interface FilterContext {
  /** Mes seleccionado en la pantalla ("Este mes"). */
  month: string;
  tagLinks: readonly TagLink[];
}

function hasRange(date: DateFilter): date is DateFilter & { from: string; to: string } {
  return date.preset === 'range' && !!date.from && !!date.to;
}

/** Meses que hay que consultar para cubrir el filtro de fecha. Un rango incompleto no filtra: vale el mes seleccionado. */
export function filterPeriod(date: DateFilter, month: string): { fromMonth: string; toMonth: string } {
  if (hasRange(date)) return { fromMonth: monthOf(date.from), toMonth: monthOf(date.to) };
  const m = date.preset === 'prevMonth' ? addMonths(month, -1) : month;
  return { fromMonth: m, toMonth: m };
}

export function applyMovementFilters<T extends FilterableTx>(rows: readonly T[], filters: MovementFilters, ctx: FilterContext): T[] {
  const { fromMonth, toMonth } = filterPeriod(filters.date, ctx.month);
  const range = hasRange(filters.date) ? filters.date : null;
  const accounts = new Set(filters.accountIds);
  const tagged = filters.tagIds.length > 0 ? new Set(ctx.tagLinks.filter((l) => filters.tagIds.includes(l.tagId)).map((l) => l.transactionId)) : null;

  return rows.filter((r) => {
    const day = r.occurredAt.slice(0, 10);
    if (range ? day < range.from || day > range.to : r.occurredAt.slice(0, 7) < fromMonth || r.occurredAt.slice(0, 7) > toMonth) return false;
    if (filters.type !== 'all' && r.kind !== filters.type) return false;
    if (accounts.size > 0 && !accounts.has(r.accountId)) return false;
    if (filters.subcategoryId) {
      if (r.categoryId !== filters.subcategoryId) return false;
    } else if (filters.categoryId && r.categoryId !== filters.categoryId && r.categoryParentId !== filters.categoryId) {
      return false;
    }
    if (tagged && !tagged.has(r.id)) return false;
    return true;
  });
}

/** Cuántos criterios hay activos. */
export function countActiveFilters(filters: MovementFilters): number {
  return (
    (filters.type !== 'all' ? 1 : 0) +
    (filters.date.preset !== 'month' ? 1 : 0) +
    (filters.accountIds.length > 0 ? 1 : 0) +
    (filters.categoryId ? 1 : 0) +
    (filters.subcategoryId ? 1 : 0) +
    (filters.tagIds.length > 0 ? 1 : 0)
  );
}

/** Atajo de categoría: tocar la activa la quita; tocar otra la elige y descarta la subcategoría. */
export function toggleCategoryFilter(filters: MovementFilters, categoryId: string): MovementFilters {
  const same = filters.categoryId === categoryId;
  return { ...filters, categoryId: same ? undefined : categoryId, subcategoryId: undefined };
}
