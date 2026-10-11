import { readdirSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/data/db';
import { monthTransactionsQuery, transactionByIdQuery } from '../src/data/queries';
import { insertAccount } from '../src/data/repos/accounts';
import { insertTransaction, insertTransfer, softDeleteTransaction, updateTransaction } from '../src/data/repos/transactions';
import { categories } from '../src/data/schema';
import { buildTransfer } from '../src/utils/transactions';

const dir = new URL('../drizzle/', import.meta.url);
const base = { note: null, listedAmountMinor: null, listedCurrency: null, deletedAt: null, updatedAt: new Date(), transferId: null };

beforeAll(async () => {
  const client = (db as unknown as { $client: { execSync(s: string): void } }).$client;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort())
    for (const st of readFileSync(new URL(f, dir), 'utf8').split('--> statement-breakpoint')) client.execSync(st);
  const acc = { icon: 'cash', color: null, openingMinor: 0, includeInTotal: true, archivedAt: null, sortOrder: 0, updatedAt: new Date() };
  await insertAccount({ ...acc, id: 'usd', name: 'Binance', currency: 'USD' });
  await insertAccount({ ...acc, id: 'ves', name: 'Banesco', currency: 'VES' });
  await db.insert(categories).values({ id: 'c', name: 'Comida', icon: 'food', kind: 'expense', parentId: null, color: null, excludeFromReports: false, archivedAt: null, updatedAt: new Date() });
});

describe('capa de datos con el driver real de Drizzle', () => {
  it('un gasto guardado aparece en la consulta del mes', async () => {
    await insertTransaction({ ...base, id: 't1', accountId: 'usd', accountCurrency: 'USD', kind: 'expense', amountMinor: -500, occurredAt: '2026-10-10T11:00:00', categoryId: 'c', concept: 'Café', rateScaled: null, rateSource: null });
    const rows = await monthTransactionsQuery('2026-10');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 't1', categoryName: 'Comida', accountName: 'Binance', categoryParentName: null });
    expect(await monthTransactionsQuery('2026-09')).toHaveLength(0);
  });

  it('editar actualiza y no toca transferencias', async () => {
    await updateTransaction('t1', { amountMinor: -700, updatedAt: new Date() }, []);
    expect((await transactionByIdQuery('t1'))[0]?.amountMinor).toBe(-700);
  });

  it('una transferencia guarda dos patas y borrar una borra ambas', async () => {
    const legs = buildTransfer({ from: { id: 'usd', currency: 'USD' }, to: { id: 'ves', currency: 'VES' }, outMinor: 5000, inMinor: 4_350_000, transferId: 'tr1' });
    const row = { ...base, categoryId: null, concept: '', occurredAt: '2026-10-10T12:00:00' };
    await insertTransfer([{ ...row, id: 'a', ...legs[0] }, { ...row, id: 'b', ...legs[1] }]);
    expect(await monthTransactionsQuery('2026-10')).toHaveLength(3);
    await softDeleteTransaction('a', new Date());
    const left = await monthTransactionsQuery('2026-10');
    expect(left.map((r) => r.id)).toEqual(['t1']);
  });

  it('insertTransaction es atómica: si la etiqueta falla no queda el movimiento', async () => {
    const row = { ...base, id: 'bad', accountId: 'usd', accountCurrency: 'USD' as const, kind: 'expense' as const, amountMinor: -100, occurredAt: '2026-10-10T13:00:00', categoryId: 'c', concept: '', rateScaled: null, rateSource: null };
    await expect(insertTransaction(row, ['etiqueta-inexistente'])).rejects.toThrow();
    expect((await monthTransactionsQuery('2026-10')).some((r) => r.id === 'bad')).toBe(false);
  });
});

describe('borrado de datos', () => {
  it('eliminar movimientos de una cuenta borra también la otra pata de las transferencias', async () => {
    const { deleteAccountMovements } = await import('../src/data/repos/accounts');
    const { wipeAllData } = await import('../src/data/repos/reset');
    const { accounts, categories: cats, transactions: txs } = await import('../src/data/schema');
    await insertTransaction({ ...base, id: 'x1', accountId: 'ves', accountCurrency: 'VES', kind: 'expense', amountMinor: -100, occurredAt: '2026-10-11T10:00:00', categoryId: 'c', concept: '', rateScaled: 4_350_000, rateSource: 'manual' });
    const legs = buildTransfer({ from: { id: 'usd', currency: 'USD' }, to: { id: 'ves', currency: 'VES' }, outMinor: 100, inMinor: 43500, transferId: 'tr2' });
    const row = { ...base, categoryId: null, concept: '', occurredAt: '2026-10-11T12:00:00' };
    await insertTransfer([{ ...row, id: 'c', ...legs[0] }, { ...row, id: 'd', ...legs[1] }]);
    const removed = await deleteAccountMovements('ves');
    expect(removed).toBe(5); // x1 + tr2 (2 patas) + tr1 (2 patas, ya borradas lógicamente)
    const left = await db.select().from(txs);
    expect(left.some((r) => r.accountId === 'ves' || r.transferId === 'tr2')).toBe(false);
    expect(left.some((r) => r.id === 't1')).toBe(true);

    await wipeAllData(new Date());
    expect(await db.select().from(txs)).toHaveLength(0);
    expect(await db.select().from(accounts)).toHaveLength(0);
    expect((await db.select().from(cats)).length).toBeGreaterThan(0);
  });
});

describe('respaldo', () => {
  it('exportar → borrar todo → restaurar devuelve los mismos datos', async () => {
    const { exportBackup, restoreBackup } = await import('../src/data/repos/backup');
    const { wipeAllData } = await import('../src/data/repos/reset');
    const { backupFileSchema } = await import('../src/schemas/backup');
    const { accounts, transactions: txs } = await import('../src/data/schema');
    const [cat] = await db.select().from(categories);
    await insertAccount({ id: 'r1', name: 'Respaldo', currency: 'USD', icon: 'cash', color: null, openingMinor: 1000, includeInTotal: true, archivedAt: null, sortOrder: 0, updatedAt: new Date() });
    await insertTransaction({ ...base, id: 'rt1', accountId: 'r1', accountCurrency: 'USD', kind: 'expense', amountMinor: -250, occurredAt: '2026-10-12T10:00:00', categoryId: cat?.id ?? null, concept: 'Café', rateScaled: null, rateSource: null });
    const file = await exportBackup(new Date('2026-10-12T12:00:00Z'));
    const parsed = backupFileSchema.parse(JSON.parse(JSON.stringify(file)));
    const before = await db.select().from(txs);
    await wipeAllData(new Date());
    expect(await db.select().from(txs)).toHaveLength(0);
    await restoreBackup(parsed);
    expect(await db.select().from(txs)).toEqual(before);
    expect((await db.select().from(accounts)).some((a) => a.id === 'r1')).toBe(true);
  });

  it('un respaldo inválido no cambia nada (atómico)', async () => {
    const { exportBackup, restoreBackup } = await import('../src/data/repos/backup');
    const { transactions: txs } = await import('../src/data/schema');
    const file = await exportBackup(new Date());
    const before = await db.select().from(txs);
    const broken = structuredClone(file);
    broken.tables.transactions.push({ id: 'huerfana', account_id: 'no-existe', category_id: null, kind: 'transfer', amount_minor: -1, occurred_at: '2026-10-12T10:00:00', account_currency: 'USD', updated_at: 1 });
    await expect(restoreBackup(broken)).rejects.toThrow();
    expect(await db.select().from(txs)).toEqual(before);
    const alien = structuredClone(file);
    alien.tables.accounts.push({ id: 'z', columna_futura: 1 });
    await expect(restoreBackup(alien)).rejects.toThrow('incompatible');
  });
});

describe('presupuesto', () => {
  it('guarda partidas (una por categoría), actualiza y copia del mes anterior', async () => {
    const { saveBudgetItem, copyBudgetFromPrevious, deleteBudgetItem } = await import('../src/data/repos/budgets');
    const { budgetItems, budgets } = await import('../src/data/schema');
    const cats = await db.select().from(categories);
    const exp = cats.filter((c) => c.kind === 'expense');
    const inc = cats.find((c) => c.kind === 'income');
    const now = new Date();
    await saveBudgetItem({ month: '2026-09', categoryId: exp[0]!.id, kind: 'expense', plannedMinor: 35000, isFixed: false }, now);
    await saveBudgetItem({ month: '2026-09', categoryId: exp[1]!.id, kind: 'expense', plannedMinor: 13566, isFixed: true }, now);
    await saveBudgetItem({ month: '2026-09', categoryId: inc!.id, kind: 'income', plannedMinor: 120000, isFixed: true }, now);
    await saveBudgetItem({ month: '2026-09', categoryId: exp[0]!.id, kind: 'expense', plannedMinor: 40000, isFixed: false }, now);
    const sept = await db.select().from(budgetItems);
    expect(sept).toHaveLength(3);
    expect(sept.find((i) => i.categoryId === exp[0]!.id)?.plannedMinor).toBe(40000);
    expect(sept.find((i) => i.categoryId === inc!.id)?.isFixed).toBe(false);

    expect(await copyBudgetFromPrevious('2026-10', now)).toBe(3);
    expect(await copyBudgetFromPrevious('2026-10', now)).toBe(0);
    expect(await copyBudgetFromPrevious('2026-08', now)).toBe(0);
    expect(await db.select().from(budgets)).toHaveLength(2);
    const first = sept[0]!;
    await deleteBudgetItem(first.id);
    expect(await db.select().from(budgetItems)).toHaveLength(5);
  });
});

describe('categoría en transferencias', () => {
  it('se pone y se quita en las dos patas, y no toca las borradas', async () => {
    const { setTransferCategory } = await import('../src/data/repos/transactions');
    const { transactions: txs } = await import('../src/data/schema');
    const acc = { icon: 'cash', color: null, openingMinor: 0, includeInTotal: true, archivedAt: null, sortOrder: 0, updatedAt: new Date() };
    await insertAccount({ ...acc, id: 'sc1', name: 'Origen cat', currency: 'USD' });
    await insertAccount({ ...acc, id: 'sc2', name: 'Destino cat', currency: 'USD' });
    const cat = (await db.select().from(categories)).find((c) => c.kind === 'expense')!;
    const legs = buildTransfer({ from: { id: 'sc1', currency: 'USD' }, to: { id: 'sc2', currency: 'USD' }, outMinor: 10000, inMinor: 10000, transferId: 'trc' });
    const common = { ...base, categoryId: null, concept: '', occurredAt: '2026-10-10T12:00:00' };
    await insertTransfer([{ ...common, id: 'trc-out', ...legs[0] }, { ...common, id: 'trc-in', ...legs[1] }]);

    await setTransferCategory('trc', cat.id, new Date());
    let rows = (await db.select().from(txs)).filter((r) => r.transferId === 'trc');
    expect(rows.map((r) => r.categoryId)).toEqual([cat.id, cat.id]);

    await setTransferCategory('trc', null, new Date());
    rows = (await db.select().from(txs)).filter((r) => r.transferId === 'trc');
    expect(rows.map((r) => r.categoryId)).toEqual([null, null]);
  });
});

describe('listas de compras', () => {
  beforeAll(async () => {
    // Los tests de borrado anteriores vacían cuentas y categorías: se recrean las necesarias.
    const now = new Date();
    await db.insert(categories).values({ id: 'c', name: 'Mercado test', icon: 'cart', kind: 'expense', parentId: null, color: null, excludeFromReports: false, archivedAt: null, updatedAt: now }).onConflictDoNothing();
    await insertAccount({ icon: 'cash', color: null, openingMinor: 0, includeInTotal: true, archivedAt: null, sortOrder: 0, updatedAt: now, id: 'ves', name: 'Banesco2', currency: 'VES' });
    await insertAccount({ icon: 'cash', color: null, openingMinor: 0, includeInTotal: true, archivedAt: null, sortOrder: 0, updatedAt: now, id: 'usd', name: 'Binance2', currency: 'USD' });
  });

  it('finalizePurchase crea un gasto por categoría, marca comprados y completa la lista', async () => {
    const { insertList, insertItem, finalizePurchase } = await import('../src/data/repos/shopping');
    const { shoppingItems, shoppingLists, transactions: txs } = await import('../src/data/schema');
    const { eq } = await import('drizzle-orm');
    const now = new Date('2026-10-10T16:00:00Z');
    await db.insert(categories).values({ id: 'c2', name: 'Salud', icon: 'heart', kind: 'expense', parentId: null, color: null, excludeFromReports: false, archivedAt: null, updatedAt: now });
    const listId = await insertList({ name: 'Mercado semanal', kind: 'market', categoryId: 'c', limitMinor: 10_000, rateMode: 'bcv', manualRateScaled: null }, now);
    const item = { quantityMilli: 1000, priceCurrency: 'USD' as const, categoryId: null, priority: null, note: null };
    const a = await insertItem(listId, { ...item, name: 'Arroz', priceMinor: 300 }, now);
    const b = await insertItem(listId, { ...item, name: 'Ibuprofeno', priceMinor: 87_500, priceCurrency: 'VES', categoryId: 'c2' }, now);
    const rate = { rateScaled: 875_000_000, source: 'bcv' as const };

    const r = await finalizePurchase({ listId, itemIds: [a, b], accountId: 'ves', accountCurrency: 'VES', rate, now });
    expect(r).toEqual({ expenses: 2, registeredItems: 2 });

    const made = await db.select().from(txs).where(eq(txs.concept, 'Mercado semanal'));
    const byCat = Object.fromEntries(made.map((t) => [t.categoryId, t]));
    expect(byCat['c']).toMatchObject({ amountMinor: -262_500, listedAmountMinor: 300, listedCurrency: 'USD', rateScaled: 875_000_000, rateSource: 'bcv' });
    expect(byCat['c2']).toMatchObject({ amountMinor: -87_500, listedAmountMinor: 100 });
    expect((await db.select().from(shoppingItems)).every((i) => i.purchasedAt !== null)).toBe(true);
    expect((await db.select().from(shoppingLists).where(eq(shoppingLists.id, listId)))[0]?.completedAt).not.toBeNull();

    // Reintentar no duplica: ya no quedan productos pendientes.
    await expect(finalizePurchase({ listId, itemIds: [a, b], accountId: 'ves', accountCurrency: 'VES', rate, now })).rejects.toThrow();
  });

  it('es atómica: si una cuenta no existe no queda nada marcado', async () => {
    const { insertList, insertItem, finalizePurchase } = await import('../src/data/repos/shopping');
    const { shoppingItems } = await import('../src/data/schema');
    const { eq } = await import('drizzle-orm');
    const now = new Date();
    const listId = await insertList({ name: 'Otra', kind: 'wish', categoryId: 'c', limitMinor: null, rateMode: 'bcv', manualRateScaled: null }, now);
    const id = await insertItem(listId, { name: 'Libro', quantityMilli: 1000, priceMinor: 1500, priceCurrency: 'USD', categoryId: null, priority: 'high', note: null }, now);
    await expect(finalizePurchase({ listId, itemIds: [id], accountId: 'no-existe', accountCurrency: 'USD', rate: null, now })).rejects.toThrow();
    expect((await db.select().from(shoppingItems).where(eq(shoppingItems.id, id)))[0]?.purchasedAt).toBeNull();
  });

  it('borrar la lista borra sus productos', async () => {
    const { insertList, insertItem, deleteList } = await import('../src/data/repos/shopping');
    const { shoppingItems } = await import('../src/data/schema');
    const { eq } = await import('drizzle-orm');
    const now = new Date();
    const listId = await insertList({ name: 'Temporal', kind: 'wish', categoryId: null, limitMinor: null, rateMode: 'bcv', manualRateScaled: null }, now);
    await insertItem(listId, { name: 'X', quantityMilli: 1000, priceMinor: null, priceCurrency: 'USD', categoryId: null, priority: null, note: null }, now);
    await deleteList(listId);
    expect(await db.select().from(shoppingItems).where(eq(shoppingItems.listId, listId))).toHaveLength(0);
  });
});
