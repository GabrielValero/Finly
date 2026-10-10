import { formatMoney, type Currency } from './money';
import { groupByDay, monthTotals, type SummaryTx } from './summary';
import { usdEquivalent } from './transactions';
import { collapseTransfers, type CollapsibleTx } from './transfers';
import { formatDayLabel } from './dates';

/** Lo que necesita una fila de movimiento para pintarse (subconjunto estructural de `TxRow`). */
export interface MovementTx extends SummaryTx, CollapsibleTx {
  listedCurrency: Currency | null;
  categoryIcon: string | null;
  categoryName: string | null;
  concept: string;
  accountName: string;
}

export interface MovementRowVm {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  amount: string;
  tone: 'default' | 'income';
  caption: string | null;
}

export interface MovementGroupVm {
  day: string;
  label: string;
  total: string;
  rows: MovementRowVm[];
}

/** Valor en USD si se puede calcular (Bs sin tasa -> null). */
export function safeUsd(tx: Pick<MovementTx, 'accountCurrency' | 'amountMinor' | 'rateScaled'>): number | null {
  try {
    return usdEquivalent(tx);
  } catch {
    return null;
  }
}

export function signedMoney(minor: number, currency: Currency): string {
  return `${minor > 0 ? '+' : ''}${formatMoney(minor, currency)}`;
}

/**
 * - `usd`: historial general; cada monto en USD con la tasa congelada y las transferencias como un solo movimiento.
 * - `native`: vista de UNA cuenta; cada monto en la moneda de la cuenta y cada pata de transferencia es su propia fila.
 */
export type RowMode = 'usd' | 'native';

export function toRow(tx: MovementTx, mode: RowMode = 'usd'): MovementRowVm {
  const isTransfer = tx.kind === 'transfer';
  const originalInBs = tx.listedCurrency === 'VES' || (tx.accountCurrency === 'VES' && tx.listedCurrency === null);
  const usd = safeUsd(tx);
  const amount = mode === 'native' ? signedMoney(tx.amountMinor, tx.accountCurrency) : usd === null ? formatMoney(tx.amountMinor, tx.accountCurrency) : signedMoney(usd, 'USD');
  return {
    id: tx.id,
    icon: isTransfer ? 'transfer' : (tx.categoryIcon ?? 'wallet'),
    title: tx.concept.trim() || (isTransfer ? 'Transferencia' : (tx.categoryName ?? 'Movimiento')),
    subtitle: mode === 'native' ? (isTransfer ? 'TRANSFERENCIA' : (tx.categoryName ?? 'SIN CATEGORÍA').toUpperCase()) : tx.accountName.toUpperCase(),
    amount,
    tone: tx.kind === 'income' || (isTransfer && tx.amountMinor > 0) ? 'income' : 'default',
    caption: mode === 'usd' && originalInBs ? 'en Bs' : null,
  };
}

/** Una transferencia es un solo movimiento en el historial: sale de A y llega a B. */
export function toTransferRow(out: MovementTx, incoming: MovementTx): MovementRowVm {
  const sameMoney = out.accountCurrency === incoming.accountCurrency && -out.amountMinor === incoming.amountMinor;
  return {
    id: out.id,
    icon: 'transfer',
    title: out.concept.trim() || `${out.accountName} → ${incoming.accountName}`,
    subtitle: 'TRANSFERENCIA',
    amount: formatMoney(-out.amountMinor, out.accountCurrency),
    tone: 'default',
    caption: sameMoney ? null : `→ ${formatMoney(incoming.amountMinor, incoming.accountCurrency)}`,
  };
}

interface GroupOptions {
  mode: RowMode;
  today: string;
  /** Categorías que no cuentan en reportes (solo afecta al total del día en modo `usd`). */
  excluded: ReadonlySet<string>;
}

/** Agrupa por día (más reciente primero) con el total neto de cada día. */
export function buildMovementGroups<T extends MovementTx>(rows: readonly T[], { mode, today, excluded }: GroupOptions): MovementGroupVm[] {
  return groupByDay(rows).map((g) => {
    if (mode === 'native') {
      const currency = g.items[0]?.accountCurrency ?? 'USD';
      const net = g.items.reduce((sum, t) => sum + t.amountMinor, 0);
      return { day: g.day, label: formatDayLabel(g.day, today), total: signedMoney(net, currency), rows: g.items.map((t) => toRow(t, 'native')) };
    }
    const totals = monthTotals(g.items, excluded);
    const net = totals.incomeUsdMinor - totals.expenseUsdMinor;
    return {
      day: g.day,
      label: formatDayLabel(g.day, today),
      total: signedMoney(net, 'USD'),
      rows: collapseTransfers(g.items).map((item) => (item.type === 'transfer' ? toTransferRow(item.out, item.incoming) : toRow(item.row))),
    };
  });
}

/** Entradas y salidas de una cuenta en el mes (todas las patas, transferencias incluidas): cuadra con el cambio de saldo. */
export function accountFlow(rows: readonly Pick<MovementTx, 'amountMinor'>[]): { inMinor: number; outMinor: number } {
  let inMinor = 0;
  let outMinor = 0;
  for (const r of rows) {
    if (r.amountMinor > 0) inMinor += r.amountMinor;
    else outMinor += -r.amountMinor;
  }
  return { inMinor, outMinor };
}
