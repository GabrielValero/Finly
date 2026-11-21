import { describe, expect, it } from 'vitest';
import { toRow, type MovementTx } from '../src/utils/movementRows';

const base: MovementTx = {
  id: '1',
  accountId: 'a',
  accountCurrency: 'USD',
  kind: 'expense',
  amountMinor: -1500,
  rateScaled: null,
  categoryId: 'cat-1',
  occurredAt: '2026-11-13T09:05:00',
  transferId: null,
  listedCurrency: null,
  categoryIcon: 'food',
  categoryName: 'Comida',
  categoryColor: null,
  concept: '',
  accountName: 'Efectivo',
};

describe('toRow (historial general)', () => {
  it('el subtítulo lleva cuenta y hora', () => {
    expect(toRow(base).subtitle).toBe('Efectivo · 09:05');
  });
  it('trae el color de la categoría (guardado o de la paleta)', () => {
    expect(toRow({ ...base, categoryColor: '#112233' }).color).toBe('#112233');
    expect(toRow(base).color).toMatch(/^#[0-9A-F]{6}$/i);
  });
  it('una transferencia no lleva color', () => {
    expect(toRow({ ...base, kind: 'transfer', categoryId: null }).color).toBeNull();
  });
});
