import { describe, expect, it } from 'vitest';
import { filterByTag, tagsInUse } from '../src/utils/tagFilter';

const rows = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];
const links = [
  { transactionId: 't1', tagId: 'a' },
  { transactionId: 't2', tagId: 'a' },
  { transactionId: 't2', tagId: 'b' },
  { transactionId: 'otro-mes', tagId: 'c' },
];

describe('filterByTag', () => {
  it('sin etiqueta devuelve todo', () => expect(filterByTag(rows, links, null)).toHaveLength(3));
  it('filtra por etiqueta', () => expect(filterByTag(rows, links, 'a').map((r) => r.id)).toEqual(['t1', 't2']));
  it('etiqueta sin movimientos devuelve vacío', () => expect(filterByTag(rows, links, 'zzz')).toEqual([]));
});

describe('tagsInUse', () => {
  it('solo etiquetas usadas en los movimientos del mes, con conteo', () => {
    const tags = [{ id: 'b', name: 'Préstamo' }, { id: 'a', name: 'Ahorros' }, { id: 'c', name: 'Viejo' }];
    expect(tagsInUse(tags, links, new Set(['t1', 't2', 't3']))).toEqual([
      { id: 'a', name: 'Ahorros', count: 2 },
      { id: 'b', name: 'Préstamo', count: 1 },
    ]);
  });
});
