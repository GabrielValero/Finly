import { eq } from 'drizzle-orm';
import { db } from '../db';
import { accounts, type NewAccount } from '../schema';

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
