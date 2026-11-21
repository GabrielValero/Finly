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
  it('agrupa las subcategorías bajo su padre y toma nombre, ícono y color del padre', () => {
    const child = (id: string, cat: string) =>
      tx(id, cat, { categoryParentId: 'p', categoryParentName: 'Comida', categoryParentIcon: 'food', categoryParentColor: '#F5B544', categoryName: cat });
    const rows = [child('1', 'cafe'), child('2', 'almuerzo'), tx('3', 'otra'), tx('4', 'otra')];
    const top = topCategories(rows, 2);
    expect(top[0]).toMatchObject({ categoryId: 'p', name: 'Comida', icon: 'food', color: '#F5B544', count: 2 });
    expect(top[1]).toMatchObject({ categoryId: 'otra', count: 2 });
  });
  it('omite las categorías excluidas de reportes', () => {
    const rows = [tx('1', 'prestamo'), tx('2', 'prestamo'), tx('3', 'comida')];
    expect(topCategories(rows, 3, new Set(['prestamo'])).map((c) => c.categoryId)).toEqual(['comida']);
  });
  it('trae nombre, ícono y color', () => {
    expect(topCategories([tx('1', 'a', { categoryName: 'Comida', categoryColor: null })], 1)[0]).toMatchObject({ name: 'Comida', icon: 'tag', color: null, count: 1 });
  });
});
