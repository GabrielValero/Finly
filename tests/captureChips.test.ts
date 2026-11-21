import { describe, expect, it } from 'vitest';
import {
  captureSaveLabel,
  captureTitle,
  conversionSummary,
  dateChipLabel,
  dateChoice,
  frequentCategoryChips,
  parseKindParam,
  rateChipLabel,
  tagsChipLabel,
  type ChipCategory,
} from '../src/utils/captureChips';

const cat = (id: string, name: string, over: Partial<ChipCategory> = {}): ChipCategory => ({ id, name, kind: 'expense', parentId: null, color: '#5B8DEF', ...over });

describe('frequentCategoryChips', () => {
  const cats = [cat('a', 'Comida'), cat('b', 'Transporte'), cat('c', 'Ocio'), cat('d', 'Salud'), cat('inc', 'Sueldo', { kind: 'income' })];

  it('ordena por uso, desempata por nombre y respeta el límite', () => {
    const usage = new Map([['a', 1], ['b', 5], ['c', 5]]);
    expect(frequentCategoryChips(cats, usage, 'expense', null, 3).map((c) => c.id)).toEqual(['c', 'b', 'a']);
  });
  it('completa con categorías sin uso (alfabético) y excluye otro tipo', () => {
    const ids = frequentCategoryChips(cats, new Map(), 'expense', null, 10).map((c) => c.id);
    expect(ids).toEqual(['a', 'c', 'd', 'b']);
  });
  it('suma el uso de las hijas al padre', () => {
    const withSub = [...cats, cat('s1', 'Bus', { parentId: 'b' })];
    const usage = new Map([['a', 2], ['s1', 3]]);
    const chips = frequentCategoryChips(withSub, usage, 'expense', null, 2);
    expect(chips.map((c) => c.id)).toEqual(['b', 'a']);
    expect(chips.some((c) => c.id === 's1')).toBe(false);
  });
  it('marca la elegida y la antepone si no está entre las frecuentes', () => {
    const usage = new Map([['a', 9], ['b', 8]]);
    const chips = frequentCategoryChips(cats, usage, 'expense', 'd', 2);
    expect(chips.map((c) => c.id)).toEqual(['d', 'a', 'b']);
    expect(chips[0]!.selected).toBe(true);
    expect(chips[1]!.selected).toBe(false);
  });
  it('una subcategoría elegida marca a su padre y muestra «Padre › Hija»', () => {
    const withSub = [...cats, cat('s1', 'Bus', { parentId: 'b' })];
    const chips = frequentCategoryChips(withSub, new Map([['b', 3]]), 'expense', 's1', 2);
    expect(chips[0]).toMatchObject({ id: 'b', selected: true, label: 'Transporte › Bus' });
  });
  it('resuelve el color con el de la categoría o uno estable de la paleta', () => {
    const chips = frequentCategoryChips([cat('x', 'X', { color: null })], new Map(), 'expense', null, 1);
    expect(chips[0]!.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('dateChipLabel', () => {
  it('Hoy, Ayer y fecha corta sin año del año actual', () => {
    expect(dateChipLabel('2026-11-21', '2026-11-21')).toBe('Hoy');
    expect(dateChipLabel('2026-11-20', '2026-11-21')).toBe('Ayer');
    expect(dateChipLabel('2026-11-12', '2026-11-21')).toBe('12 nov');
  });
  it('incluye el año si es de otro año', () => {
    expect(dateChipLabel('2025-11-12', '2026-11-21')).toBe('12 nov 2025');
  });
});

describe('dateChoice', () => {
  it('distingue hoy, ayer y otra fecha', () => {
    expect(dateChoice('2026-11-21', '2026-11-21')).toBe('today');
    expect(dateChoice('2026-11-20', '2026-11-21')).toBe('yesterday');
    expect(dateChoice('2026-10-01', '2026-11-21')).toBe('other');
  });
});

describe('rateChipLabel', () => {
  it('formatea «Tasa 36,54»', () => {
    expect(rateChipLabel(36_540_000)).toBe('Tasa 36,54');
  });
});

describe('tagsChipLabel', () => {
  it('sin etiquetas, una y varias', () => {
    expect(tagsChipLabel([])).toBe('Etiquetas');
    expect(tagsChipLabel(['viaje'])).toBe('#viaje');
    expect(tagsChipLabel(['viaje', 'casa', 'x'])).toBe('#viaje +2');
  });
});

describe('conversionSummary', () => {
  it('Bs -> USD', () => {
    expect(conversionSummary({ amountMinor: 89_523, currency: 'VES', rateScaled: 36_540_000 })).toBe('Total ≈ $24,50 · Tasa 36,54');
  });
  it('USD -> Bs', () => {
    expect(conversionSummary({ amountMinor: 1_000, currency: 'USD', rateScaled: 36_540_000 })).toBe('Total ≈ Bs 365,40 · Tasa 36,54');
  });
  it('null sin monto o sin tasa', () => {
    expect(conversionSummary({ amountMinor: 0, currency: 'USD', rateScaled: 36_540_000 })).toBeNull();
    expect(conversionSummary({ amountMinor: 100, currency: 'USD', rateScaled: null })).toBeNull();
  });
});

describe('textos de la pantalla', () => {
  it('título y botón por tipo y modo', () => {
    expect(captureTitle(false)).toBe('Nuevo movimiento');
    expect(captureTitle(true)).toBe('Editar movimiento');
    expect(captureSaveLabel('expense', false)).toBe('Guardar gasto');
    expect(captureSaveLabel('income', false)).toBe('Guardar ingreso');
    expect(captureSaveLabel('expense', true)).toBe('Guardar cambios');
  });
});

describe('parseKindParam', () => {
  it('acepta income y expense; cualquier otra cosa es gasto', () => {
    expect(parseKindParam('income')).toBe('income');
    expect(parseKindParam('expense')).toBe('expense');
    expect(parseKindParam('transfer')).toBe('expense');
    expect(parseKindParam(undefined)).toBe('expense');
  });
});
