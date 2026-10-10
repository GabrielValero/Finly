import { eq, inArray, isNotNull, and } from 'drizzle-orm';
import { db } from '../db';
import { accounts, transactions, type NewAccount } from '../schema';

export async function insertAccount(row: NewAccount): Promise<void> {
  await db.insert(accounts).values(row);
}

export interface AccountFields {
  name: string;
  currency: 'VES' | 'USD';
  icon: string;
  openingMinor: number;
  includeInTotal: boolean;
}

export async function updateAccount(id: string, fields: AccountFields): Promise<void> {
  await db.update(accounts).set({ ...fields, updatedAt: new Date() }).where(eq(accounts.id, id));
}

/** Archivar oculta la cuenta y la saca del patrimonio; sus movimientos se conservan. */
export async function archiveAccount(id: string, now: Date): Promise<void> {
  await db.update(accounts).set({ archivedAt: now, updatedAt: now }).where(eq(accounts.id, id));
}

/**
 * Borra definitivamente todos los movimientos de la cuenta (la cuenta queda con su saldo inicial).
 * Si alguno es una transferencia, también se borra la otra pata para no descuadrar la cuenta contraria.
 * Devuelve cuántas filas se eliminaron. Las etiquetas del movimiento se van en cascada.
 */
export async function deleteAccountMovements(accountId: string): Promise<number> {
  return db.transaction((tx) => {
    const transferIds = tx
      .select({ id: transactions.transferId })
      .from(transactions)
      .where(and(eq(transactions.accountId, accountId), isNotNull(transactions.transferId)))
      .all()
      .map((r) => r.id)
      .filter((id): id is string => id !== null);
    let removed = 0;
    if (transferIds.length > 0) {
      removed += tx.delete(transactions).where(inArray(transactions.transferId, transferIds)).run().changes;
    }
    removed += tx.delete(transactions).where(eq(transactions.accountId, accountId)).run().changes;
    return removed;
  });
}
