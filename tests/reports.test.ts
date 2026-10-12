import { describe, expect, it } from 'vitest';
import { expenseByCategory, expenseByTag, monthlyFlow, percentChange, totalsOf, type ReportTx } from '../src/utils/reports';

const tx = (o: Partial<ReportTx> & { id: string }): ReportTx => ({
  kind: 'expense',
  accountCurrency: 'USD',
  amountMinor: -1000,
  rateScaled: null,
  categoryId: 'comida',
  occurredAt: '2026-10-05T12:00:00',
  excluded: false,
  ...o,
});

const cats = [
  { id: 'comida', name: 'Comida', parentId: null },
  { id: 'rest', name: 'Restaurantes', parentId: 'comida' },
  { id: 'hogar', name: 'Hogar', parentId: null },
];

describe('totalsOf', () => {
  it('suma en USD con tasa congelada, sin transferencias ni excluidas', () => {
    const t = totalsOf([
      tx({ id: '1', amountMinor: -500 }),
      tx({ id: '2', accountCurrency: 'VES', amountMinor: -87_500, rateScaled: 875_000_000 }), // $1,00
      tx({ id: '3', kind: 'income', amountMinor: 2000 }),
      tx({ id: '4', kind: 'transfer', amountMinor: -9999 }),
      tx({ id: '5', excluded: true, amountMinor: -7777 }),
    ]);
    expect(t).toEqual({ incomeUsdMinor: 2000, expenseUsdMinor: 600, unvalued: 0 });
  });
  it('cuenta los Bs sin tasa como no valorados', () => {
    expect(totalsOf([tx({ id: '1', accountCurrency: 'VES', rateScaled: null })]).unvalued).toBe(1);
  });
});

describe('expenseByCategory', () => {
  it('agrupa subcategorías en su padre y ordena de mayor a menor', () => {
    const slices = expenseByCategory(
      [tx({ id: '1', amountMinor: -300 }), tx({ id: '2', categoryId: 'rest', amountMinor: -200 }), tx({ id: '3', categoryId: 'hogar', amountMinor: -1500 })],
      cats,
    );
    expect(slices.map((s) => [s.label, s.usdMinor])).toEqual([['Hogar', 1500], ['Comida', 500]]);
    expect(slices[0]!.share).toBeCloseTo(0.75);
  });
  it('categoría desconocida o nula va a "Sin categoría"', () => {
    expect(expenseByCategory([tx({ id: '1', categoryId: null })], cats)[0]?.label).toBe('Sin categoría');
  });
});

describe('expenseByTag', () => {
  it('un movimiento con dos etiquetas suma en ambas', () => {
    const slices = expenseByTag(
      [tx({ id: '1', amountMinor: -400 }), tx({ id: '2', amountMinor: -100 })],
      [{ transactionId: '1', tagId: 'a' }, { transactionId: '1', tagId: 'b' }, { transactionId: '2', tagId: 'a' }],
      [{ id: 'a', name: 'Prestamo' }, { id: 'b', name: 'Ahorros' }],
    );
    expect(slices.map((s) => [s.label, s.usdMinor])).toEqual([['#Prestamo', 500], ['#Ahorros', 400]]);
  });
});

describe('monthlyFlow', () => {
  it('devuelve N meses consecutivos incluyendo los vacíos', () => {
    const flow = monthlyFlow(
      [tx({ id: '1', amountMinor: -100, occurredAt: '2026-10-01T10:00:00' }), tx({ id: '2', kind: 'income', amountMinor: 900, occurredAt: '2026-08-15T10:00:00' })],
      '2026-10',
      3,
    );
    expect(flow).toEqual([
      { month: '2026-08', incomeUsdMinor: 900, expenseUsdMinor: 0 },
      { month: '2026-09', incomeUsdMinor: 0, expenseUsdMinor: 0 },
      { month: '2026-10', incomeUsdMinor: 0, expenseUsdMinor: 100 },
    ]);
  });
  it('cruza el cambio de año', () => {
    expect(monthlyFlow([], '2026-01', 3).map((m) => m.month)).toEqual(['2025-11', '2025-12', '2026-01']);
  });
});

describe('percentChange', () => {
  it('variación entera y sin base', () => {
    expect(percentChange(1000, 1250)).toBe(25);
    expect(percentChange(1000, 500)).toBe(-50);
    expect(percentChange(0, 500)).toBeNull();
  });
});

import { topSlices } from '../src/utils/reports';

describe('topSlices', () => {
  const s = (key: string, usdMinor: number) => ({ key, label: key, usdMinor, share: usdMinor / 100 });
  it('junta el resto en Otras', () => {
    const out = topSlices([s('a', 40), s('b', 30), s('c', 20), s('d', 10)], 3);
    expect(out.map((x) => [x.label, x.usdMinor])).toEqual([['a', 40], ['b', 30], ['Otras', 30]]);
  });
  it('no toca listas cortas', () => expect(topSlices([s('a', 1)], 3)).toHaveLength(1));
});
