import { readdirSync, readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import { insertAccount } from '../src/data/repos/accounts';
import { duplicateList, finalizePurchase, insertItem, insertList, setListArchived, undoPurchase, type ItemFields } from '../src/data/repos/shopping';
import { categories, shoppingItems, shoppingLists, transactions } from '../src/data/schema';

const dir = new URL('../drizzle/', import.meta.url);
const now = new Date('2026-10-30T12:00:00');
const rate = { rateScaled: 100_000_000, source: 'bcv' as const }; // 100 Bs por USD

const item = (name: string, o: Partial<ItemFields> = {}): ItemFields => ({
  name,
  quantityMilli: 1000,
  unit: 'und',
  priceMinor: 100,
  priceCurrency: 'USD',
  taxable: false,
  categoryId: null,
  priority: null,
  note: null,
  ...o,
});

const listFields = (name: string, kind: 'market' | 'wish') => ({ name, kind, categoryId: 'c', limitMinor: null, rateMode: 'bcv' as const, manualRateScaled: null });
const allTx = () => db.select().from(transactions).all();
const itemsOf = (listId: string) => db.select().from(shoppingItems).where(eq(shoppingItems.listId, listId)).all();

beforeAll(async () => {
  const client = (db as unknown as { $client: { execSync(s: string): void } }).$client;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort())
    for (const st of readFileSync(new URL(f, dir), 'utf8').split('--> statement-breakpoint')) client.execSync(st);
  const acc = { icon: 'cash', color: null, openingMinor: 0, includeInTotal: true, archivedAt: null, sortOrder: 0, updatedAt: now };
  await insertAccount({ ...acc, id: 'usd', name: 'Binance', currency: 'USD' });
  await insertAccount({ ...acc, id: 'ves', name: 'Banesco', currency: 'VES' });
  await db.insert(categories).values({ id: 'c', name: 'Mercado', icon: 'food', kind: 'expense', parentId: null, color: null, excludeFromReports: false, archivedAt: null, updatedAt: now });
});

describe('registrar compra de Mercado', () => {
  it('el gasto lleva el nombre de la lista como título, los productos en la nota, y cada producto recuerda su movimiento', async () => {
    const listId = await insertList(listFields('Mercado semanal', 'market'), now);
    const a = await insertItem(listId, item('Harina', { quantityMilli: 2000, priceMinor: 150 }), now);
    const b = await insertItem(listId, item('Queso', { priceMinor: 45_000, priceCurrency: 'VES' }), now);
    await finalizePurchase({ listId, itemIds: [a, b], accountId: 'usd', accountCurrency: 'USD', rate, now });

    const [tx] = allTx().filter((t) => t.concept === 'Mercado semanal');
    expect(tx).toMatchObject({ kind: 'expense', accountId: 'usd', amountMinor: -(300 + 450) });
    expect(tx!.note).toBe('• Harina × 2\n• Queso (Bs 450,00)');
    const rows = itemsOf(listId);
    expect(rows.every((r) => r.transactionId === tx!.id && r.purchasedAt !== null)).toBe(true);
    expect((await db.select().from(shoppingLists).where(eq(shoppingLists.id, listId)))[0]?.completedAt).not.toBeNull();
  });

  it('pagando desde una cuenta en Bs guarda la tasa; el monto original del producto sigue en la nota', async () => {
    const listId = await insertList(listFields('Mercado Bs', 'market'), now);
    const a = await insertItem(listId, item('Pan', { priceMinor: 20_000, priceCurrency: 'VES' }), now);
    await finalizePurchase({ listId, itemIds: [a], accountId: 'ves', accountCurrency: 'VES', rate, now });
    const tx = allTx().find((t) => t.concept === 'Mercado Bs')!;
    expect(tx).toMatchObject({ accountCurrency: 'VES', rateScaled: 100_000_000, listedAmountMinor: 200, listedCurrency: 'USD' });
    expect(tx.note).toBe('• Pan (Bs 200,00)');
  });
});

describe('Deseos: un gasto por producto', () => {
  it('el título es el nombre del producto y deshacer elimina su gasto', async () => {
    const listId = await insertList(listFields('Tecnología', 'wish'), now);
    const kb = await insertItem(listId, item('Teclado', { priceMinor: 5000 }), now);
    const mouse = await insertItem(listId, item('Mouse', { priceMinor: 2000 }), now);
    await finalizePurchase({ listId, itemIds: [kb], accountId: 'usd', accountCurrency: 'USD', rate, now });
    await finalizePurchase({ listId, itemIds: [mouse], accountId: 'usd', accountCurrency: 'USD', rate, now });

    const kbTx = allTx().find((t) => t.concept === 'Teclado')!;
    expect(kbTx.amountMinor).toBe(-5000);
    expect(kbTx.note).toBeNull();
    expect(allTx().some((t) => t.concept === 'Mouse')).toBe(true);

    expect(await undoPurchase(kb, new Date('2026-10-31T09:00:00'))).toEqual({ movement: 'deleted' });
    expect(allTx().find((t) => t.id === kbTx.id)?.deletedAt).not.toBeNull();
    const back = itemsOf(listId).find((r) => r.id === kb)!;
    expect(back).toMatchObject({ purchasedAt: null, checked: false, transactionId: null });
    // El otro deseo no se toca.
    expect(allTx().find((t) => t.concept === 'Mouse')?.deletedAt).toBeNull();
  });

  it('si el gasto pagó varios productos, deshacer uno no lo elimina', async () => {
    const listId = await insertList(listFields('Mercado compartido', 'market'), now);
    const a = await insertItem(listId, item('Arroz'), now);
    const b = await insertItem(listId, item('Pasta'), now);
    await finalizePurchase({ listId, itemIds: [a, b], accountId: 'usd', accountCurrency: 'USD', rate, now });
    expect(await undoPurchase(a, now)).toEqual({ movement: 'shared' });
    expect(allTx().find((t) => t.concept === 'Mercado compartido')?.deletedAt).toBeNull();
    expect((await db.select().from(shoppingLists).where(eq(shoppingLists.id, listId)))[0]?.completedAt).toBeNull();
  });

  it('deshacer un producto sin comprar no hace nada', async () => {
    const listId = await insertList(listFields('Pendiente', 'wish'), now);
    const a = await insertItem(listId, item('Libro'), now);
    expect(await undoPurchase(a, now)).toEqual({ movement: 'none' });
  });
});

describe('historial: archivar y duplicar', () => {
  it('archivar y desarchivar', async () => {
    const listId = await insertList(listFields('Abandonada', 'market'), now);
    await setListArchived(listId, true, now);
    expect((await db.select().from(shoppingLists).where(eq(shoppingLists.id, listId)))[0]?.archivedAt).not.toBeNull();
    await setListArchived(listId, false, now);
    expect((await db.select().from(shoppingLists).where(eq(shoppingLists.id, listId)))[0]?.archivedAt).toBeNull();
  });

  it('duplicar copia la lista y sus productos como pendientes, sin vínculo a movimientos', async () => {
    const listId = await insertList(listFields('Mercado base', 'market'), now);
    const a = await insertItem(listId, item('Arroz', { priceMinor: 250 }), now);
    await insertItem(listId, item('Leche', { priceMinor: 300 }), now);
    await finalizePurchase({ listId, itemIds: [a], accountId: 'usd', accountCurrency: 'USD', rate, now });

    const copyId = await duplicateList(listId, new Date('2026-11-06T10:00:00'));
    expect(copyId).not.toBe(listId);
    const copy = (await db.select().from(shoppingLists).where(eq(shoppingLists.id, copyId)))[0]!;
    expect(copy).toMatchObject({ name: 'Mercado base', kind: 'market', completedAt: null, archivedAt: null });
    const rows = itemsOf(copyId).sort((x, y) => x.sortOrder - y.sortOrder);
    expect(rows.map((r) => [r.name, r.priceMinor, r.checked, r.purchasedAt, r.transactionId])).toEqual([
      ['Arroz', 250, false, null, null],
      ['Leche', 300, false, null, null],
    ]);
    // El original sigue intacto.
    expect(itemsOf(listId).find((r) => r.id === a)?.purchasedAt).not.toBeNull();
  });
});
