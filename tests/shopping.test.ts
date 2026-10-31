import { describe, expect, it } from 'vitest';
import { describePrice, ivaOf, lineIvaUsd, lineNative, formatQuantityUnit, expenseMoney, formatQuantity, limitStatus, lineUsd, parseQuantity, planPurchase, summarizeList, type ShopItemLike } from '../src/utils/shopping';

const item = (o: Partial<ShopItemLike> & { id: string }): ShopItemLike => ({
  quantityMilli: 1000,
  priceMinor: 100,
  priceCurrency: 'USD',
  taxable: false,
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

describe('unidades', () => {
  it('el precio es por unidad y se multiplica por la cantidad', () => {
    // 2,5 kg a $3,00 el kilo = $7,50
    expect(lineUsd(item({ id: 'a', priceMinor: 300, quantityMilli: 2500 }), null)).toBe(750);
    // En Bs: 2 unidades a Bs 875,00 = Bs 1.750,00 = $2,00 a 875
    expect(lineUsd(item({ id: 'a', priceMinor: 87_500, priceCurrency: 'VES', quantityMilli: 2000 }), 875_000_000)).toBe(200);
  });
  it('formatea cantidad y descripción', () => {
    expect(formatQuantityUnit(2500, 'kg')).toBe('2,5 kg');
    expect(formatQuantityUnit(3000, 'und')).toBe('3');
    expect(describePrice(2500, 'kg', '$3,00')).toBe('2,5 kg × $3,00/kg');
    expect(describePrice(1000, 'und', '$1,50')).toBe('$1,50');
    expect(describePrice(2000, 'und', '$1,50')).toBe('2 × $1,50');
  });
});

describe('IVA 16 %', () => {
  it('suma el IVA a la línea solo si el producto lo lleva', () => {
    expect(lineNative(item({ id: 'a', priceMinor: 1000, quantityMilli: 2000, taxable: true }))).toBe(2320);
    expect(lineNative(item({ id: 'b', priceMinor: 1000, quantityMilli: 2000 }))).toBe(2000);
    expect(lineNative(item({ id: 'c', priceMinor: null, taxable: true }))).toBeNull();
    expect(ivaOf(333)).toBe(53);
  });

  it('el total, el IVA y el plan de compra lo incluyen', () => {
    const items = [item({ id: '1', priceMinor: 1000, taxable: true }), item({ id: '2', priceMinor: 500 })];
    const totals = summarizeList(items, null);
    expect(totals.totalUsd).toBe(1660);
    expect(totals.ivaUsd).toBe(160);
    const plan = planPurchase(items.map((i) => ({ ...i, categoryId: 'c' })), null, null);
    expect(plan.groups[0]?.usdMinor).toBe(1660);
  });

  it('en Bs el IVA se calcula antes de convertir', () => {
    const it = item({ id: 'v', priceMinor: 100_000, priceCurrency: 'VES', taxable: true });
    expect(lineNative(it)).toBe(116_000);
    expect(lineUsd(it, 50_000_000)).toBe(2320);
    expect(lineIvaUsd(it, 50_000_000)).toBe(320);
    expect(lineIvaUsd(it, null)).toBe(0);
  });
});

import { buildPurchaseNote, isHistoryList, purchaseConcept, purchaseLine, purchaseNote, type PurchaseLineItem } from '../src/utils/shopping';

const line = (o: Partial<PurchaseLineItem> & { name: string }): PurchaseLineItem => ({ quantityMilli: 1000, unit: 'und', priceMinor: 100, priceCurrency: 'USD', taxable: false, ...o });

describe('descripción de la compra', () => {
  it('una línea por producto: cantidad solo si no es 1 und; monto original solo si se pagó en Bs', () => {
    expect(purchaseLine(line({ name: 'Arroz' }))).toBe('• Arroz');
    expect(purchaseLine(line({ name: 'Harina', quantityMilli: 2000 }))).toBe('• Harina × 2');
    expect(purchaseLine(line({ name: 'Queso', quantityMilli: 2500, unit: 'kg' }))).toBe('• Queso 2,5 kg');
    expect(purchaseLine(line({ name: 'Pan', priceMinor: 45_000, priceCurrency: 'VES' }))).toBe('• Pan (Bs 450,00)');
    // El monto de la línea incluye cantidad e IVA: 2 x Bs 100,00 + 16 % = Bs 232,00.
    expect(purchaseLine(line({ name: 'Aceite', priceMinor: 10_000, priceCurrency: 'VES', quantityMilli: 2000, taxable: true }))).toBe('• Aceite × 2 (Bs 232,00)');
  });

  it('une las líneas y es null sin productos', () => {
    expect(buildPurchaseNote([line({ name: 'Arroz' }), line({ name: 'Leche' })])).toBe('• Arroz\n• Leche');
    expect(buildPurchaseNote([])).toBeNull();
  });

  it('si no cabe, corta en una línea completa y resume el resto sin pasarse del tope', () => {
    const many = Array.from({ length: 60 }, (_, i) => line({ name: `Producto número ${i + 1}` }));
    const note = buildPurchaseNote(many, 200)!;
    expect(note.length).toBeLessThanOrEqual(200);
    const lines = note.split('\n');
    expect(lines[lines.length - 1]).toMatch(/^• … y \d+ más$/);
    const hidden = Number(/y (\d+) más/.exec(lines[lines.length - 1]!)![1]);
    expect(lines.length - 1 + hidden).toBe(60);
    expect(lines.slice(0, -1).every((l) => l.startsWith('• Producto número '))).toBe(true);
  });

  it('el título: en Deseos con un solo producto lleva su nombre; en Mercado, el de la lista', () => {
    expect(purchaseConcept('wish', 'Tecnología', [{ name: 'Teclado' }])).toBe('Teclado');
    expect(purchaseConcept('market', 'Mercado semanal', [{ name: 'Arroz' }])).toBe('Mercado semanal');
    expect(purchaseConcept('wish', 'Tecnología', [{ name: 'A' }, { name: 'B' }])).toBe('Tecnología');
  });

  it('un deseo simple no repite su nombre en la nota, pero sí si hay algo más que decir', () => {
    expect(purchaseNote('wish', [line({ name: 'Teclado' })])).toBeNull();
    expect(purchaseNote('wish', [line({ name: 'Teclado', priceMinor: 9_000_000, priceCurrency: 'VES' })])).toBe('• Teclado (Bs 90.000,00)');
    expect(purchaseNote('market', [line({ name: 'Arroz' })])).toBe('• Arroz');
  });

  it('historial: completadas o archivadas', () => {
    expect(isHistoryList({ completedAt: null, archivedAt: null })).toBe(false);
    expect(isHistoryList({ completedAt: new Date(), archivedAt: null })).toBe(true);
    expect(isHistoryList({ completedAt: null, archivedAt: new Date() })).toBe(true);
  });
});
