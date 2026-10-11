import { MoneyError, usdToVes, vesToUsd, type Currency } from './money';
import { pickLatestRate, type RateRecord, type RateSource } from './rates';

/** Tasa efectiva de una lista (la elegida por el usuario o la última BCV). */
export interface ListRate {
  rateScaled: number;
  source: RateSource;
}

export interface ShopItemLike {
  id: string;
  quantityMilli: number;
  priceMinor: number | null;
  priceCurrency: Currency;
  categoryId: string | null;
  checked: boolean;
  purchasedAt: Date | null;
}

/** "2", "0,5", "1.25" -> milésimas (1000 = 1). Máx. 3 decimales, mayor a cero. */
export function parseQuantity(input: string): number {
  const raw = input.trim().replace(/\s+/g, '');
  const match = /^(\d{1,6})(?:[,.](\d{1,3}))?$/.exec(raw);
  if (!match) throw new MoneyError(`Cantidad inválida: "${input}"`);
  const milli = Number(match[1]) * 1000 + Number((match[2] ?? '').padEnd(3, '0'));
  if (milli <= 0) throw new MoneyError('La cantidad debe ser mayor a cero');
  return milli;
}

/** 1000 -> "1"; 500 -> "0,5"; 1250 -> "1,25". */
export function formatQuantity(milli: number): string {
  const whole = Math.floor(milli / 1000);
  const frac = (milli % 1000).toString().padStart(3, '0').replace(/0+$/, '');
  return frac === '' ? String(whole) : `${whole},${frac}`;
}

/** Total de la línea en su moneda (precio unitario x cantidad); null si no tiene precio. */
export function lineNative(item: Pick<ShopItemLike, 'priceMinor' | 'quantityMilli'>): number | null {
  if (item.priceMinor === null) return null;
  return Math.round((item.priceMinor * item.quantityMilli) / 1000);
}

/** Total de la línea en USD; null si no tiene precio o está en Bs y no hay tasa. */
export function lineUsd(item: ShopItemLike, rate: number | null): number | null {
  const native = lineNative(item);
  if (native === null) return null;
  if (item.priceCurrency === 'USD') return native;
  return rate === null ? null : vesToUsd(native, rate);
}

export interface ListTotals {
  /** Productos que aún no se compraron. */
  pendingCount: number;
  /** Suma en USD de todos los pendientes con precio convertible. */
  totalUsd: number;
  /** Lo ya marcado en el carrito (subconjunto de totalUsd). */
  checkedUsd: number;
  checkedCount: number;
  /** Pendientes sin precio. */
  unpricedCount: number;
  /** Pendientes en Bs que no se pueden convertir por falta de tasa. */
  unconvertedCount: number;
}

export function summarizeList(items: readonly ShopItemLike[], rate: number | null): ListTotals {
  const out: ListTotals = { pendingCount: 0, totalUsd: 0, checkedUsd: 0, checkedCount: 0, unpricedCount: 0, unconvertedCount: 0 };
  for (const it of items) {
    if (it.purchasedAt !== null) continue;
    out.pendingCount += 1;
    if (it.checked) out.checkedCount += 1;
    const usd = lineUsd(it, rate);
    if (usd === null) {
      if (it.priceMinor === null) out.unpricedCount += 1;
      else out.unconvertedCount += 1;
      continue;
    }
    out.totalUsd += usd;
    if (it.checked) out.checkedUsd += usd;
  }
  return out;
}

export type LimitState = 'none' | 'ok' | 'near' | 'over';

export function limitStatus(spentUsd: number, limitMinor: number | null): { state: LimitState; remainingMinor: number; ratio: number } {
  if (limitMinor === null || limitMinor <= 0) return { state: 'none', remainingMinor: 0, ratio: 0 };
  const ratio = spentUsd / limitMinor;
  const state: LimitState = spentUsd > limitMinor ? 'over' : ratio >= 0.85 ? 'near' : 'ok';
  return { state, remainingMinor: limitMinor - spentUsd, ratio };
}

/** Categoría efectiva: la propia del producto o, si no tiene, la de la lista. */
export function effectiveCategoryId(item: Pick<ShopItemLike, 'categoryId'>, listCategoryId: string | null): string | null {
  return item.categoryId ?? listCategoryId;
}

export interface PurchaseGroup {
  categoryId: string;
  usdMinor: number;
  itemIds: string[];
}

export interface PurchasePlan {
  groups: PurchaseGroup[];
  /** Productos que no se pueden registrar y por qué. */
  skipped: { noPrice: string[]; noRate: string[]; noCategory: string[] };
}

/** Agrupa los productos a comprar en un gasto por categoría efectiva. Los que no se pueden valorar se reportan aparte. */
export function planPurchase(items: readonly ShopItemLike[], listCategoryId: string | null, rate: number | null): PurchasePlan {
  const byCategory = new Map<string, PurchaseGroup>();
  const skipped: PurchasePlan['skipped'] = { noPrice: [], noRate: [], noCategory: [] };
  for (const it of items) {
    const usd = lineUsd(it, rate);
    if (usd === null) {
      (it.priceMinor === null ? skipped.noPrice : skipped.noRate).push(it.id);
      continue;
    }
    const categoryId = effectiveCategoryId(it, listCategoryId);
    if (categoryId === null) {
      skipped.noCategory.push(it.id);
      continue;
    }
    const group = byCategory.get(categoryId) ?? { categoryId, usdMinor: 0, itemIds: [] };
    group.usdMinor += usd;
    group.itemIds.push(it.id);
    byCategory.set(categoryId, group);
  }
  // Un gasto de monto cero violaría tx_amount_nonzero: se omite el grupo (los productos quedan sin registrar).
  const groups = [...byCategory.values()].filter((g) => g.usdMinor > 0);
  return { groups, skipped };
}

export interface ExpenseMoney {
  amountMinor: number;
  rateScaled: number | null;
  rateSource: RateSource | null;
  listedAmountMinor: number | null;
  listedCurrency: Currency | null;
}

/**
 * Campos de dinero del gasto para una cuenta. Cuenta USD: el monto tal cual, sin tasa.
 * Cuenta Bs: monto convertido, tasa como snapshot y el USD listado (regla tx_rate_rule).
 */
export function expenseMoney(accountCurrency: Currency, usdMinor: number, rate: ListRate | null): ExpenseMoney {
  if (accountCurrency === 'USD') {
    return { amountMinor: -usdMinor, rateScaled: null, rateSource: null, listedAmountMinor: null, listedCurrency: null };
  }
  if (rate === null) throw new MoneyError('Falta la tasa para pagar desde una cuenta en Bs');
  return {
    amountMinor: -usdToVes(usdMinor, rate.rateScaled),
    rateScaled: rate.rateScaled,
    rateSource: rate.source,
    listedAmountMinor: usdMinor,
    listedCurrency: 'USD',
  };
}

export const LIST_KIND_LABEL = { market: 'Mercado', wish: 'Deseos' } as const;
export const PRIORITY_LABEL = { high: 'Alta', medium: 'Media', low: 'Baja' } as const;
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

/**
 * Tasa efectiva de una lista: la manual fijada, o la última BCV (si no hay ninguna BCV, la más reciente de cualquier fuente).
 */
export function resolveListRate(
  list: { rateMode: 'bcv' | 'manual'; manualRateScaled: number | null },
  rates: readonly (RateRecord & { fetchedAt?: Date })[],
): ListRate | null {
  if (list.rateMode === 'manual') return list.manualRateScaled === null ? null : { rateScaled: list.manualRateScaled, source: 'manual' };
  const latest = pickLatestRate(rates, 'bcv');
  return latest ? { rateScaled: latest.rateScaled, source: latest.source } : null;
}

/** Orden de pantalla: pendientes primero (en deseos, por prioridad), comprados al final; estable por `sortOrder`. */
export function sortItems<T extends { purchasedAt: Date | null; priority: 'low' | 'medium' | 'high' | null; sortOrder: number }>(items: readonly T[], kind: 'market' | 'wish'): T[] {
  const rank = (i: T) => (kind === 'wish' && i.priority ? PRIORITY_RANK[i.priority] : 3);
  return [...items].sort((a, b) => {
    if ((a.purchasedAt === null) !== (b.purchasedAt === null)) return a.purchasedAt === null ? -1 : 1;
    return rank(a) - rank(b) || a.sortOrder - b.sortOrder;
  });
}
