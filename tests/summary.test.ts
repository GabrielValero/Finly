import { describe, expect, it } from 'vitest';
import { groupByDay, monthTotals, type SummaryTx } from '../src/utils/summary';
import { portfolioTotal } from '../src/utils/portfolio';

const tx = (p: Partial<SummaryTx>): SummaryTx => ({
  id: 'x', accountId: 'a', accountCurrency: 'USD', kind: 'expense', amountMinor: -1000, rateScaled: null,
  categoryId: 'c', occurredAt: '2026-10-09T10:00:00', ...p,
});

describe('monthTotals', () => {
  it('suma gastos e ingresos en USD con la tasa congelada', () => {
    const r = monthTotals([
      tx({ amountMinor: -1000 }),
      tx({ accountCurrency: 'VES', amountMinor: -36500, rateScaled: 36_500_000 }), // -$10
      tx({ kind: 'income', amountMinor: 35000 }),
    ]);
    expect(r).toEqual({ expenseUsdMinor: 2000, incomeUsdMinor: 35000 });
  });
  it('ignora transferencias, borrados y categorías excluidas', () => {
    const r = monthTotals(
      [tx({ kind: 'transfer', categoryId: null }), tx({ deletedAt: 1 }), tx({ categoryId: 'prestamos', amountMinor: -500 }), tx({ amountMinor: -300 })],
      new Set(['prestamos']),
    );
    expect(r).toEqual({ expenseUsdMinor: 300, incomeUsdMinor: 0 });
  });
});

describe('groupByDay', () => {
  it('agrupa y ordena de más reciente a más antiguo', () => {
    const g = groupByDay([
      { occurredAt: '2026-10-08T09:00:00', n: 1 },
      { occurredAt: '2026-10-09T08:00:00', n: 2 },
      { occurredAt: '2026-10-09T18:00:00', n: 3 },
    ]);
    expect(g.map((x) => x.day)).toEqual(['2026-10-09', '2026-10-08']);
    expect(g[0]!.items.map((i) => i.n)).toEqual([3, 2]);
  });
});

describe('portfolioTotal', () => {
  const accounts = [
    { currency: 'USD' as const, balanceMinor: 32000, includeInTotal: true },
    { currency: 'VES' as const, balanceMinor: 365000, includeInTotal: true }, // Bs 3.650 = $100
    { currency: 'USD' as const, balanceMinor: 99999, includeInTotal: false },
  ];
  it('valora Bs con la tasa y respeta includeInTotal', () => {
    expect(portfolioTotal(accounts, 36_500_000)).toEqual({ usdMinor: 42000, missingRate: false });
  });
  it('sin tasa avisa y no inventa', () => {
    expect(portfolioTotal(accounts, null)).toEqual({ usdMinor: 32000, missingRate: true });
  });
});
