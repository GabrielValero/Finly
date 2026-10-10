import { describe, expect, it } from 'vitest';
import { allocateSpending, txsOfItem, type BudgetItemLite } from '../src/utils/budget';
import { accountFlow, buildMovementGroups, toRow, type MovementTx } from '../src/utils/movementRows';

const cats = [
  { id: 'comida', parentId: null },
  { id: 'restaurantes', parentId: 'comida' },
  { id: 'transporte', parentId: null },
];
const items: BudgetItemLite[] = [
  { id: 'i-comida', categoryId: 'comida', kind: 'expense', plannedMinor: 10000, isFixed: false },
  { id: 'i-rest', categoryId: 'restaurantes', kind: 'expense', plannedMinor: 3000, isFixed: false },
];

interface T { kind: 'expense' | 'income' | 'transfer'; categoryId: string | null; usd: number; excluded?: boolean }
const txs: T[] = [
  { kind: 'expense', categoryId: 'comida', usd: 500 },
  { kind: 'expense', categoryId: 'restaurantes', usd: 700 },
  { kind: 'expense', categoryId: 'transporte', usd: 100 },
  { kind: 'transfer', categoryId: null, usd: 900 },
  { kind: 'expense', categoryId: 'comida', usd: 50, excluded: true },
];

describe('lista de movimientos de una partida', () => {
  it('es exactamente lo que suma el total de la partida (misma regla de reparto)', () => {
    const { byItem } = allocateSpending(items, txs.map((t) => ({ kind: t.kind, usdMinor: t.usd, categoryId: t.categoryId, excluded: t.excluded === true })), cats);
    for (const item of items) {
      const own = txsOfItem(item.id, items, cats, txs, (t) => t.excluded === true);
      expect(own.reduce((s, t) => s + t.usd, 0)).toBe(byItem.get(item.id));
    }
  });
  it('una subcategoría sin partida propia cae en la del padre; con partida propia, en la suya', () => {
    expect(txsOfItem('i-comida', items, cats, txs, (t) => t.excluded === true).map((t) => t.usd)).toEqual([500]);
    expect(txsOfItem('i-rest', items, cats, txs, (t) => t.excluded === true).map((t) => t.usd)).toEqual([700]);
    const onlyParent = [items[0]!];
    expect(txsOfItem('i-comida', onlyParent, cats, txs, (t) => t.excluded === true).map((t) => t.usd)).toEqual([500, 700]);
  });
  it('las transferencias y las categorías excluidas nunca entran', () => {
    const all = items.flatMap((i) => txsOfItem(i.id, items, cats, txs, (t) => t.excluded === true));
    expect(all.some((t) => t.kind === 'transfer' || t.excluded)).toBe(false);
  });
});

const tx = (o: Partial<MovementTx> & Pick<MovementTx, 'id' | 'amountMinor' | 'kind'>): MovementTx => ({
  accountId: 'a', accountCurrency: 'VES', rateScaled: 40_000_000, categoryId: 'c', occurredAt: '2026-10-05T12:00:00', transferId: null,
  listedCurrency: null, categoryIcon: 'food', categoryName: 'Comida', concept: '', accountName: 'Banesco', ...o,
});

describe('lista de movimientos de una cuenta', () => {
  it('muestra los montos en la moneda de la cuenta y cada pata de transferencia por separado', () => {
    const rows = [
      tx({ id: '1', kind: 'expense', amountMinor: -400_00 }),
      tx({ id: '2', kind: 'transfer', amountMinor: 1000_00, transferId: 't', categoryId: null, categoryName: null }),
    ];
    const groups = buildMovementGroups(rows, { mode: 'native', today: '2026-10-10', excluded: new Set() });
    expect(groups).toHaveLength(1);
    expect(groups[0]?.rows.map((r) => r.id).sort()).toEqual(['1', '2']);
    expect(toRow(rows[0]!, 'native').amount).toContain('400');
    expect(toRow(rows[1]!, 'native').subtitle).toBe('TRANSFERENCIA');
    expect(toRow(rows[1]!, 'native').tone).toBe('income');
  });
  it('entradas - salidas = cambio de saldo del mes', () => {
    const rows = [{ amountMinor: -400 }, { amountMinor: 1000 }, { amountMinor: -100 }];
    const f = accountFlow(rows);
    expect(f).toEqual({ inMinor: 1000, outMinor: 500 });
    expect(f.inMinor - f.outMinor).toBe(500);
  });
});
