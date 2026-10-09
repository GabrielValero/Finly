/**
 * Dinero en Finly.
 *
 * - Los montos viven como enteros en unidades menores (centavos), siempre con 2 decimales.
 * - Las tasas son "Bs por 1 USD" escaladas x1.000.000 (`rate_scaled`).
 * - Toda multiplicación monto×tasa se hace con BigInt: en Bs los montos pueden
 *   superar 2^53 al multiplicarse por la escala.
 */

export const CURRENCIES = ['VES', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const RATE_SCALE = 1_000_000;
const RATE_SCALE_BIG = BigInt(RATE_SCALE);

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new MoneyError('Monto fuera de rango');
  }
  return Number(value);
}

/** División entera redondeando half-away-from-zero (BigInt). */
function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new MoneyError('División por cero');
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = (2n * n + d) / (2n * d);
  return negative ? -q : q;
}

/**
 * Parsea un número escrito a la venezolana ("4.500,00", "4500,5", "1.234.567,89")
 * y devuelve unidades menores. Nunca usa parseFloat.
 * Acepta solo magnitudes (sin signo): el signo lo da el tipo de movimiento.
 */
export function parseAmount(input: string): number {
  const raw = input.trim().replace(/\s+/g, '');
  if (raw === '') throw new MoneyError('Monto vacío');

  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(raw);
  if (!match) throw new MoneyError(`Monto inválido: "${input}"`);

  const integerPart = match[1]!.replace(/\./g, '');
  const decimalPart = (match[2] ?? '').padEnd(2, '0');
  return toSafeNumber(BigInt(integerPart) * 100n + BigInt(decimalPart));
}

/** Parsea una tasa ("36,5432", "36.5") a `rate_scaled` (6 decimales máx). */
export function parseRate(input: string): number {
  const raw = input.trim().replace(/\s+/g, '');
  if (raw === '') throw new MoneyError('Tasa vacía');

  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:[,.](\d{1,6}))?$/.exec(raw);
  if (!match) throw new MoneyError(`Tasa inválida: "${input}"`);

  const integerPart = match[1]!.replace(/\./g, '');
  const decimalPart = (match[2] ?? '').padEnd(6, '0');
  const scaled = BigInt(integerPart) * RATE_SCALE_BIG + BigInt(decimalPart);
  if (scaled <= 0n) throw new MoneyError('La tasa debe ser mayor a cero');
  return toSafeNumber(scaled);
}

/** 123456 -> "1.234,56". Mantiene el signo negativo. No depende de Intl (Hermes). */
export function formatMinor(minor: number): string {
  if (!Number.isInteger(minor)) throw new MoneyError('El monto debe ser entero');
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const integer = Math.floor(abs / 100).toString();
  const decimals = (abs % 100).toString().padStart(2, '0');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${decimals}`;
}

const SYMBOLS: Record<Currency, string> = { USD: '$', VES: 'Bs' };

export function formatMoney(minor: number, currency: Currency): string {
  const body = formatMinor(Math.abs(minor));
  const sign = minor < 0 ? '-' : '';
  return currency === 'USD' ? `${sign}$${body}` : `${sign}Bs ${body}`;
}

export function currencySymbol(currency: Currency): string {
  return SYMBOLS[currency];
}

/** rate_scaled -> "36,5432" (sin ceros finales innecesarios, mínimo 2 decimales). */
export function formatRate(rateScaled: number): string {
  const integer = Math.floor(rateScaled / RATE_SCALE);
  let decimals = (rateScaled % RATE_SCALE).toString().padStart(6, '0').replace(/0+$/, '');
  if (decimals.length < 2) decimals = decimals.padEnd(2, '0');
  return `${integer},${decimals}`;
}

/** USD (centavos) -> VES (centavos) con la tasa dada. */
export function usdToVes(usdMinor: number, rateScaled: number): number {
  assertRate(rateScaled);
  return toSafeNumber(divRound(BigInt(usdMinor) * BigInt(rateScaled), RATE_SCALE_BIG));
}

/** VES (centavos) -> USD (centavos) con la tasa dada. */
export function vesToUsd(vesMinor: number, rateScaled: number): number {
  assertRate(rateScaled);
  return toSafeNumber(divRound(BigInt(vesMinor) * RATE_SCALE_BIG, BigInt(rateScaled)));
}

/** Tasa implícita (Bs por USD, escalada) a partir de un monto en Bs y uno en USD. */
export function impliedRate(vesMinor: number, usdMinor: number): number {
  if (usdMinor === 0) throw new MoneyError('El monto en USD no puede ser cero');
  const rate = toSafeNumber(divRound(BigInt(Math.abs(vesMinor)) * RATE_SCALE_BIG, BigInt(Math.abs(usdMinor))));
  assertRate(rate);
  return rate;
}

function assertRate(rateScaled: number): void {
  if (!Number.isInteger(rateScaled) || rateScaled <= 0) {
    throw new MoneyError('Tasa inválida');
  }
}
