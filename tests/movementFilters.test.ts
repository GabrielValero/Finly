import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  applyMovementFilters,
  countActiveFilters,
  filterPeriod,
  toggleCategoryFilter,
  type FilterableTx,
  type MovementFilters,
} from '../src/utils/movementFilters';

const tx = (id: string, over: Partial<FilterableTx> = {}): FilterableTx => ({
  id,
  kind: 'expense',
  accountId: 'a1',
  categoryId: null,
  categoryParentId: null,
  occurredAt: '2026-11-10T10:00:00',
  ...over,
});

const ctx = { month: '2026-11', tagLinks: [] as { transactionId: string; tagId: string }[] };
const f = (over: Partial<MovementFilters> = {}): MovementFilters => ({ ...EMPTY_FILTERS, ...over });

describe('applyMovementFilters', () => {
  const rows = [
    tx('1', { kind: 'income' }),
    tx('2', { kind: 'expense', accountId: 'a2', categoryId: 'food', categoryParentId: 'life' }),
    tx('3', { kind: 'transfer' }),
    tx('4', { kind: 'expense', categoryId: 'life' }),
    tx('5', { kind: 'expense', occurredAt: '2026-10-20T09:00:00' }),
  ];
  const ids = (r: FilterableTx[]) => r.map((x) => x.id);

  it('sin filtros devuelve el mes seleccionado', () => {
    expect(ids(applyMovementFilters(rows, f(), ctx))).toEqual(['1', '2', '3', '4']);
  });
  it('filtra por tipo', () => {
    expect(ids(applyMovementFilters(rows, f({ type: 'income' }), ctx))).toEqual(['1']);
    expect(ids(applyMovementFilters(rows, f({ type: 'transfer' }), ctx))).toEqual(['3']);
  });
  it('mes pasado usa el mes anterior al seleccionado', () => {
    expect(ids(applyMovementFilters(rows, f({ date: { preset: 'prevMonth' } }), ctx))).toEqual(['5']);
  });
  it('rango filtra por día inclusive', () => {
    const date = { preset: 'range' as const, from: '2026-10-20', to: '2026-11-10' };
    expect(ids(applyMovementFilters(rows, f({ date }), ctx))).toEqual(['1', '2', '3', '4', '5']);
    expect(ids(applyMovementFilters(rows, f({ date: { ...date, to: '2026-10-31' } }), ctx))).toEqual(['5']);
  });
  it('cuentas: coincide con cualquiera', () => {
    expect(ids(applyMovementFilters(rows, f({ accountIds: ['a2'] }), ctx))).toEqual(['2']);
    expect(ids(applyMovementFilters(rows, f({ accountIds: ['a1', 'a2'] }), ctx))).toEqual(['1', '2', '3', '4']);
  });
  it('categoría padre incluye a sus subcategorías', () => {
    expect(ids(applyMovementFilters(rows, f({ categoryId: 'life' }), ctx))).toEqual(['2', '4']);
  });
  it('subcategoría acota al hijo', () => {
    expect(ids(applyMovementFilters(rows, f({ categoryId: 'life', subcategoryId: 'food' }), ctx))).toEqual(['2']);
  });
  it('etiquetas: coincide con cualquiera', () => {
    const links = [
      { transactionId: '1', tagId: 't1' },
      { transactionId: '4', tagId: 't2' },
    ];
    expect(ids(applyMovementFilters(rows, f({ tagIds: ['t1', 't2'] }), { ...ctx, tagLinks: links }))).toEqual(['1', '4']);
  });
});

describe('filterPeriod', () => {
  it('da el rango de meses a consultar', () => {
    expect(filterPeriod(EMPTY_FILTERS.date, '2026-11')).toEqual({ fromMonth: '2026-11', toMonth: '2026-11' });
    expect(filterPeriod({ preset: 'prevMonth' }, '2026-01')).toEqual({ fromMonth: '2025-12', toMonth: '2025-12' });
    expect(filterPeriod({ preset: 'range', from: '2026-09-05', to: '2026-11-02' }, '2026-11')).toEqual({ fromMonth: '2026-09', toMonth: '2026-11' });
  });
  it('rango incompleto cae al mes seleccionado', () => {
    expect(filterPeriod({ preset: 'range', from: '2026-09-05' }, '2026-11')).toEqual({ fromMonth: '2026-11', toMonth: '2026-11' });
  });
});

describe('countActiveFilters', () => {
  it('cuenta cada criterio activo', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters(f({ type: 'income', accountIds: ['a'], tagIds: ['t'] }))).toBe(3);
    expect(countActiveFilters(f({ categoryId: 'c', subcategoryId: 's', date: { preset: 'prevMonth' } }))).toBe(3);
  });
});

describe('toggleCategoryFilter', () => {
  it('selecciona y limpia la subcategoría', () => {
    const next = toggleCategoryFilter(f({ categoryId: 'a', subcategoryId: 'x' }), 'b');
    expect(next.categoryId).toBe('b');
    expect(next.subcategoryId).toBeUndefined();
  });
  it('tocar la misma categoría la quita', () => {
    const next = toggleCategoryFilter(f({ categoryId: 'a', subcategoryId: 'x' }), 'a');
    expect(next.categoryId).toBeUndefined();
    expect(next.subcategoryId).toBeUndefined();
  });
});
