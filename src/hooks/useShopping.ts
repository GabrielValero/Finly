import { desc, eq } from 'drizzle-orm';
import { db } from '../data/db';
import { exchangeRates, shoppingItems, shoppingLists } from '../data/schema';
import { useDbQuery } from './useDbQuery';

export function useShoppingLists() {
  return useDbQuery(() => db.select().from(shoppingLists).orderBy(desc(shoppingLists.updatedAt)), ['shopping_lists']);
}

export function useAllShoppingItems() {
  return useDbQuery(() => db.select().from(shoppingItems), ['shopping_items']);
}

export function useShoppingItems(listId: string) {
  return useDbQuery(() => db.select().from(shoppingItems).where(eq(shoppingItems.listId, listId)), ['shopping_items'], [listId]);
}

export function useShoppingList(id: string) {
  const rows = useDbQuery(() => db.select().from(shoppingLists).where(eq(shoppingLists.id, id)), ['shopping_lists'], [id]);
  return rows[0] ?? null;
}

/** Tasas recientes de cualquier fuente (para resolver la tasa efectiva de cada lista). */
export function useRateRows() {
  return useDbQuery(
    () => db.select().from(exchangeRates).orderBy(desc(exchangeRates.validFrom), desc(exchangeRates.fetchedAt)).limit(60),
    ['exchange_rates'],
  );
}
