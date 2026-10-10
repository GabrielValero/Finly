import { usdToVes, vesToUsd, type Currency } from './money';

/**
 * Diferencia frente al mercado, en Bs: positivo = te rindió más que la tasa de referencia.
 * USD -> Bs: recibido - (enviado * tasa). Bs -> USD: (recibido * tasa) - enviado.
 * Misma moneda: no aplica.
 */
export function transferDifferenceVes(args: {
  fromCurrency: Currency;
  toCurrency: Currency;
  outMinor: number;
  inMinor: number;
  marketRateScaled: number;
}): number | null {
  const { fromCurrency, toCurrency, outMinor, inMinor, marketRateScaled } = args;
  if (fromCurrency === toCurrency || marketRateScaled <= 0) return null;
  return fromCurrency === 'USD'
    ? inMinor - usdToVes(outMinor, marketRateScaled)
    : usdToVes(inMinor, marketRateScaled) - outMinor;
}

/** Monto en la moneda destino que corresponde a `outMinor` según una tasa (para autocompletar). */
export function convertAtRate(outMinor: number, from: Currency, to: Currency, rateScaled: number): number {
  if (from === to) return outMinor;
  return from === 'USD' ? usdToVes(outMinor, rateScaled) : vesToUsd(outMinor, rateScaled);
}

export interface TransferLegRow {
  id: string;
  transferId: string | null;
  occurredAt: string;
  amountMinor: number;
  accountCurrency: Currency;
  accountName: string;
  rateScaled: number | null;
}

export interface TransferSummary {
  transferId: string;
  occurredAt: string;
  fromName: string;
  toName: string;
  outMinor: number;
  outCurrency: Currency;
  inMinor: number;
  inCurrency: Currency;
  rateScaled: number | null;
}

/** Une las dos patas de la transferencia más reciente. null si no hay o está incompleta. */
export function latestTransfer(rows: readonly TransferLegRow[]): TransferSummary | null {
  const sorted = [...rows].filter((r) => r.transferId !== null).sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
  const first = sorted[0];
  if (!first?.transferId) return null;
  const legs = sorted.filter((r) => r.transferId === first.transferId);
  const out = legs.find((l) => l.amountMinor < 0);
  const incoming = legs.find((l) => l.amountMinor > 0);
  if (!out || !incoming) return null;
  return {
    transferId: first.transferId,
    occurredAt: first.occurredAt,
    fromName: out.accountName,
    toName: incoming.accountName,
    outMinor: -out.amountMinor,
    outCurrency: out.accountCurrency,
    inMinor: incoming.amountMinor,
    inCurrency: incoming.accountCurrency,
    rateScaled: out.rateScaled,
  };
}

export interface CollapsibleTx {
  id: string;
  transferId: string | null;
  amountMinor: number;
  accountCurrency: Currency;
  accountName: string;
}

export type CollapsedItem<T extends CollapsibleTx> =
  | { type: 'tx'; row: T }
  | { type: 'transfer'; /** id de la pata de salida (la que abre el detalle) */ id: string; out: T; incoming: T };

/**
 * En el historial una transferencia es UN movimiento, aunque se guarde en dos filas.
 * Si falta una de las patas (dato incompleto) la fila queda tal cual.
 */
export function collapseTransfers<T extends CollapsibleTx>(rows: readonly T[]): CollapsedItem<T>[] {
  const byTransfer = new Map<string, T[]>();
  for (const r of rows) {
    if (r.transferId) byTransfer.set(r.transferId, [...(byTransfer.get(r.transferId) ?? []), r]);
  }
  const done = new Set<string>();
  const items: CollapsedItem<T>[] = [];
  for (const r of rows) {
    if (!r.transferId) {
      items.push({ type: 'tx', row: r });
      continue;
    }
    if (done.has(r.transferId)) continue;
    const legs = byTransfer.get(r.transferId) ?? [];
    const out = legs.find((l) => l.amountMinor < 0);
    const incoming = legs.find((l) => l.amountMinor > 0);
    if (out && incoming) {
      done.add(r.transferId);
      items.push({ type: 'transfer', id: out.id, out, incoming });
    } else {
      items.push({ type: 'tx', row: r });
    }
  }
  return items;
}
