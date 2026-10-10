import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { transactions, transactionTags, type NewTransaction } from '../schema';

/*
 * IMPORTANTE: el driver de Expo es síncrono. El callback de `db.transaction` debe ser SÍNCRONO
 * y ejecutar con `.run()` / `.all()`: con un callback `async`, el COMMIT ocurre antes de que corran
 * las sentencias y la atomicidad se pierde (tests/data-layer.test.ts lo verifica).
 */

/** Inserta el movimiento y sus etiquetas en una sola transacción. */
export async function insertTransaction(row: NewTransaction, tagIds: readonly string[] = []): Promise<void> {
  db.transaction((tx) => {
    tx.insert(transactions).values(row).run();
    if (tagIds.length > 0) {
      tx.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId: row.id, tagId }))).run();
    }
  });
}

/** Actualiza un movimiento (nunca una transferencia) y reemplaza sus etiquetas. */
export async function updateTransaction(id: string, patch: Partial<NewTransaction>, tagIds: readonly string[]): Promise<void> {
  db.transaction((tx) => {
    tx.update(transactions).set(patch).where(and(eq(transactions.id, id), isNull(transactions.transferId))).run();
    tx.delete(transactionTags).where(eq(transactionTags.transactionId, id)).run();
    if (tagIds.length > 0) {
      tx.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId: id, tagId }))).run();
    }
  });
}

/** Las dos patas de una transferencia se guardan juntas o no se guarda ninguna. */
export async function insertTransfer(legs: readonly [NewTransaction, NewTransaction]): Promise<void> {
  db.transaction((tx) => {
    tx.insert(transactions).values([...legs]).run();
  });
}

/**
 * Borrado lógico: el movimiento deja de contar pero queda para sync/backup.
 * Si es una transferencia, se borran las dos patas.
 */
export async function softDeleteTransaction(id: string, now: Date): Promise<void> {
  db.transaction((tx) => {
    const row = tx.select({ transferId: transactions.transferId }).from(transactions).where(eq(transactions.id, id)).get();
    const patch = { deletedAt: now, updatedAt: now };
    if (row?.transferId) {
      tx.update(transactions).set(patch).where(and(eq(transactions.transferId, row.transferId), isNull(transactions.deletedAt))).run();
    } else {
      tx.update(transactions).set(patch).where(eq(transactions.id, id)).run();
    }
  });
}

/** Pone o quita la categoría de una transferencia en sus dos patas (la pata de salida es la que cuenta en el presupuesto). */
export async function setTransferCategory(transferId: string, categoryId: string | null, now: Date): Promise<void> {
  db.transaction((tx) => {
    tx.update(transactions).set({ categoryId, updatedAt: now }).where(and(eq(transactions.transferId, transferId), isNull(transactions.deletedAt))).run();
  });
}
