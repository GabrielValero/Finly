import { describe, expect, it } from 'vitest';
import { expenseMoney, formatQuantity, limitStatus, lineUsd, parseQuantity, planPurchase, summarizeList, type ShopItemLike } from '../src/utils/shopping';

const item = (o: Partial<ShopItemLike> & { id: string }): ShopItemLike => ({
  quantityMilli: 1000,
  priceMinor: 100,
  priceCurrency: 'USD',
  categoryId: null,
  checked: false,
  purchasedAt: null,
  ...o,
});

describe('cantidades', () => {
  it('parsea y formatea', () => {
    expect(parseQuantity('2')).toBe(2000);
    expect(parseQuantity('0,5')).toBe(500);
    expect(parseQuantity('1.25')).toBe(1250);
    expect(formatQuantity(1000)).toBe('1');
    expect(formatQuantity(500)).toBe('0,5');
    expect(formatQuantity(1250)).toBe('1,25');
  });
  it('rechaza inválidas', () => {
    expect(() => parseQuantity('0')).toThrow();
    expect(() => parseQuantity('abc')).toThrow();
    expect(() => parseQuantity('1,2345')).toThrow();
  });
});

describe('lineUsd', () => {
  it('USD x cantidad', () => expect(lineUsd(item({ id: 'a', priceMinor: 250, quantityMilli: 2000 }), null)).toBe(500));
  it('Bs convierte con la tasa', () =>
    expect(lineUsd(item({ id: 'a', priceMinor: 87_500, priceCurrency: 'VES' }), 875_000_000)).toBe(100));
  it('Bs sin tasa o sin precio es null', () => {
    expect(lineUsd(item({ id: 'a', priceCurrency: 'VES' }), null)).toBeNull();
    expect(lineUsd(item({ id: 'a', priceMinor: null }), 1_000_000)).toBeNull();
  });
});

describe('summarizeList', () => {
  it('suma pendientes, separa marcados y cuenta incompletos; ignora comprados', () => {
    const t = summarizeList(
      [
        item({ id: '1', priceMinor: 200, checked: true }),
        item({ id: '2', priceMinor: 300 }),
        item({ id: '3', priceMinor: null }),
        item({ id: '4', priceCurrency: 'VES' }),
        item({ id: '5', priceMinor: 999, purchasedAt: new Date() }),
      ],
      null,
    );
    expect(t).toMatchObject({ pendingCount: 4, totalUsd: 500, checkedUsd: 200, checkedCount: 1, unpricedCount: 1, unconvertedCount: 1 });
  });
});

describe('limitStatus', () => {
  it('estados', () => {
    expect(limitStatus(100, null).state).toBe('none');
    expect(limitStatus(5000, 10_000).state).toBe('ok');
    expect(limitStatus(9000, 10_000).state).toBe('near');
    expect(limitStatus(10_001, 10_000)).toMatchObject({ state: 'over', remainingMinor: -1 });
  });
});

describe('planPurchase', () => {
  it('agrupa por categoría efectiva (propia o de la lista)', () => {
    const plan = planPurchase(
      [item({ id: '1', priceMinor: 100 }), item({ id: '2', priceMinor: 250, categoryId: 'salud' }), item({ id: '3', priceMinor: 50 })],
      'mercado',
      null,
    );
    expect(plan.groups).toEqual([
      { categoryId: 'mercado', usdMinor: 150, itemIds: ['1', '3'] },
      { categoryId: 'salud', usdMinor: 250, itemIds: ['2'] },
    ]);
  });
  it('reporta los que no se pueden registrar', () => {
    const plan = planPurchase([item({ id: '1', priceMinor: null }), item({ id: '2', priceCurrency: 'VES' }), item({ id: '3' })], null, null);
    expect(plan.groups).toEqual([]);
    expect(plan.skipped).toEqual({ noPrice: ['1'], noRate: ['2'], noCategory: ['3'] });
  });
});

describe('expenseMoney', () => {
  it('cuenta USD: sin tasa', () => {
    expect(expenseMoney('USD', 1500, null)).toEqual({ amountMinor: -1500, rateScaled: null, rateSource: null, listedAmountMinor: null, listedCurrency: null });
  });
  it('cuenta Bs: convierte y guarda snapshot', () => {
    expect(expenseMoney('VES', 1000, { rateScaled: 875_000_000, source: 'bcv' })).toEqual({
      amountMinor: -875_000,
      rateScaled: 875_000_000,
      rateSource: 'bcv',
      listedAmountMinor: 1000,
      listedCurrency: 'USD',
    });
  });
  it('cuenta Bs sin tasa lanza', () => expect(() => expenseMoney('VES', 1000, null)).toThrow());
});

import { resolveListRate, sortItems } from '../src/utils/shopping';

describe('resolveListRate', () => {
  const rates = [
    { source: 'bcv' as const, rateScaled: 870_000_000, validFrom: '2026-10-08' },
    { source: 'bcv' as const, rateScaled: 875_000_000, validFrom: '2026-10-09' },
    { source: 'manual' as const, rateScaled: 900_000_000, validFrom: '2026-10-10' },
  ];
  it('bcv toma la última BCV aunque haya una manual más nueva', () =>
    expect(resolveListRate({ rateMode: 'bcv', manualRateScaled: null }, rates)).toEqual({ rateScaled: 875_000_000, source: 'bcv' }));
  it('manual usa la fijada', () =>
    expect(resolveListRate({ rateMode: 'manual', manualRateScaled: 880_000_000 }, rates)).toEqual({ rateScaled: 880_000_000, source: 'manual' }));
  it('sin tasas es null', () => expect(resolveListRate({ rateMode: 'bcv', manualRateScaled: null }, [])).toBeNull());
});

describe('sortItems', () => {
  it('pendientes primero, deseos por prioridad, comprados al final', () => {
    const mk = (id: string, priority: 'low' | 'medium' | 'high' | null, purchased: boolean, sortOrder: number) => ({ id, priority, purchasedAt: purchased ? new Date() : null, sortOrder });
    const out = sortItems([mk('a', 'low', false, 0), mk('b', 'high', false, 1), mk('c', 'high', true, 2), mk('d', null, false, 3)], 'wish');
    expect(out.map((i) => i.id)).toEqual(['b', 'a', 'd', 'c']);
  });
});
