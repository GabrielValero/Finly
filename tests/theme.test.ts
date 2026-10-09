import { describe, expect, it } from 'vitest';
import { themeSeedSchema } from '../src/schemas/theme';
import {
  BUILTIN_SEEDS, DEFAULT_THEME_ID, deriveTheme, finlyDark, finlyLight, resolveTheme, THEME_COLOR_KEYS, validateTheme,
} from '../src/utils/theme';

describe('temas integrados', () => {
  it.each(BUILTIN_SEEDS)('$id define todos los roles y es legible', (seed) => {
    const theme = deriveTheme(seed);
    for (const key of THEME_COLOR_KEYS) expect(theme.colors[key]).toMatch(/^#[0-9A-F]{6}$/);
    expect(validateTheme(theme)).toEqual([]);
  });

  it('finly-dark reproduce los tokens de Figma', () => {
    const c = deriveTheme(finlyDark).colors;
    expect(c).toMatchObject({ bg: '#0A0A0B', surface: '#141416', surface2: '#1D1D21', border: '#2B2B31', text: '#F5F5F6', textMuted: '#9A9AA3', accent: '#FF6B2C', income: '#B8F34A', expense: '#FF6B6B' });
  });

  it('ids únicos', () => {
    expect(new Set(BUILTIN_SEEDS.map((s) => s.id)).size).toBe(BUILTIN_SEEDS.length);
  });
});

describe('deriveTheme', () => {
  it('con solo 3 colores base produce un tema coherente', () => {
    const t = deriveTheme({ ...finlyDark, id: 'x', overrides: undefined, accent: '#4DA3FF' });
    expect(t.colors.accent).toBe('#4DA3FF');
    expect(validateTheme(t)).toEqual([]);
  });
  it('overrides ganan sobre lo derivado', () => {
    expect(deriveTheme({ ...finlyDark, overrides: { border: '#123456' } }).colors.border).toBe('#123456');
  });
  it('validateTheme detecta ilegibles', () => {
    const t = deriveTheme({ ...finlyDark, overrides: undefined, text: '#121214' });
    expect(validateTheme(t).some((i) => i.role === 'text/bg')).toBe(true);
  });
});

describe('resolveTheme', () => {
  it('encuentra integrados y personalizados', () => {
    expect(resolveTheme('finly-light').kind).toBe('light');
    const custom = { ...finlyDark, id: 'mio', name: 'Mío', accent: '#00FFAA' };
    expect(resolveTheme('mio', [custom]).colors.accent).toBe('#00FFAA');
  });
  it('id desconocido cae al tema por defecto', () => {
    expect(resolveTheme('borrado').id).toBe(DEFAULT_THEME_ID);
  });
  it('incluye tokens', () => {
    expect(resolveTheme('finly-dark').space[16]).toBe(16);
  });
});

describe('themeSeedSchema', () => {
  it('acepta y normaliza semillas válidas', () => {
    const r = themeSeedSchema.parse({ ...finlyLight, accent: '#e04e0b' });
    expect(r.accent).toBe('#E04E0B');
  });
  it('rechaza hex inválido, claves extra en overrides y kind desconocido', () => {
    expect(themeSeedSchema.safeParse({ ...finlyDark, bg: 'red' }).success).toBe(false);
    expect(themeSeedSchema.safeParse({ ...finlyDark, overrides: { nope: '#000000' } }).success).toBe(false);
    expect(themeSeedSchema.safeParse({ ...finlyDark, kind: 'sepia' }).success).toBe(false);
  });
});
