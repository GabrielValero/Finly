import { describe, expect, it } from 'vitest';
import { normalizeTagName } from '../src/utils/tags';

describe('normalizeTagName', () => {
  it('quita # y espacios, pasa a minúscula y une con guion', () => {
    expect(normalizeTagName('  #Semana Santa ')).toBe('semana-santa');
    expect(normalizeTagName('##casa')).toBe('casa');
  });
  it('vacío -> null y largo acotado', () => {
    expect(normalizeTagName('  # ')).toBeNull();
    expect(normalizeTagName('a'.repeat(50))).toHaveLength(30);
  });
});
