import { describe, expect, it } from 'vitest';
import { canReloadNow, RELOAD_WINDOW_MS } from '../src/utils/updates';

describe('canReloadNow', () => {
  it('permite reiniciar dentro de la ventana', () => {
    expect(canReloadNow(0)).toBe(true);
    expect(canReloadNow(RELOAD_WINDOW_MS)).toBe(true);
  });
  it('no reinicia pasada la ventana ni con tiempos inválidos', () => {
    expect(canReloadNow(RELOAD_WINDOW_MS + 1)).toBe(false);
    expect(canReloadNow(-1)).toBe(false);
  });
});
