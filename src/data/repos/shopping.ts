import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db';
import { shoppingItems, shoppingLists, transactions } from '../schema';
import { toLocalIso } from '../../utils/dates';
import { newId } from '../../utils/ids';
import type { Currency } from '../../utils/money';
import { expenseMoney, planPurchase, type ListRate } from '../../utils/shopping';

/*
 * Driver síncrono: los callbacks de `db.transaction` son síncronos y usan `.run()/.get()/.all()`.
 */

export interface ListFields {
  name: string;
  kind: 'market' | 'wish';
  categoryId: string | null;
  limitMinor: number | null;
  rateMode: 'bcv' | 'manual';
  manualRateScaled: number | null;
}

export async function insertList(fields: ListFields, now: Date): Promise<string> {
  const id = newId();
  await db.insert(shoppingLists).values({ ...fields, id, completedAt: null, createdAt: now, updatedAt: now });
  return id;
}

export async function updateList(id: string, fields: ListFields, now: Date): Promise<void> {
  await db.update(shoppingLists).set({ ...fields, updatedAt: now }).where(eq(shoppingLists.id, id));
}

/** Borra la lista y sus productos (cascada). No toca gastos ya registrados. */
export async function deleteList(id: string): Promise<void> {
  await db.delete(shoppingLists).where(eq(shoppingLists.id, id));
}

/** Reabre una lista completada (p. ej. para añadir algo olvidado). */
export async function reopenList(id: string, now: Date): Promise<void> {
  await db.update(shoppingLists).set({ completedAt: null, updatedAt: now }).where(eq(shoppingLists.id, id));
}

export interface ItemFields {
  name: string;
  quantityMilli: number;
  priceMinor: number | null;
  priceCurrency: Currency;
  categoryId: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  note: string | null;
}

export async function insertItem(listId: string, fields: ItemFields, now: Date): Promise<string> {
  const id = newId();
  db.transaction((tx) => {
    const last = tx.select({ o: shoppingItems.sortOrder }).from(shoppingItems).where(eq(shoppingItems.listId, listId)).orderBy(shoppingItems.sortOrder).all();
    const sortOrder = (last[last.length - 1]?.o ?? -1) + 1;
    tx.insert(shoppingItems).values({ ...fields, id, listId, checked: false, purchasedAt: null, sortOrder, updatedAt: now }).run();
    // Añadir a una lista completada la reabre.
    tx.update(shoppingLists).set({ completedAt: null, updatedAt: now }).where(eq(shoppingLists.id, listId)).run();
  });
  return id;
}

export async function updateItem(id: string, fields: ItemFields, now: Date): Promise<void> {
  await db.update(shoppingItems).set({ ...fields, updatedAt: now }).where(eq(shoppingItems.id, id));
}

export async function setItemChecked(id: string, checked: boolean, now: Date): Promise<void> {
  await db.update(shoppingItems).set({ checked, updatedAt: now }).where(eq(shoppingItems.id, id));
}

export async function deleteItem(id: string): Promise<void> {
  await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
}

export interface PurchaseInput {
  listId: string;
  itemIds: readonly string[];
  accountId: string;
  accountCurrency: Currency;
  /** Tasa de la lista (obligatoria si se paga desde una cuenta en Bs o hay productos en Bs). */
  rate: ListRate | null;
  now: Date;
}

/**
 * Registra la compra: un gasto por categoría efectiva, marca los productos como comprados y completa
 * la lista si no queda nada pendiente. Todo en una transacción: o se guarda completo o nada.
 * Los productos sin precio/tasa/categoría se dejan pendientes (la UI los avisa antes).
 */
export async function finalizePurchase(input: PurchaseInput): Promise<{ expenses: number; registeredItems: number }> {
  return db.transaction((tx) => {
    const list = tx.select().from(shoppingLists).where(eq(shoppingLists.id, input.listId)).get();
    if (!list) throw new Error('La lista ya no existe');
    const items = tx
      .select()
      .from(shoppingItems)
      .where(and(eq(shoppingItems.listId, input.listId), inArray(shoppingItems.id, [...input.itemIds]), isNull(shoppingItems.purchasedAt)))
      .all();
    const plan = planPurchase(items, list.categoryId, input.rate?.rateScaled ?? null);
    if (plan.groups.length === 0) throw new Error('No hay productos con precio y categoría para registrar');

    const occurredAt = toLocalIso(input.now);
    for (const g of plan.groups) {
      tx.insert(transactions)
        .values({
          id: newId(),
          accountId: input.accountId,
          accountCurrency: input.accountCurrency,
          kind: 'expense',
          ...expenseMoney(input.accountCurrency, g.usdMinor, input.rate),
          occurredAt,
          categoryId: g.categoryId,
          concept: list.name,
          note: null,
          transferId: null,
          deletedAt: null,
          updatedAt: input.now,
        })
        .run();
    }
    const done = plan.groups.flatMap((g) => g.itemIds);
    tx.update(shoppingItems).set({ purchasedAt: input.now, checked: true, updatedAt: input.now }).where(inArray(shoppingItems.id, done)).run();

    const pending = tx.select({ id: shoppingItems.id }).from(shoppingItems).where(and(eq(shoppingItems.listId, input.listId), isNull(shoppingItems.purchasedAt))).all();
    if (pending.length === 0) tx.update(shoppingLists).set({ completedAt: input.now, updatedAt: input.now }).where(eq(shoppingLists.id, input.listId)).run();
    return { expenses: plan.groups.length, registeredItems: done.length };
  });
}
