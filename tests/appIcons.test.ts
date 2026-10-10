import { describe, expect, it } from 'vitest';
import { DEFAULT_ICON, ICON_COLORS, ICON_SHAPES, allIconAliases, iconAliasName, iconLabel, parseIconAlias } from '../src/utils/appIcons';

describe('catálogo de íconos', () => {
  it('el ícono por defecto es la forma 8 en naranja y es la actividad principal (null)', () => {
    expect(DEFAULT_ICON).toEqual({ shape: 'h', color: 'naranja' });
    expect(iconAliasName(DEFAULT_ICON)).toBeNull();
    expect(parseIconAlias(null)).toEqual(DEFAULT_ICON);
  });
  it('hay un alias por combinación salvo la de por defecto, y se pueden invertir', () => {
    const all = allIconAliases();
    expect(all).toHaveLength(ICON_SHAPES.length * ICON_COLORS.length - 1);
    expect(new Set(all.map((a) => a.name)).size).toBe(all.length);
    for (const { name, choice } of all) expect(parseIconAlias(name)).toEqual(choice);
  });
  it('los nombres coinciden con los que genera app.config.js', () => {
    expect(iconAliasName({ shape: 'a', color: 'verde' })).toBe('IconAVerde');
    expect(iconAliasName({ shape: 'h', color: 'indigo' })).toBe('IconHIndigo');
  });
  it('un alias desconocido cae al ícono por defecto', () => {
    expect(parseIconAlias('Inventado')).toEqual(DEFAULT_ICON);
    expect(iconLabel({ shape: 'h', color: 'naranja' })).toBe('Impulso · Naranja');
  });
});
