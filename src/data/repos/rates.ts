import { db } from '../db';
import { exchangeRates } from '../schema';

export interface RateRow {
  id: string;
  source: 'bcv' | 'manual';
  rateScaled: number;
  validFrom: string;
  fetchedAt: Date;
}

/** Una tasa por (fuente, fecha): si ya existe, se corrige. */
export async function upsertRate(row: RateRow): Promise<void> {
  await db
    .insert(exchangeRates)
    .values({ ...row, base: 'USD', quote: 'VES' })
    .onConflictDoUpdate({
      target: [exchangeRates.base, exchangeRates.quote, exchangeRates.source, exchangeRates.validFrom],
      set: { rateScaled: row.rateScaled, fetchedAt: row.fetchedAt },
    });
}
