import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import { db } from '../db';
import { shoppingItems, shoppingLists, transactions } from '../schema';
import { toLocalIso } from '../../utils/dates';
import { newId } from '../../utils/ids';
import type { Currency } from '../../utils/money';
import { expenseMoney, planPurchase, purchaseConcept, purchaseNote, type ListRate, type ShopUnit } from '../../utils/shopping';

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

/** Archiva (o saca del archivo) una lista: va al historial sin necesidad de completarla. */
export async function setListArchived(id: string, archived: boolean, now: Date): Promise<void> {
  await db.update(shoppingLists).set({ archivedAt: archived ? now : null, updatedAt: now }).where(eq(shoppingLists.id, id));
}

/**
 * Copia una lista con todos sus productos, otra vez pendientes y sin marcar (mismos precios: el
 * usuario los ajusta). Sirve para repetir el mercado de siempre. No copia el vínculo a movimientos.
 */
export async function duplicateList(id: string, now: Date): Promise<string> {
  const newListId = newId();
  db.transaction((tx) => {
    const list = tx.select().from(shoppingLists).where(eq(shoppingLists.id, id)).get();
    if (!list) throw new Error('La lista ya no existe');
    const items = tx.select().from(shoppingItems).where(eq(shoppingItems.listId, id)).orderBy(shoppingItems.sortOrder).all();
    tx.insert(shoppingLists).values({ ...list, id: newListId, completedAt: null, archivedAt: null, createdAt: now, updatedAt: now }).run();
    items.forEach((it, index) => {
      tx.insert(shoppingItems).values({ ...it, id: newId(), listId: newListId, checked: false, purchasedAt: null, transactionId: null, sortOrder: index, updatedAt: now }).run();
    });
  });
  return newListId;
}

export interface ItemFields {
  name: string;
  quantityMilli: number;
  unit: ShopUnit;
  priceMinor: number | null;
  priceCurrency: Currency;
  taxable: boolean;
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
    const byId = new Map(items.map((i) => [i.id, i]));
    for (const g of plan.groups) {
      const bought = g.itemIds.map((id) => byId.get(id)!);
      const txId = newId();
      tx.insert(transactions)
        .values({
          id: txId,
          accountId: input.accountId,
          accountCurrency: input.accountCurrency,
          kind: 'expense',
          ...expenseMoney(input.accountCurrency, g.usdMinor, input.rate),
          occurredAt,
          categoryId: g.categoryId,
          concept: purchaseConcept(list.kind, list.name, bought),
          // Qué se compró: una línea por producto (con el monto original si se pagó en Bs).
          note: purchaseNote(list.kind, bought),
          transferId: null,
          deletedAt: null,
          updatedAt: input.now,
        })
        .run();
      // Cada producto recuerda qué movimiento lo pagó (para saltar de uno a otro).
      tx.update(shoppingItems).set({ purchasedAt: input.now, checked: true, transactionId: txId, updatedAt: input.now }).where(inArray(shoppingItems.id, g.itemIds)).run();
    }
    const done = plan.groups.flatMap((g) => g.itemIds);

    const pending = tx.select({ id: shoppingItems.id }).from(shoppingItems).where(and(eq(shoppingItems.listId, input.listId), isNull(shoppingItems.purchasedAt))).all();
    if (pending.length === 0) tx.update(shoppingLists).set({ completedAt: input.now, updatedAt: input.now }).where(eq(shoppingLists.id, input.listId)).run();
    return { expenses: plan.groups.length, registeredItems: done.length };
  });
}

/**
 * Deshace la compra de un producto: vuelve a pendiente y reabre la lista. Si el movimiento que lo pagó
 * era solo de este producto, también se elimina (borrado lógico); si pagó otros, se deja intacto y se avisa.
 */
export async function undoPurchase(itemId: string, now: Date): Promise<{ movement: 'deleted' | 'shared' | 'none' }> {
  return db.transaction((tx) => {
    const item = tx.select().from(shoppingItems).where(eq(shoppingItems.id, itemId)).get();
    if (!item || item.purchasedAt === null) return { movement: 'none' as const };
    tx.update(shoppingItems).set({ purchasedAt: null, checked: false, transactionId: null, updatedAt: now }).where(eq(shoppingItems.id, itemId)).run();
    tx.update(shoppingLists).set({ completedAt: null, updatedAt: now }).where(eq(shoppingLists.id, item.listId)).run();
    if (item.transactionId === null) return { movement: 'none' as const };
    const others = tx.select({ id: shoppingItems.id }).from(shoppingItems).where(and(eq(shoppingItems.transactionId, item.transactionId), ne(shoppingItems.id, itemId))).all();
    if (others.length > 0) return { movement: 'shared' as const };
    tx.update(transactions).set({ deletedAt: now, updatedAt: now }).where(eq(transactions.id, item.transactionId)).run();
    return { movement: 'deleted' as const };
  });
}

/** Cambia la tasa con la que la lista convierte los productos en Bs. */
export async function setListRate(id: string, mode: 'bcv' | 'manual', manualRateScaled: number | null, now: Date): Promise<void> {
  await db
    .update(shoppingLists)
    .set({ rateMode: mode, manualRateScaled: mode === 'manual' ? manualRateScaled : null, updatedAt: now })
    .where(eq(shoppingLists.id, id));
}
