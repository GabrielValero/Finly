import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { useMemo } from 'react';
import { db } from '../data/db';
import { monthTransactionsQuery, transactionByIdQuery } from '../data/queries';
import { accounts, budgetItems, budgets, categories, exchangeRates, tags, transactions, transactionTags } from '../data/schema';
import { usePreferences } from '../store/preferences';
import { pickLatestRate, type RateRecord } from '../utils/rates';
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

/** Tasa de hoy según la fuente por defecto (ver `pickLatestRate`). */
export function useLatestRate(): RateRecord | null {
  const preferred = usePreferences((s) => s.defaultRateSource);
  const data = useDbQuery(
    () => db.select().from(exchangeRates).orderBy(desc(exchangeRates.validFrom), desc(exchangeRates.fetchedAt)).limit(60),
    ['exchange_rates'],
  );
  return useMemo(() => {
    const row = pickLatestRate(data, preferred);
    return row ? { source: row.source, rateScaled: row.rateScaled, validFrom: row.validFrom } : null;
  }, [data, preferred]);
}

/** Historial de tasas, de la más reciente a la más antigua. */
export function useRateHistory(limit = 30) {
  return useDbQuery(
    () => db.select().from(exchangeRates).orderBy(desc(exchangeRates.validFrom), desc(exchangeRates.fetchedAt)).limit(limit),
    ['exchange_rates'],
    [limit],
  );
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

/** Totales para la pantalla de borrado: cuentas, movimientos vivos, categorías y etiquetas. */
export function useDataCounts() {
  const rows = useDbQuery(
    () =>
      db.select({
        accounts: sql<number>`(select count(*) from accounts)`,
        movements: sql<number>`(select count(*) from transactions where deleted_at is null)`,
        categories: sql<number>`(select count(*) from categories)`,
        tags: sql<number>`(select count(*) from tags)`,
      }).from(sql`(select 1)`),
    ['accounts', 'transactions', 'categories', 'tags'],
  );
  const r = rows[0];
  return { accounts: Number(r?.accounts ?? 0), movements: Number(r?.movements ?? 0), categories: Number(r?.categories ?? 0), tags: Number(r?.tags ?? 0) };
}

const budgetParents = alias(categories, 'budget_parent');

/** Partidas del presupuesto de un mes, con los datos de su categoría. */
export function useBudgetItems(month: string) {
  return useDbQuery(
    () =>
      db
        .select({
          id: budgetItems.id,
          categoryId: budgetItems.categoryId,
          kind: budgetItems.kind,
          plannedMinor: budgetItems.plannedMinor,
          isFixed: budgetItems.isFixed,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          parentName: budgetParents.name,
        })
        .from(budgetItems)
        .innerJoin(budgets, eq(budgets.id, budgetItems.budgetId))
        .innerJoin(categories, eq(categories.id, budgetItems.categoryId))
        .leftJoin(budgetParents, eq(budgetParents.id, categories.parentId))
        .where(eq(budgets.month, month))
        .orderBy(categories.name),
    ['budgets', 'budget_items', 'categories'],
    [month],
  );
}
