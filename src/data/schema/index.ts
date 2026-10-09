import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

const currency = (name: string) => text(name, { enum: ['VES', 'USD'] });
const ts = (name: string) => integer(name, { mode: 'timestamp_ms' });

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    currency: currency('currency').notNull(),
    icon: text('icon').notNull(),
    color: text('color'),
    /** Saldo inicial en unidades menores de la moneda de la cuenta. */
    openingMinor: integer('opening_minor').notNull().default(0),
    archivedAt: ts('archived_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [uniqueIndex('accounts_name_uq').on(t.name)],
);

export const exchangeRates = sqliteTable(
  'exchange_rates',
  {
    id: text('id').primaryKey(),
    /** Siempre USD -> VES en v1; las columnas dejan la puerta abierta sin migrar. */
    base: currency('base').notNull().default('USD'),
    quote: currency('quote').notNull().default('VES'),
    source: text('source', { enum: ['bcv', 'manual'] }).notNull(),
    /** Bs por 1 USD x 1.000.000. */
    rateScaled: integer('rate_scaled').notNull(),
    /** YYYY-MM-DD desde la que rige. */
    validFrom: text('valid_from').notNull(),
    fetchedAt: ts('fetched_at').notNull(),
  },
  (t) => [
    uniqueIndex('exchange_rates_uq').on(t.base, t.quote, t.source, t.validFrom),
    check('exchange_rates_positive', sql`${t.rateScaled} > 0`),
  ],
);

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color'),
    kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
    /** Máximo 2 niveles: se valida en la capa de dominio (padre sin padre). */
    parentId: text('parent_id').references((): AnySQLiteColumn => categories.id),
    /** Ej. Préstamos: no entra en reportes de ingreso/gasto. */
    excludeFromReports: integer('exclude_from_reports', { mode: 'boolean' }).notNull().default(false),
    archivedAt: ts('archived_at'),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [index('categories_parent_idx').on(t.parentId)],
);

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    /** Denormalizada de la cuenta para poder validar la regla de tasa con CHECK. */
    accountCurrency: currency('account_currency').notNull(),
    kind: text('kind', { enum: ['income', 'expense', 'transfer'] }).notNull(),
    /** Con signo, en la moneda de la cuenta. Gasto < 0, ingreso > 0. */
    amountMinor: integer('amount_minor').notNull(),
    /** ISO local "YYYY-MM-DDTHH:mm:ss". */
    occurredAt: text('occurred_at').notNull(),
    categoryId: text('category_id').references(() => categories.id),
    concept: text('concept').notNull().default(''),
    note: text('note'),
    rateScaled: integer('rate_scaled'),
    rateSource: text('rate_source', { enum: ['bcv', 'manual'] }),
    /** Precio tal como se listó, si difiere de la moneda de la cuenta. */
    listedAmountMinor: integer('listed_amount_minor'),
    listedCurrency: currency('listed_currency'),
    transferId: text('transfer_id'),
    deletedAt: ts('deleted_at'),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    index('tx_account_date_idx').on(t.accountId, t.occurredAt),
    index('tx_date_idx').on(t.occurredAt),
    index('tx_category_idx').on(t.categoryId),
    index('tx_transfer_idx').on(t.transferId),
    check('tx_amount_nonzero', sql`${t.amountMinor} <> 0`),
    check(
      'tx_sign_matches_kind',
      sql`(${t.kind} = 'expense' AND ${t.amountMinor} < 0) OR (${t.kind} = 'income' AND ${t.amountMinor} > 0) OR ${t.kind} = 'transfer'`,
    ),
    check('tx_transfer_link', sql`(${t.kind} = 'transfer') = (${t.transferId} IS NOT NULL)`),
    check('tx_category_required', sql`${t.kind} = 'transfer' OR ${t.categoryId} IS NOT NULL`),
    check(
      'tx_listed_pair',
      sql`(${t.listedAmountMinor} IS NULL) = (${t.listedCurrency} IS NULL)`,
    ),
    check('tx_rate_pair', sql`(${t.rateScaled} IS NULL) = (${t.rateSource} IS NULL)`),
    // Regla de tasa: obligatoria si la cuenta es VES o el precio se listó en otra moneda.
    // Prohibida en el resto. Las transferencias guardan la tasa implícita y quedan exentas.
    check(
      'tx_rate_rule',
      sql`${t.kind} = 'transfer' OR (
        (${t.accountCurrency} = 'VES' OR (${t.listedCurrency} IS NOT NULL AND ${t.listedCurrency} <> ${t.accountCurrency}))
        = (${t.rateScaled} IS NOT NULL)
      )`,
    ),
  ],
);

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [uniqueIndex('tags_name_uq').on(t.name)],
);

export const transactionTags = sqliteTable(
  'transaction_tags',
  {
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.transactionId, t.tagId] }), index('tx_tags_tag_idx').on(t.tagId)],
);

export const budgets = sqliteTable(
  'budgets',
  {
    id: text('id').primaryKey(),
    /** YYYY-MM */
    month: text('month').notNull(),
    baseCurrency: currency('base_currency').notNull().default('USD'),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [uniqueIndex('budgets_month_uq').on(t.month), check('budgets_usd_only', sql`${t.baseCurrency} = 'USD'`)],
);

export const budgetItems = sqliteTable(
  'budget_items',
  {
    id: text('id').primaryKey(),
    budgetId: text('budget_id')
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
    /** Planificado en USD (moneda base del presupuesto). */
    plannedMinor: integer('planned_minor').notNull(),
    isFixed: integer('is_fixed', { mode: 'boolean' }).notNull().default(false),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    uniqueIndex('budget_items_uq').on(t.budgetId, t.categoryId),
    check('budget_items_positive', sql`${t.plannedMinor} >= 0`),
  ],
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
