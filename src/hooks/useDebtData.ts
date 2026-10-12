import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../data/db';
import { debtPayments, debts } from '../data/schema';
import { useDbQuery } from './useDbQuery';

export function useAllDebts() {
  return useDbQuery(() => db.select().from(debts).orderBy(desc(debts.updatedAt)), ['debts']);
}

export function useAllDebtPayments() {
  return useDbQuery(() => db.select().from(debtPayments), ['debt_payments']);
}

export function useDebt(id: string) {
  const rows = useDbQuery(() => db.select().from(debts).where(eq(debts.id, id)), ['debts'], [id]);
  return rows[0] ?? null;
}

export function useDebtPayments(debtId: string) {
  return useDbQuery(() => db.select().from(debtPayments).where(eq(debtPayments.debtId, debtId)).orderBy(asc(debtPayments.paidOn), asc(debtPayments.updatedAt)), ['debt_payments'], [debtId]);
}
