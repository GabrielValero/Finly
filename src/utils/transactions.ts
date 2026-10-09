import { impliedRate, MoneyError, vesToUsd, type Currency } from './money';
import { needsRate, type RateSource } from './rates';

export type TransactionKind = 'income' | 'expense' | 'transfer';

/** Forma mínima que necesitan los cálculos puros (subconjunto de la fila de BD). */
export interface TxLike {
  accountId: string;
  accountCurrency: Currency;
  kind: TransactionKind;
  /** Con signo, en la moneda de la cuenta. */
  amountMinor: number;
  rateScaled: number | null;
  deletedAt?: number | null;
}

/** Saldo = apertura + suma de movimientos vivos de la cuenta. Siempre derivado. */
export function accountBalance(openingMinor: number, accountId: string, txs: readonly TxLike[]): number {
  let total = openingMinor;
  for (const tx of txs) {
    if (tx.accountId === accountId && !tx.deletedAt) total += tx.amountMinor;
  }
  return total;
}

/** Equivalente en USD con la tasa congelada en el movimiento (nunca la de hoy). */
export function usdEquivalent(tx: Pick<TxLike, 'accountCurrency' | 'amountMinor' | 'rateScaled'>): number {
  if (tx.accountCurrency === 'USD') return tx.amountMinor;
  if (tx.rateScaled === null) throw new MoneyError('Movimiento en Bs sin tasa');
  return vesToUsd(tx.amountMinor, tx.rateScaled);
}

export interface TransferAccount {
  id: string;
  currency: Currency;
}

export interface TransferLeg {
  accountId: string;
  accountCurrency: Currency;
  kind: 'transfer';
  /** Negativo en la salida, positivo en la entrada. */
  amountMinor: number;
  transferId: string;
  rateScaled: number | null;
  rateSource: RateSource | null;
}

/**
 * Construye las dos patas de una transferencia. Cada pata va en la moneda de su cuenta.
 * Si las monedas difieren, la tasa implícita (Bs por USD) se guarda en ambas patas.
 */
export function buildTransfer(args: {
  from: TransferAccount;
  to: TransferAccount;
  /** Monto que sale (magnitud, > 0). */
  outMinor: number;
  /** Monto que entra (magnitud, > 0). */
  inMinor: number;
  transferId: string;
}): [out: TransferLeg, incoming: TransferLeg] {
  const { from, to, outMinor, inMinor, transferId } = args;
  if (from.id === to.id) throw new MoneyError('Origen y destino deben ser distintas');
  if (outMinor <= 0 || inMinor <= 0) throw new MoneyError('Los montos deben ser positivos');
  if (from.currency === to.currency && outMinor !== inMinor) {
    throw new MoneyError('Misma moneda: los montos deben coincidir');
  }

  let rateScaled: number | null = null;
  if (from.currency !== to.currency) {
    const ves = from.currency === 'VES' ? outMinor : inMinor;
    const usd = from.currency === 'USD' ? outMinor : inMinor;
    rateScaled = impliedRate(ves, usd);
  }
  const rateSource: RateSource | null = rateScaled === null ? null : 'manual';

  return [
    { accountId: from.id, accountCurrency: from.currency, kind: 'transfer', amountMinor: -outMinor, transferId, rateScaled, rateSource },
    { accountId: to.id, accountCurrency: to.currency, kind: 'transfer', amountMinor: inMinor, transferId, rateScaled, rateSource },
  ];
}

/** Aplica el signo según el tipo: gasto negativo, ingreso positivo. */
export function signedAmount(kind: 'income' | 'expense', magnitudeMinor: number): number {
  if (magnitudeMinor <= 0) throw new MoneyError('El monto debe ser positivo');
  return kind === 'expense' ? -magnitudeMinor : magnitudeMinor;
}

/** Regla de dominio: ¿falta la tasa en este movimiento? */
export function missingRate(
  accountCurrency: Currency,
  listedCurrency: Currency | null,
  rateScaled: number | null,
): boolean {
  return needsRate(accountCurrency, listedCurrency) && rateScaled === null;
}
