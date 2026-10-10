import { db } from '../db';
import { accounts, type NewAccount } from '../schema';

export async function insertAccount(row: NewAccount): Promise<void> {
  await db.insert(accounts).values(row);
}
