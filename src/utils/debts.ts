import { vesToUsd, type Currency } from './money';

export type DebtDirection = 'owed_to_me' | 'i_owe';

export const DIRECTION_LABEL: Record<DebtDirection, string> = { owed_to_me: 'Me deben', i_owe: 'Debo' };

export interface DebtLike {
  id: string;
  direction: DebtDirection;
  currency: Currency;
  principalMinor: number;
  dueOn: string | null;
  openRateScaled: number | null;
}

/** Lo que falta por pagar (en la moneda de la deuda). Nunca negativo. */
export function remainingMinor(principalMinor: number, payments: readonly { amountMinor: number }[]): number {
  const paid = payments.reduce((s, p) => s + p.amountMinor, 0);
  return Math.max(principalMinor - paid, 0);
}

export type DebtStatus = 'settled' | 'overdue' | 'dueSoon' | 'open';

/** Saldada, vencida, por vencer (próximos 7 días) o abierta. Las fechas son YYYY-MM-DD. */
export function debtStatus(remaining: number, dueOn: string | null, today: string): DebtStatus {
  if (remaining <= 0) return 'settled';
  if (dueOn === null) return 'open';
  if (dueOn < today) return 'overdue';
  const soon = new Date(`${today}T00:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 7);
  return dueOn <= soon.toISOString().slice(0, 10) ? 'dueSoon' : 'open';
}

/** Primer problema de un pago, o null. No se puede pagar más de lo que falta. */
export function validatePayment(amountMinor: number, remaining: number): string | null {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) return 'Escribe el monto del pago';
  if (amountMinor > remaining) return 'El pago es mayor que lo que falta';
  return null;
}

/** Valor en USD de un monto de la deuda con la tasa dada; null si es en Bs y no hay tasa. */
export function debtUsd(amountMinor: number, currency: Currency, rateScaled: number | null): number | null {
  if (currency === 'USD') return amountMinor;
  if (rateScaled === null) return null;
  return vesToUsd(amountMinor, rateScaled);
}

export interface DebtTotals {
  /** USD que me deben / que debo (pendiente, valorado a la tasa de hoy). */
  owedToMeUsd: number;
  iOweUsd: number;
  /** Deudas pendientes en Bs que no se pudieron valorar por falta de tasa. */
  unvalued: number;
}

export function summarizeDebts(debts: readonly (DebtLike & { remainingMinor: number })[], rateScaled: number | null): DebtTotals {
  const out: DebtTotals = { owedToMeUsd: 0, iOweUsd: 0, unvalued: 0 };
  for (const d of debts) {
    if (d.remainingMinor <= 0) continue;
    const usd = debtUsd(d.remainingMinor, d.currency, rateScaled);
    if (usd === null) {
      out.unvalued += 1;
      continue;
    }
    if (d.direction === 'owed_to_me') out.owedToMeUsd += usd;
    else out.iOweUsd += usd;
  }
  return out;
}

/**
 * Cuánto valía en USD lo que falta cuando se abrió la deuda (en Bs) vs hoy. `lossUsd` > 0 = se devaluó
 * (a quien le deben le conviene menos; a quien debe le conviene más). Solo aplica a deudas en Bs con tasa de apertura.
 */
export function devaluation(
  remaining: number,
  openRateScaled: number | null,
  currentRateScaled: number | null,
): { atOpenUsd: number; nowUsd: number; lossUsd: number } | null {
  if (openRateScaled === null || currentRateScaled === null || remaining <= 0) return null;
  const atOpenUsd = vesToUsd(remaining, openRateScaled);
  const nowUsd = vesToUsd(remaining, currentRateScaled);
  return { atOpenUsd, nowUsd, lossUsd: atOpenUsd - nowUsd };
}

/** Qué movimiento genera el préstamo/pago y con qué categoría "de sistema" (no cuenta en reportes ni presupuesto). */
export type DebtMovement = 'lend' | 'collect' | 'borrow' | 'repay';

export const MOVEMENT_CATEGORY: Record<DebtMovement, { name: string; kind: 'income' | 'expense'; icon: string }> = {
  lend: { name: 'Préstamos dados', kind: 'expense', icon: 'cash' },
  collect: { name: 'Cobros de préstamos', kind: 'income', icon: 'cash' },
  borrow: { name: 'Préstamos recibidos', kind: 'income', icon: 'cash' },
  repay: { name: 'Pago de deudas', kind: 'expense', icon: 'cash' },
};

/** Abrir un préstamo: yo presto (lend, sale dinero) / me prestan (borrow, entra). Pagar: me pagan (collect) / pago (repay). */
export function movementFor(direction: DebtDirection, phase: 'open' | 'payment'): DebtMovement {
  if (direction === 'owed_to_me') return phase === 'open' ? 'lend' : 'collect';
  return phase === 'open' ? 'borrow' : 'repay';
}

export function movementConcept(movement: DebtMovement, person: string): string {
  const who = person.trim();
  switch (movement) {
    case 'lend': return `Préstamo a ${who}`;
    case 'collect': return `Pago de ${who}`;
    case 'borrow': return `Préstamo de ${who}`;
    case 'repay': return `Pago a ${who}`;
  }
}

export function validatePerson(person: string): string | null {
  return person.trim().length === 0 ? 'Escribe el nombre de la persona' : null;
}
