import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { useMemo } from 'react';
import { db } from '../data/db';
import { monthTransactionsQuery, transactionByIdQuery } from '../data/queries';
import { accounts, categories, exchangeRates, tags, transactions, transactionTags } from '../data/schema';
import type { RateRecord } from '../utils/rates';
import { useDbQuery } from './useDbQuery';

/** Cuentas activas con su saldo derivado (apertura + suma de movimientos vivos). */
export function useAccountsWithBalance() {
  const accountRows = useDbQuery(
    () => db.select().from(accounts).where(isNull(accounts.archivedAt)).orderBy(accounts.sortOrder, accounts.name),
    ['accounts'],
  );
  const sums = useDbQuery(
    () =>
      db
        .select({ accountId: transactions.accountId, total: sql<number>`coalesce(sum(${transactions.amountMinor}), 0)`, n: sql<number>`count(*)` })
        .from(transactions)
        .where(isNull(transactions.deletedAt))
        .groupBy(transactions.accountId),
    ['transactions'],
  );
  return useMemo(() => {
    const byAccount = new Map(sums.map((s) => [s.accountId, { total: Number(s.total), count: Number(s.n) }]));
    return accountRows.map((a) => ({ ...a, balanceMinor: a.openingMinor + (byAccount.get(a.id)?.total ?? 0), txCount: byAccount.get(a.id)?.count ?? 0 }));
  }, [accountRows, sums]);
}

export type AccountWithBalance = ReturnType<typeof useAccountsWithBalance>[number];

export function useCategoryRows() {
  return useDbQuery(() => db.select().from(categories).where(isNull(categories.archivedAt)).orderBy(categories.name), ['categories']);
}

/** Tasa más reciente (por fecha de vigencia, luego por captura). */
export function useLatestRate(): RateRecord | null {
  const data = useDbQuery(
    () => db.select().from(exchangeRates).orderBy(desc(exchangeRates.validFrom), desc(exchangeRates.fetchedAt)).limit(1),
    ['exchange_rates'],
  );
  const row = data[0];
  return useMemo(() => (row ? { source: row.source, rateScaled: row.rateScaled, validFrom: row.validFrom } : null), [row]);
}

/** Movimientos del mes. Depende de las tablas del join: al renombrar una cuenta o categoría también se refresca. */
export function useMonthTransactions(month: string) {
  return useDbQuery(() => monthTransactionsQuery(month), ['transactions', 'accounts', 'categories'], [month]);
}

export function useTransactionById(id: string) {
  const data = useDbQuery(() => transactionByIdQuery(id), ['transactions', 'accounts', 'categories'], [id]);
  return data[0] ?? null;
}

export type TxRow = ReturnType<typeof useMonthTransactions>[number];

/** Todas las categorías, incluidas archivadas (para resolver movimientos viejos). */
export function useAllCategoryRows() {
  return useDbQuery(() => db.select().from(categories).orderBy(categories.name), ['categories']);
}

/** Movimientos vivos por categoría (solo propios; el padre suma sus hijas en la capa de hooks). */
export function useCategoryUsage(): Map<string, number> {
  const data = useDbQuery(
    () =>
      db
        .select({ categoryId: transactions.categoryId, n: sql<number>`count(*)` })
        .from(transactions)
        .where(and(isNull(transactions.deletedAt), isNotNull(transactions.categoryId)))
        .groupBy(transactions.categoryId),
    ['transactions'],
  );
  return useMemo(() => new Map(data.map((r) => [r.categoryId!, Number(r.n)])), [data]);
}

export function useTags() {
  return useDbQuery(() => db.select().from(tags).orderBy(tags.name), ['tags']);
}

export function useTagsOfTransaction(id: string) {
  return useDbQuery(
    () =>
      db
        .select({ id: tags.id, name: tags.name })
        .from(transactionTags)
        .innerJoin(tags, eq(tags.id, transactionTags.tagId))
        .where(eq(transactionTags.transactionId, id))
        .orderBy(tags.name),
    ['transaction_tags', 'tags'],
    [id],
  );
}

const legColumns = {
  id: transactions.id,
  transferId: transactions.transferId,
  occurredAt: transactions.occurredAt,
  amountMinor: transactions.amountMinor,
  accountCurrency: transactions.accountCurrency,
  accountName: accounts.name,
  rateScaled: transactions.rateScaled,
};

/** Patas vivas de una transferencia (cuenta, monto, moneda). */
export function useTransferLegs(transferId: string | null) {
  return useDbQuery(
    () =>
      db
        .select(legColumns)
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .where(and(eq(transactions.transferId, transferId ?? ''), isNull(transactions.deletedAt))),
    ['transactions', 'accounts'],
    [transferId],
  );
}

/** Últimas patas de transferencia (para la tarjeta "Última transferencia"). */
export function useRecentTransferLegs() {
  return useDbQuery(
    () =>
      db
        .select(legColumns)
        .from(transactions)
        .innerJoin(accounts, eq(accounts.id, transactions.accountId))
        .where(and(eq(transactions.kind, 'transfer'), isNull(transactions.deletedAt)))
        .orderBy(desc(transactions.occurredAt))
        .limit(6),
    ['transactions', 'accounts'],
  );
}
