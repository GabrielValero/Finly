import type { Currency } from './money';

export type RateSource = 'bcv' | 'manual';

export interface RateRecord {
  source: RateSource;
  rateScaled: number;
  /** Fecha (YYYY-MM-DD) desde la que la tasa rige. */
  validFrom: string;
}

/**
 * ¿Un movimiento necesita snapshot de tasa?
 * - Cuenta en Bs: siempre (para poder expresarlo en USD).
 * - Cuenta en USD: solo si el precio se listó en otra moneda (p. ej. precio en Bs pagado en USD).
 */
export function needsRate(accountCurrency: Currency, listedCurrency: Currency | null): boolean {
  if (accountCurrency === 'VES') return true;
  return listedCurrency !== null && listedCurrency !== accountCurrency;
}

/** Fecha local YYYY-MM-DD de un ISO local ("2026-10-09T12:00:00"). */
export function dateOnly(isoLocal: string): string {
  return isoLocal.slice(0, 10);
}

/**
 * Tasa vigente para una fecha: la de mayor `validFrom <= fecha`.
 * Fines de semana y feriados no se tratan en código: la tasa del lunes
 * se registra con `validFrom` del sábado (dato, no lógica).
 */
export function resolveRate(
  rates: readonly RateRecord[],
  source: RateSource,
  date: string,
): RateRecord | null {
  let best: RateRecord | null = null;
  for (const rate of rates) {
    if (rate.source !== source || rate.validFrom > date) continue;
    if (best === null || rate.validFrom > best.validFrom) best = rate;
  }
  return best;
}

/**
 * Tasa "de hoy": la más reciente de la fuente preferida; si esa fuente no tiene ninguna,
 * la más reciente de cualquiera. `rates` puede venir en cualquier orden.
 */
export function pickLatestRate<T extends RateRecord & { fetchedAt?: Date }>(rates: readonly T[], preferred: RateSource): T | null {
  const newest = (list: readonly T[]): T | null =>
    list.reduce<T | null>((best, r) => {
      if (best === null) return r;
      if (r.validFrom !== best.validFrom) return r.validFrom > best.validFrom ? r : best;
      return (r.fetchedAt?.getTime() ?? 0) > (best.fetchedAt?.getTime() ?? 0) ? r : best;
    }, null);
  return newest(rates.filter((r) => r.source === preferred)) ?? newest(rates);
}
