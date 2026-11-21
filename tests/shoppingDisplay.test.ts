import { describe, expect, it } from 'vitest';
import { limitCaption, lineTotalNote, listCardSubtitle, notInCartLine, splitCartSections, topWishName } from '../src/utils/shoppingDisplay';

describe('listCardSubtitle', () => {
  const base = { completed: false, archived: false, pending: 3, checked: 1, total: 5 };
  it('mercado: pendientes y carrito', () => {
    expect(listCardSubtitle({ ...base, kind: 'market' })).toBe('3 pendientes · 1 en el carrito');
  });
  it('deseos: solo pendientes, con singular', () => {
    expect(listCardSubtitle({ ...base, kind: 'wish', pending: 1 })).toBe('1 pendiente');
  });
  it('sin pendientes', () => {
    expect(listCardSubtitle({ ...base, kind: 'market', pending: 0 })).toBe('Sin productos');
  });
  it('completada cuenta lo comprado', () => {
    expect(listCardSubtitle({ ...base, kind: 'market', completed: true })).toBe('Completada · 2 productos');
  });
  it('archivada cuenta todo', () => {
    expect(listCardSubtitle({ ...base, kind: 'market', archived: true, total: 1 })).toBe('Archivada · 1 producto');
  });
});

describe('limitCaption', () => {
  it('quedan', () => expect(limitCaption('ok', '$ 20,00', '$ 100,00')).toBe('Te quedan $ 20,00 de $ 100,00'));
  it('cerca del límite sigue siendo "quedan"', () => expect(limitCaption('near', '$ 5,00', '$ 100,00')).toBe('Te quedan $ 5,00 de $ 100,00'));
  it('te pasas', () => expect(limitCaption('over', '$ 8,00', '$ 100,00')).toBe('Te pasas $ 8,00 del límite de $ 100,00'));
  it('sin límite no hay texto', () => expect(limitCaption('none', '', '')).toBeNull());
});

describe('splitCartSections', () => {
  const row = (id: string, checked: boolean, purchased: boolean, usdMinor: number | null) => ({ id, checked, purchased, usdMinor });
  it('separa carrito, pendientes y comprados con subtotales', () => {
    const s = splitCartSections([row('a', true, false, 500), row('b', false, false, 300), row('c', true, false, null), row('d', false, false, null), row('e', true, true, 900)]);
    expect(s.cart.rows.map((r) => r.id)).toEqual(['a', 'c']);
    expect(s.cart.subtotalMinor).toBe(500);
    expect(s.pending.rows.map((r) => r.id)).toEqual(['b', 'd']);
    expect(s.pending.subtotalMinor).toBe(300);
    expect(s.purchased.map((r) => r.id)).toEqual(['e']);
  });
  it('vacío', () => {
    const s = splitCartSections([]);
    expect(s.cart.rows).toEqual([]);
    expect(s.pending.subtotalMinor).toBe(0);
  });
});

describe('notInCartLine', () => {
  it('ninguno', () => expect(notInCartLine(0)).toBeNull());
  it('uno', () => expect(notInCartLine(1)).toBe('El producto que no está en el carrito se queda pendiente en la lista.'));
  it('varios', () => expect(notInCartLine(4)).toBe('Los 4 productos que no están en el carrito se quedan pendientes en la lista.'));
});

describe('topWishName', () => {
  const w = (name: string, priority: 'low' | 'medium' | 'high' | null, purchased = false, sortOrder = 0) => ({ name, priority, purchasedAt: purchased ? new Date() : null, sortOrder });
  it('el pendiente de mayor prioridad', () => {
    expect(topWishName([w('A', 'low'), w('B', 'high'), w('C', 'medium')])).toBe('B');
  });
  it('ignora comprados', () => {
    expect(topWishName([w('A', 'high', true), w('B', 'medium')])).toBe('B');
  });
  it('sin prioridades no hay "más importante"', () => {
    expect(topWishName([w('A', null), w('B', null)])).toBeNull();
  });
});

describe('lineTotalNote', () => {
  it('sin IVA ni conversión no hay nota', () => expect(lineTotalNote({ taxable: false, usdLabel: null })).toBeNull());
  it('con IVA', () => expect(lineTotalNote({ taxable: true, usdLabel: null })).toBe('Con IVA 16 %'));
  it('con conversión a USD', () => expect(lineTotalNote({ taxable: false, usdLabel: '$ 2,50' })).toBe('≈ $ 2,50'));
  it('con ambas', () => expect(lineTotalNote({ taxable: true, usdLabel: '$ 2,50' })).toBe('Con IVA 16 % · ≈ $ 2,50'));
});
