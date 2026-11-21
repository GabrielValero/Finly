import { describe, expect, it } from 'vitest';
import { centerActionRoute, splitTabRoutes } from '../src/utils/tabBar';

describe('centerActionRoute', () => {
  it('abre la captura cuando hay cuentas', () => {
    expect(centerActionRoute(true)).toBe('/capture');
  });
  it('lleva a crear cuenta cuando no hay ninguna', () => {
    expect(centerActionRoute(false)).toBe('/account/new');
  });
});

describe('splitTabRoutes', () => {
  it('reparte la mitad a cada lado del botón central', () => {
    const r = splitTabRoutes(['index', 'cuentas', 'presupuesto', 'reportes']);
    expect(r.left).toEqual(['index', 'cuentas']);
    expect(r.right).toEqual(['presupuesto', 'reportes']);
  });
});
