import { describe, expect, it } from 'vitest';
import { allocateSpending, budgetTotals, itemStatus, previousBudgetMonth, progressOf, validateBudgetItem, type BudgetItemLite, type BudgetTx } from '../src/utils/budget';

const cats = [
  { id: 'comida', parentId: null },
  { id: 'rest', parentId: 'comida' },
  { id: 'ropa', parentId: null },
  { id: 'otra', parentId: null },
];
const items: BudgetItemLite[] = [
  { id: 'i-comida', categoryId: 'comida', kind: 'expense', plannedMinor: 35000, isFixed: false },
  { id: 'i-ropa', categoryId: 'ropa', kind: 'expense', plannedMinor: 28000, isFixed: false },
  { id: 'i-sueldo', categoryId: 'sueldo', kind: 'income', plannedMinor: 120000, isFixed: false },
];
const tx = (over: Partial<BudgetTx>): BudgetTx => ({ kind: 'expense', usdMinor: 1000, categoryId: 'comida', excluded: false, ...over });

describe('allocateSpending', () => {
  it('suma subcategorías a la partida del padre y separa lo no planificado', () => {
    const a = allocateSpending(items, [tx({}), tx({ categoryId: 'rest', usdMinor: 500 }), tx({ categoryId: 'otra', usdMinor: 700 }), tx({ kind: 'income', categoryId: 'sueldo', usdMinor: 90000 })], cats);
    expect(a.byItem.get('i-comida')).toBe(1500);
    expect(a.unplanned).toEqual({ expense: 700, income: 0 });
    expect(a.byItem.get('i-sueldo')).toBe(90000);
  });
  it('la partida de la subcategoría gana a la del padre', () => {
    const withSub = [...items, { id: 'i-rest', categoryId: 'rest', kind: 'expense' as const, plannedMinor: 5000, isFixed: false }];
    const a = allocateSpending(withSub, [tx({ categoryId: 'rest', usdMinor: 500 })], cats);
    expect(a.byItem.get('i-rest')).toBe(500);
    expect(a.byItem.get('i-comida')).toBe(0);
  });
  it('ignora transferencias y categorías excluidas', () => {
    const a = allocateSpending(items, [tx({ kind: 'transfer' }), tx({ excluded: true })], cats);
    expect(a.byItem.get('i-comida')).toBe(0);
    expect(a.unplanned.expense).toBe(0);
  });
});

describe('itemStatus', () => {
  it('fijos: pendiente / parcial / pagado', () => {
    const fixed = { kind: 'expense' as const, isFixed: true, plannedMinor: 2000 };
    expect(itemStatus(fixed, 0)).toBe('pending');
    expect(itemStatus(fixed, 500)).toBe('partial');
    expect(itemStatus(fixed, 2000)).toBe('paid');
  });
  it('variables: ok / cerca / te pasaste', () => {
    const v = { kind: 'expense' as const, isFixed: false, plannedMinor: 10000 };
    expect(itemStatus(v, 7999)).toBe('ok');
    expect(itemStatus(v, 8000)).toBe('near');
    expect(itemStatus(v, 10000)).toBe('near');
    expect(itemStatus(v, 10001)).toBe('over');
  });
  it('progreso acotado a 1', () => {
    expect(progressOf(100, 250)).toBe(1);
    expect(progressOf(0, 0)).toBe(0);
    expect(progressOf(200, 50)).toBe(0.25);
  });
});

describe('budgetTotals', () => {
  it('replica el ejemplo del diseño: sobra = ingresos plan − gastos plan', () => {
    const t = budgetTotals(items, new Map([['i-comida', 31628], ['i-ropa', 30155], ['i-sueldo', 0]]));
    expect(t.plannedExpense).toBe(63000);
    expect(t.spentPlanned).toBe(61783);
    expect(t.leftover).toBe(57000);
    expect(t.percent).toBeCloseTo(0.98, 2);
  });
});

describe('previousBudgetMonth / validateBudgetItem', () => {
  it('elige el mes anterior más cercano con partidas', () => {
    expect(previousBudgetMonth('2026-10', ['2026-07', '2026-09', '2026-11'])).toBe('2026-09');
    expect(previousBudgetMonth('2026-10', ['2026-11'])).toBeNull();
  });
  it('valida categoría, tipo, duplicado y monto', () => {
    const ok = { categoryId: 'a', categoryKind: 'expense' as const, kind: 'expense' as const, plannedMinor: 100, takenCategoryIds: [] };
    expect(validateBudgetItem(ok)).toBeNull();
    expect(validateBudgetItem({ ...ok, categoryId: null })).toMatch(/categoría/);
    expect(validateBudgetItem({ ...ok, kind: 'income' })).toMatch(/tipo/);
    expect(validateBudgetItem({ ...ok, takenCategoryIds: ['a'] })).toMatch(/ya está/);
    expect(validateBudgetItem({ ...ok, plannedMinor: 0 })).toMatch(/mayor a 0/);
  });
});
