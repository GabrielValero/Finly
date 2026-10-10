import { db } from '../db';
import { accounts, budgetItems, budgets, categories, exchangeRates, tags, transactions, transactionTags } from '../schema';
import { defaultCategoryRows } from './categories';

/**
 * Borra TODOS los datos y deja la app como recién instalada (con las categorías iniciales).
 * Una sola transacción síncrona: o se borra todo o no se borra nada. Orden respetando claves foráneas.
 */
export async function wipeAllData(now: Date): Promise<void> {
  db.transaction((tx) => {
    tx.delete(budgetItems).run();
    tx.delete(budgets).run();
    tx.delete(transactionTags).run();
    tx.delete(transactions).run();
    tx.delete(tags).run();
    tx.delete(exchangeRates).run();
    tx.delete(accounts).run();
    tx.delete(categories).run();
    tx.insert(categories).values(defaultCategoryRows(now)).run();
  });
}
