import { describe, expect, it } from 'vitest';
import { balanceTrend, budgetPulse, type TrendTx } from '../src/utils/monthInsights';

const tx = (day: number, usd: number, kind: 'income' | 'expense' | 'transfer' = 'expense', over: Partial<TrendTx> = {}): TrendTx => ({
  id: `${day}-${usd}-${kind}`,
  accountId: 'a',
  accountCurrency: 'USD',
  kind,
  amountMinor: kind === 'expense' ? -usd : usd,
  rateScaled: null,
  categoryId: null,
  occurredAt: `2026-11-${String(day).padStart(2, '0')}T10:00:00`,
  ...over,
});

describe('balanceTrend', () => {
  it('acumula el neto diario', () => {
    const pts = balanceTrend([tx(1, 1000, 'income'), tx(2, 300), tx(2, 200), tx(4, 100)], '2026-11', 5);
    expect(pts).toEqual([1000, 500, 500, 400, 400]);
  });
  it('ignora transferencias y categorías excluidas', () => {
    const rows = [tx(1, 500, 'income'), tx(1, 999, 'transfer'), tx(1, 100, 'expense', { categoryId: 'x' })];
    expect(balanceTrend(rows, '2026-11', 2, new Set(['x']))).toEqual([500, 500]);
  });
  it('sin movimientos da ceros', () => {
    expect(balanceTrend([], '2026-11', 3)).toEqual([0, 0, 0]);
  });
  it('ignora movimientos de otro mes', () => {
    expect(balanceTrend([tx(1, 100, 'income', { occurredAt: '2026-10-31T10:00:00' })], '2026-11', 2)).toEqual([0, 0]);
  });
});

describe('budgetPulse', () => {
  it('devuelve null si no hay nada planificado', () => {
    expect(budgetPulse({ plannedMinor: 0, spentMinor: 500, today: '2026-11-10', month: '2026-11' })).toBeNull();
  });
  it('calcula lo que queda, por día, días restantes y porcentaje', () => {
    const p = budgetPulse({ plannedMinor: 100000, spentMinor: 40000, today: '2026-11-20', month: '2026-11' })!;
    expect(p.remainingMinor).toBe(60000);
    expect(p.daysLeft).toBe(11);
    expect(p.perDayMinor).toBe(5454);
    expect(p.pct).toBe(0.4);
    expect(p.over).toBe(false);
  });
  it('si se pasó marca over y el exceso', () => {
    const p = budgetPulse({ plannedMinor: 10000, spentMinor: 15000, today: '2026-11-20', month: '2026-11' })!;
    expect(p.over).toBe(true);
    expect(p.remainingMinor).toBe(-5000);
    expect(p.perDayMinor).toBe(0);
  });
  it('mes pasado: 0 días; mes futuro cuenta el mes entero', () => {
    expect(budgetPulse({ plannedMinor: 100, spentMinor: 10, today: '2026-12-05', month: '2026-11' })!.daysLeft).toBe(0);
    expect(budgetPulse({ plannedMinor: 3000, spentMinor: 0, today: '2026-10-05', month: '2026-11' })!.daysLeft).toBe(30);
  });
  it('el último día cuenta como 1 día restante', () => {
    expect(budgetPulse({ plannedMinor: 3000, spentMinor: 0, today: '2026-11-30', month: '2026-11' })!.daysLeft).toBe(1);
  });
});
