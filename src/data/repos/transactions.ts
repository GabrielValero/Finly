import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { transactions, transactionTags, type NewTransaction } from '../schema';

/** Inserta el movimiento y sus etiquetas en una sola transacción. */
export async function insertTransaction(row: NewTransaction, tagIds: readonly string[] = []): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(transactions).values(row);
    if (tagIds.length > 0) {
      await tx.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId: row.id, tagId })));
    }
  });
}

/** Actualiza un movimiento (nunca una transferencia) y reemplaza sus etiquetas. */
export async function updateTransaction(id: string, patch: Partial<NewTransaction>, tagIds: readonly string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(transactions).set(patch).where(and(eq(transactions.id, id), isNull(transactions.transferId)));
    await tx.delete(transactionTags).where(eq(transactionTags.transactionId, id));
    if (tagIds.length > 0) {
      await tx.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId: id, tagId })));
    }
  });
}

/** Las dos patas de una transferencia se guardan juntas o no se guarda ninguna. */
export async function insertTransfer(legs: readonly [NewTransaction, NewTransaction]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(transactions).values([...legs]);
  });
}

/**
 * Borrado lógico: el movimiento deja de contar pero queda para sync/backup.
 * Si es una transferencia, se borran las dos patas.
 */
export async function softDeleteTransaction(id: string, now: Date): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.select({ transferId: transactions.transferId }).from(transactions).where(eq(transactions.id, id));
    const patch = { deletedAt: now, updatedAt: now };
    if (row?.transferId) {
      await tx.update(transactions).set(patch).where(and(eq(transactions.transferId, row.transferId), isNull(transactions.deletedAt)));
    } else {
      await tx.update(transactions).set(patch).where(eq(transactions.id, id));
    }
  });
}
