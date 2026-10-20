import { usdToVes, vesToUsd, type Currency } from './money';
import { pickLatestRate, type RateRecord, type RateSource } from './rates';

/** Convierte un monto (unidades menores) de `from` a la otra moneda con la tasa dada (Bs por USD, escalada). */
export function convertAmount(minor: number, from: Currency, rateScaled: number): number {
  return from === 'USD' ? usdToVes(minor, rateScaled) : vesToUsd(minor, rateScaled);
}

export interface CalcRateOption {
  source: RateSource;
  rateScaled: number;
  validFrom: string;
}

/** Última tasa de cada fuente disponible (BCV primero), para elegir con cuál calcular. */
export function latestRatePerSource(rates: readonly RateRecord[]): CalcRateOption[] {
  const out: CalcRateOption[] = [];
  for (const source of ['bcv', 'manual'] as const) {
    const latest = pickLatestRate(rates.filter((r) => r.source === source), source);
    if (latest) out.push({ source, rateScaled: latest.rateScaled, validFrom: latest.validFrom });
  }
  return out;
}
