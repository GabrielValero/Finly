import { and, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { monthBounds } from '../utils/dates';
import { db } from './db';
import { accounts, categories, transactions } from './schema';

const parentCategories = alias(categories, 'parent_categories');

export const txColumns = {
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

export function monthTransactionsQuery(month: string) {
  const { from, to } = monthBounds(month);
  return db
    .select(txColumns)
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(parentCategories, eq(parentCategories.id, categories.parentId))
    .where(and(gte(transactions.occurredAt, from), lt(transactions.occurredAt, to), isNull(transactions.deletedAt)))
    .orderBy(desc(transactions.occurredAt));
}

export function transactionByIdQuery(id: string) {
  return db
    .select({ ...txColumns, note: transactions.note, deletedAt: transactions.deletedAt })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(parentCategories, eq(parentCategories.id, categories.parentId))
    .where(eq(transactions.id, id));
}
