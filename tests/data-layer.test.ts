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
