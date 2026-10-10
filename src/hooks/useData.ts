import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { db } from '../data/db';
import { alias } from 'drizzle-orm/sqlite-core';
import { accounts, categories, exchangeRates, tags, transactions, transactionTags } from '../data/schema';
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

const parentCategories = alias(categories, 'parent_categories');

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
  transferId: transactions.transferId,
  categoryName: categories.name,
  categoryParentName: parentCategories.name,
  parentExcludeFromReports: parentCategories.excludeFromReports,
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
      .leftJoin(parentCategories, eq(parentCategories.id, categories.parentId))
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
      .leftJoin(parentCategories, eq(parentCategories.id, categories.parentId))
      .where(eq(transactions.id, id)),
    [id],
  );
  return data[0] ?? null;
}

export type TxRow = ReturnType<typeof useMonthTransactions>[number];

/** Todas las categorías, incluidas archivadas (para resolver movimientos viejos). */
export function useAllCategoryRows() {
  const { data } = useLiveQuery(db.select().from(categories).orderBy(categories.name));
  return data;
}

/** Movimientos vivos por categoría (solo propios; el padre suma sus hijas en la capa de hooks). */
export function useCategoryUsage(): Map<string, number> {
  const { data } = useLiveQuery(
    db
      .select({ categoryId: transactions.categoryId, n: sql<number>`count(*)` })
      .from(transactions)
      .where(and(isNull(transactions.deletedAt), isNotNull(transactions.categoryId)))
      .groupBy(transactions.categoryId),
  );
  return useMemo(() => new Map(data.map((r) => [r.categoryId!, Number(r.n)])), [data]);
}

export function useTags() {
  const { data } = useLiveQuery(db.select().from(tags).orderBy(tags.name));
  return data;
}

export function useTagsOfTransaction(id: string) {
  const { data } = useLiveQuery(
    db
      .select({ id: tags.id, name: tags.name })
      .from(transactionTags)
      .innerJoin(tags, eq(tags.id, transactionTags.tagId))
      .where(eq(transactionTags.transactionId, id))
      .orderBy(tags.name),
    [id],
  );
  return data;
}

/** Patas vivas de una transferencia (cuenta, monto, moneda). */
export function useTransferLegs(transferId: string | null) {
  const { data } = useLiveQuery(
    db
      .select({
        id: transactions.id,
        transferId: transactions.transferId,
        occurredAt: transactions.occurredAt,
        amountMinor: transactions.amountMinor,
        accountCurrency: transactions.accountCurrency,
        accountName: accounts.name,
        rateScaled: transactions.rateScaled,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(and(eq(transactions.transferId, transferId ?? ''), isNull(transactions.deletedAt))),
    [transferId],
  );
  return data;
}

/** Últimas patas de transferencia (para la tarjeta "Última transferencia"). */
export function useRecentTransferLegs() {
  const { data } = useLiveQuery(
    db
      .select({
        id: transactions.id,
        transferId: transactions.transferId,
        occurredAt: transactions.occurredAt,
        amountMinor: transactions.amountMinor,
        accountCurrency: transactions.accountCurrency,
        accountName: accounts.name,
        rateScaled: transactions.rateScaled,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .where(and(eq(transactions.kind, 'transfer'), isNull(transactions.deletedAt)))
      .orderBy(desc(transactions.occurredAt))
      .limit(6),
  );
  return data;
}
