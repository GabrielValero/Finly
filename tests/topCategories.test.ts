import { describe, expect, it } from 'vitest';
import { topCategories, type TopCategoryTx } from '../src/utils/topCategories';

const tx = (id: string, categoryId: string | null, over: Partial<TopCategoryTx> = {}): TopCategoryTx => ({
  id,
  kind: 'expense',
  accountCurrency: 'USD',
  amountMinor: -1000,
  rateScaled: null,
  categoryId,
  categoryName: categoryId,
  categoryIcon: 'tag',
  categoryColor: '#5B8DEF',
  ...over,
});

describe('topCategories', () => {
  it('ordena por cantidad de movimientos y corta en n', () => {
    const rows = [tx('1', 'a'), tx('2', 'b'), tx('3', 'b'), tx('4', 'c'), tx('5', 'c'), tx('6', 'c')];
    expect(topCategories(rows, 2).map((c) => c.categoryId)).toEqual(['c', 'b']);
  });
  it('desempata por monto', () => {
    const rows = [tx('1', 'a'), tx('2', 'b', { amountMinor: -5000 })];
    expect(topCategories(rows, 2).map((c) => c.categoryId)).toEqual(['b', 'a']);
  });
  it('ignora ingresos, transferencias y sin categoría', () => {
    const rows = [tx('1', 'a', { kind: 'income' }), tx('2', 'b', { kind: 'transfer' }), tx('3', null), tx('4', 'c')];
    expect(topCategories(rows, 3).map((c) => c.categoryId)).toEqual(['c']);
  });
  it('trae nombre, ícono y color', () => {
    expect(topCategories([tx('1', 'a', { categoryName: 'Comida', categoryColor: null })], 1)[0]).toMatchObject({ name: 'Comida', icon: 'tag', color: null, count: 1 });
  });
});
