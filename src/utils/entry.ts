import { MoneyError, usdToVes, vesToUsd, type Currency } from './money';
import { needsRate, type RateSource } from './rates';

export interface EntryInput {
  /** Monto tecleado (magnitud, > 0) en la moneda elegida por el usuario. */
  enteredMinor: number;
  enteredCurrency: Currency;
  accountCurrency: Currency;
  rateScaled: number | null;
  rateSource: RateSource | null;
}

export interface ResolvedEntry {
  /** Magnitud en la moneda de la cuenta. */
  amountMinor: number;
  listedAmountMinor: number | null;
  listedCurrency: Currency | null;
  rateScaled: number | null;
  rateSource: RateSource | null;
}

/**
 * Traduce lo que el usuario tecleó a lo que se guarda, respetando la regla de tasa:
 * - Siempre se guarda el monto en la moneda de la cuenta.
 * - Si lo tecleado está en otra moneda, queda como "precio listado".
 * - La tasa se guarda solo cuando interviene (cuenta en Bs, o precio listado en otra moneda).
 */
export function resolveEntry(input: EntryInput): ResolvedEntry {
  const { enteredMinor, enteredCurrency, accountCurrency, rateScaled, rateSource } = input;
  if (!Number.isInteger(enteredMinor) || enteredMinor <= 0) throw new MoneyError('Monto inválido');

  const listedCurrency = enteredCurrency === accountCurrency ? null : enteredCurrency;
  const rateRequired = needsRate(accountCurrency, listedCurrency);
  if (rateRequired && (rateScaled === null || rateSource === null)) {
    throw new MoneyError('Falta la tasa del día');
  }

  let amountMinor = enteredMinor;
  if (listedCurrency === 'VES') amountMinor = vesToUsd(enteredMinor, rateScaled!);
  if (listedCurrency === 'USD') amountMinor = usdToVes(enteredMinor, rateScaled!);
  if (amountMinor <= 0) throw new MoneyError('El monto es demasiado pequeño al convertirlo');

  return {
    amountMinor,
    listedAmountMinor: listedCurrency ? enteredMinor : null,
    listedCurrency,
    rateScaled: rateRequired ? rateScaled : null,
    rateSource: rateRequired ? rateSource : null,
  };
}
