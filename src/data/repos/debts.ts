import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { categories, debtPayments, debts, transactions } from '../schema';
import { toLocalIso } from '../../utils/dates';
import { MOVEMENT_CATEGORY, movementConcept, movementFor, remainingMinor, validatePayment, type DebtDirection, type DebtMovement } from '../../utils/debts';
import { resolveEntry } from '../../utils/entry';
import { newId } from '../../utils/ids';
import type { Currency } from '../../utils/money';
import type { RateSource } from '../../utils/rates';

/*
 * Driver síncrono: todo en `db.transaction` con callbacks síncronos (.run/.get/.all).
 * El movimiento en una cuenta es OPCIONAL: sin él, la deuda no toca saldos ni reportes.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface DebtFields {
  direction: DebtDirection;
  person: string;
  currency: Currency;
  principalMinor: number;
  note: string | null;
  /** YYYY-MM-DD */
  openedOn: string;
  dueOn: string | null;
  openRateScaled: number | null;
}

/** Cuenta (y tasa, si hace falta) donde registrar el movimiento. */
export interface MovementLink {
  accountId: string;
  accountCurrency: Currency;
  rate: { rateScaled: number; source: RateSource } | null;
}

/** Categoría "de sistema" del movimiento: se crea la primera vez y no cuenta en reportes ni presupuesto. */
function systemCategoryId(tx: Tx, movement: DebtMovement, now: Date): string {
  const spec = MOVEMENT_CATEGORY[movement];
  const found = tx
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.name, spec.name), eq(categories.kind, spec.kind), isNull(categories.archivedAt)))
    .get();
  if (found) return found.id;
  const id = newId();
  tx.insert(categories).values({ id, name: spec.name, icon: spec.icon, color: null, kind: spec.kind, parentId: null, excludeFromReports: true, archivedAt: null, updatedAt: now }).run();
  return id;
}

/** Inserta el movimiento de cuenta de un préstamo o de un pago y devuelve su id. */
function insertMovement(
  tx: Tx,
  args: { movement: DebtMovement; person: string; amountMinor: number; currency: Currency; day: string; link: MovementLink; now: Date },
): string {
  const { movement, link, now } = args;
  const entry = resolveEntry({
    enteredMinor: args.amountMinor,
    enteredCurrency: args.currency,
    accountCurrency: link.accountCurrency,
    rateScaled: link.rate?.rateScaled ?? null,
    rateSource: link.rate?.source ?? null,
  });
  const kind = MOVEMENT_CATEGORY[movement].kind;
  const id = newId();
  tx.insert(transactions)
    .values({
      id,
      accountId: link.accountId,
      accountCurrency: link.accountCurrency,
      kind,
      amountMinor: kind === 'expense' ? -entry.amountMinor : entry.amountMinor,
      occurredAt: `${args.day}T${toLocalIso(now).slice(11)}`,
      categoryId: systemCategoryId(tx, movement, now),
      concept: movementConcept(movement, args.person),
      note: null,
      rateScaled: entry.rateScaled,
      rateSource: entry.rateSource,
      listedAmountMinor: entry.listedAmountMinor,
      listedCurrency: entry.listedCurrency,
      transferId: null,
      deletedAt: null,
      updatedAt: now,
    })
    .run();
  return id;
}

function softDeleteMovement(tx: Tx, transactionId: string | null, now: Date): void {
  if (transactionId) tx.update(transactions).set({ deletedAt: now, updatedAt: now }).where(eq(transactions.id, transactionId)).run();
}

export async function createDebt(fields: DebtFields, link: MovementLink | null, now: Date): Promise<string> {
  const id = newId();
  db.transaction((tx) => {
    const transactionId = link
      ? insertMovement(tx, { movement: movementFor(fields.direction, 'open'), person: fields.person, amountMinor: fields.principalMinor, currency: fields.currency, day: fields.openedOn, link, now })
      : null;
    tx.insert(debts).values({ ...fields, person: fields.person.trim(), id, transactionId, createdAt: now, updatedAt: now }).run();
  });
  return id;
}

/** Edita los datos de la deuda. El movimiento ya registrado en una cuenta no cambia. */
export async function updateDebt(id: string, fields: Omit<DebtFields, 'openedOn'>, now: Date): Promise<void> {
  db.transaction((tx) => {
    const paid = tx.select({ a: debtPayments.amountMinor }).from(debtPayments).where(eq(debtPayments.debtId, id)).all();
    if (fields.principalMinor < paid.reduce((s, p) => s + p.a, 0)) throw new Error('El monto no puede ser menor a lo ya pagado');
    tx.update(debts).set({ ...fields, person: fields.person.trim(), updatedAt: now }).where(eq(debts.id, id)).run();
  });
}

/** Borra la deuda, sus pagos y los movimientos de cuenta que registró (quedan como borrados lógicos). */
export async function deleteDebt(id: string, now: Date): Promise<void> {
  db.transaction((tx) => {
    const debt = tx.select().from(debts).where(eq(debts.id, id)).get();
    if (!debt) return;
    softDeleteMovement(tx, debt.transactionId, now);
    for (const p of tx.select().from(debtPayments).where(eq(debtPayments.debtId, id)).all()) softDeleteMovement(tx, p.transactionId, now);
    tx.delete(debts).where(eq(debts.id, id)).run();
  });
}

export async function addPayment(
  input: { debtId: string; amountMinor: number; paidOn: string; note: string | null; link: MovementLink | null },
  now: Date,
): Promise<void> {
  db.transaction((tx) => {
    const debt = tx.select().from(debts).where(eq(debts.id, input.debtId)).get();
    if (!debt) throw new Error('La deuda ya no existe');
    const payments = tx.select({ amountMinor: debtPayments.amountMinor }).from(debtPayments).where(eq(debtPayments.debtId, debt.id)).all();
    const problem = validatePayment(input.amountMinor, remainingMinor(debt.principalMinor, payments));
    if (problem) throw new Error(problem);
    const transactionId = input.link
      ? insertMovement(tx, { movement: movementFor(debt.direction, 'payment'), person: debt.person, amountMinor: input.amountMinor, currency: debt.currency, day: input.paidOn, link: input.link, now })
      : null;
    tx.insert(debtPayments).values({ id: newId(), debtId: debt.id, amountMinor: input.amountMinor, paidOn: input.paidOn, note: input.note, transactionId, updatedAt: now }).run();
    tx.update(debts).set({ updatedAt: now }).where(eq(debts.id, debt.id)).run();
  });
}

/** Quita un pago (y su movimiento de cuenta, si lo tenía). */
export async function deletePayment(id: string, now: Date): Promise<void> {
  db.transaction((tx) => {
    const p = tx.select().from(debtPayments).where(eq(debtPayments.id, id)).get();
    if (!p) return;
    softDeleteMovement(tx, p.transactionId, now);
    tx.delete(debtPayments).where(eq(debtPayments.id, id)).run();
    tx.update(debts).set({ updatedAt: now }).where(eq(debts.id, p.debtId)).run();
  });
}
