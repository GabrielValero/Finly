import { describe, expect, it } from 'vitest';
import { buildCategoryTree, categoryPath, isExcluded, validateCategory, type CategoryNode } from '../src/utils/categories';

const all: CategoryNode[] = [
  { id: 'comida', name: 'Comida', kind: 'expense', parentId: null },
  { id: 'mercado', name: 'Mercado', kind: 'expense', parentId: 'comida' },
  { id: 'cafe', name: 'Café', kind: 'expense', parentId: 'comida' },
  { id: 'freelance', name: 'Freelance', kind: 'income', parentId: null },
  { id: 'ropa', name: 'Ropa', kind: 'expense', parentId: null },
];
const draft = (o: Partial<Parameters<typeof validateCategory>[0]>) => ({ id: null, name: 'Nueva', kind: 'expense' as const, parentId: null, ...o });

describe('validateCategory', () => {
  it('acepta una categoría raíz y una subcategoría válidas', () => {
    expect(validateCategory(draft({}), all)).toBeNull();
    expect(validateCategory(draft({ parentId: 'ropa' }), all)).toBeNull();
  });
  it('exige nombre y limita su largo', () => {
    expect(validateCategory(draft({ name: '   ' }), all)).not.toBeNull();
    expect(validateCategory(draft({ name: 'x'.repeat(41) }), all)).not.toBeNull();
  });
  it('con requireParent exige elegir la categoría padre', () => {
    expect(validateCategory({ ...draft({}), requireParent: true }, all)).toMatch(/padre/);
    expect(validateCategory({ ...draft({ parentId: 'ropa' }), requireParent: true }, all)).toBeNull();
  });
  it('máximo 2 niveles', () => {
    expect(validateCategory(draft({ parentId: 'mercado' }), all)).toMatch(/2 niveles/);
  });
  it('la subcategoría debe ser del tipo del padre', () => {
    expect(validateCategory(draft({ kind: 'income', parentId: 'comida' }), all)).toMatch(/mismo tipo/);
  });
  it('no puede ser su propio padre ni apuntar a un padre inexistente', () => {
    expect(validateCategory(draft({ id: 'ropa', name: 'Ropa', parentId: 'ropa' }), all)).not.toBeNull();
    expect(validateCategory(draft({ parentId: 'fantasma' }), all)).not.toBeNull();
  });
  it('un padre con hijas no puede bajar de nivel ni cambiar de tipo', () => {
    expect(validateCategory(draft({ id: 'comida', name: 'Comida', parentId: 'ropa' }), all)).toMatch(/subcategorías/);
    expect(validateCategory(draft({ id: 'comida', name: 'Comida', kind: 'income' }), all)).toMatch(/subcategorías/);
  });
  it('nombre único entre hermanas, ignorando mayúsculas; editarse a sí misma está bien', () => {
    expect(validateCategory(draft({ name: 'mercado', parentId: 'comida' }), all)).toMatch(/Ya existe/);
    expect(validateCategory(draft({ id: 'mercado', name: 'Mercado', parentId: 'comida' }), all)).toBeNull();
    // mismo nombre en otro padre u otro tipo no choca
    expect(validateCategory(draft({ name: 'Mercado', parentId: 'ropa' }), all)).toBeNull();
    expect(validateCategory(draft({ name: 'Comida', kind: 'income' }), all)).toBeNull();
  });
});

describe('buildCategoryTree', () => {
  it('agrupa hijas y el conteo del padre las incluye', () => {
    const counts = new Map([['mercado', 52], ['cafe', 10], ['comida', 24], ['ropa', 18]]);
    const tree = buildCategoryTree(all.filter((c) => c.kind === 'expense'), counts);
    expect(tree.map((t) => t.category.id)).toEqual(['comida', 'ropa']);
    expect(tree[0]!.count).toBe(86);
    expect(tree[0]!.children.map((c) => c.category.id)).toEqual(['cafe', 'mercado']);
    expect(tree[1]!.count).toBe(18);
  });
});

describe('helpers', () => {
  it('categoryPath', () => {
    expect(categoryPath('Víveres', 'Mercado')).toBe('Mercado › Víveres');
    expect(categoryPath('Ropa', null)).toBe('Ropa');
    expect(categoryPath(null, null)).toBeNull();
  });
  it('isExcluded hereda del padre', () => {
    expect(isExcluded(false, true)).toBe(true);
    expect(isExcluded(true, null)).toBe(true);
    expect(isExcluded(false, null)).toBe(false);
  });
});
