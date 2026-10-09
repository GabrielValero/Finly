import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { db } from '../data/db';
import { accounts, categories, exchangeRates, transactions } from '../data/schema';
import { monthBounds } from '../utils/dates';
import type { RateRecord } from '../utils/rates';

/** Cuentas activas con su saldo derivado (apertura + suma de movimientos vivos). */
export function useAccountsWithBalance() {
  const { data: accountRows } = useLiveQuery(
    db.select().from(accounts).where(isNull(accounts.archivedAt)).orderBy(accounts.sortOrder, accounts.name),
  );
  const { data: sums } = useLiveQuery(
    db
      .select({ accountId: transactions.accountId, total: sql<number>`coalesce(sum(${transactions.amountMinor}), 0)` })
      .from(transactions)
      .where(isNull(transactions.deletedAt))
      .groupBy(transactions.accountId),
  );
  return useMemo(() => {
    const byAccount = new Map(sums.map((s) => [s.accountId, Number(s.total)]));
    return accountRows.map((a) => ({ ...a, balanceMinor: a.openingMinor + (byAccount.get(a.id) ?? 0) }));
  }, [accountRows, sums]);
}

export type AccountWithBalance = ReturnType<typeof useAccountsWithBalance>[number];

export function useCategoryRows() {
  const { data } = useLiveQuery(db.select().from(categories).where(isNull(categories.archivedAt)).orderBy(categories.name));
  return data;
}

/** Tasa más reciente (por fecha de vigencia, luego por captura). */
export function useLatestRate(): RateRecord | null {
  const { data } = useLiveQuery(
    db.select().from(exchangeRates).orderBy(desc(exchangeRates.validFrom), desc(exchangeRates.fetchedAt)).limit(1),
  );
  const row = data[0];
  return useMemo(() => (row ? { source: row.source, rateScaled: row.rateScaled, validFrom: row.validFrom } : null), [row]);
}

const txColumns = {
  id: transactions.id,
  accountId: transactions.accountId,
  accountCurrency: transactions.accountCurrency,
  kind: transactions.kind,
  amountMinor: transactions.amountMinor,
  occurredAt: transactions.occurredAt,
  categoryId: transactions.categoryId,
  concept: transactions.concept,
  rateScaled: transactions.rateScaled,
  rateSource: transactions.rateSource,
  listedAmountMinor: transactions.listedAmountMinor,
  listedCurrency: transactions.listedCurrency,
  categoryName: categories.name,
  categoryIcon: categories.icon,
  excludeFromReports: categories.excludeFromReports,
  accountName: accounts.name,
};

export function useMonthTransactions(month: string) {
  const { from, to } = monthBounds(month);
  const { data } = useLiveQuery(
    db
      .select(txColumns)
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(and(gte(transactions.occurredAt, from), lt(transactions.occurredAt, to), isNull(transactions.deletedAt)))
      .orderBy(desc(transactions.occurredAt)),
    [month],
  );
  return data;
}

export function useTransactionById(id: string) {
  const { data } = useLiveQuery(
    db
      .select({ ...txColumns, note: transactions.note, deletedAt: transactions.deletedAt })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(eq(transactions.id, id)),
    [id],
  );
  return data[0] ?? null;
}

export type TxRow = ReturnType<typeof useMonthTransactions>[number];
