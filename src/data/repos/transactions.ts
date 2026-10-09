import { eq } from 'drizzle-orm';
import { db } from '../db';
import { transactions, type NewTransaction } from '../schema';

export async function insertTransaction(row: NewTransaction): Promise<void> {
  await db.insert(transactions).values(row);
}

/** Borrado lógico: el movimiento deja de contar pero queda para sync/backup. */
export async function softDeleteTransaction(id: string, now: Date): Promise<void> {
  await db.update(transactions).set({ deletedAt: now, updatedAt: now }).where(eq(transactions.id, id));
}
