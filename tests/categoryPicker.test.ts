import { describe, expect, it } from 'vitest';
import { buildPickerRows, normalizeSearch, type PickerCategory } from '../src/utils/categoryPicker';

const cats: PickerCategory[] = [
  { id: 'casa', name: 'Casa', icon: 'home', parentId: null },
  { id: 'alquiler', name: 'Alquiler', icon: 'home', parentId: 'casa' },
  { id: 'internet', name: 'Internet y Teléfono', icon: 'phone', parentId: 'casa' },
  { id: 'alim', name: 'Alimentación', icon: 'food', parentId: null },
  { id: 'rest', name: 'Restaurantes', icon: 'food', parentId: 'alim' },
  { id: 'salud', name: 'Salud', icon: 'heart', parentId: null },
];
const base = { query: '', expanded: new Set<string>(), selectedId: null, disabledIds: new Set<string>() };
const ids = (rows: ReturnType<typeof buildPickerRows>) => rows.map((r) => (r.type === 'addSub' ? `+${r.parentId}` : r.id));

describe('buildPickerRows', () => {
  it('sin búsqueda: padres ordenados; solo los abiertos muestran sus hijas y la fila de nueva subcategoría', () => {
    expect(ids(buildPickerRows(cats, base))).toEqual(['alim', 'casa', 'salud']);
    expect(ids(buildPickerRows(cats, { ...base, expanded: new Set(['casa']) }))).toEqual(['alim', 'casa', 'alquiler', 'internet', '+casa', 'salud']);
  });
  it('solo los padres con hijas son expandibles', () => {
    const rows = buildPickerRows(cats, base);
    expect(rows.map((r) => r.type === 'parent' && r.expandable)).toEqual([true, true, false]);
  });
  it('busca sin importar tildes ni mayúsculas, y abre los grupos con coincidencias', () => {
    expect(normalizeSearch('  Teléfono ')).toBe('telefono');
    expect(ids(buildPickerRows(cats, { ...base, query: 'telefono' }))).toEqual(['casa', 'internet']);
  });
  it('si coincide el padre se muestran todas sus hijas; si solo una hija, solo esa', () => {
    expect(ids(buildPickerRows(cats, { ...base, query: 'casa' }))).toEqual(['casa', 'alquiler', 'internet']);
    expect(ids(buildPickerRows(cats, { ...base, query: 'rest' }))).toEqual(['alim', 'rest']);
  });
  it('sin coincidencias no hay filas', () => {
    expect(buildPickerRows(cats, { ...base, query: 'zzz' })).toEqual([]);
  });
  it('marca la elegida y las deshabilitadas', () => {
    const rows = buildPickerRows(cats, { ...base, expanded: new Set(['casa']), selectedId: 'alquiler', disabledIds: new Set(['salud']) });
    expect(rows.find((r) => r.type === 'child' && r.id === 'alquiler')).toMatchObject({ selected: true });
    expect(rows.find((r) => r.type === 'parent' && r.id === 'salud')).toMatchObject({ disabled: true });
  });
});
