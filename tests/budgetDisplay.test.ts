import { describe, expect, it } from 'vitest';
import { itemStatus } from '../src/utils/budget';
import { STATUS_STYLE, statusLabel } from '../src/utils/budgetDisplay';

describe('estado de una partida (mapeo del diseño G)', () => {
  const fixed = { kind: 'expense' as const, isFixed: true, plannedMinor: 10_000 };
  const variable = { kind: 'expense' as const, isFixed: false, plannedMinor: 10_000 };

  it('gasto fijo: Pagado (ingreso), Parcial (aviso), Pendiente (apagado)', () => {
    expect(statusLabel('expense', true, itemStatus(fixed, 10_000), 0)).toBe('PAGADO');
    expect(STATUS_STYLE[itemStatus(fixed, 10_000)].statusColor).toBe('income');
    expect(statusLabel('expense', true, itemStatus(fixed, 4_000), 6_000)).toBe('PARCIAL');
    expect(STATUS_STYLE[itemStatus(fixed, 4_000)].statusColor).toBe('warning');
    expect(statusLabel('expense', true, itemStatus(fixed, 0), 10_000)).toBe('PENDIENTE');
    expect(STATUS_STYLE[itemStatus(fixed, 0)].statusColor).toBe('textMuted');
  });

  it('gasto variable: Cerca del límite (aviso), Te pasaste (gasto)', () => {
    expect(statusLabel('expense', false, itemStatus(variable, 8_500), 1_500)).toBe('CERCA DEL LÍMITE');
    expect(STATUS_STYLE[itemStatus(variable, 8_500)].statusColor).toBe('warning');
    expect(statusLabel('expense', false, itemStatus(variable, 12_000), 0)).toBe('TE PASASTE');
    expect(STATUS_STYLE[itemStatus(variable, 12_000)].statusColor).toBe('expense');
    expect(STATUS_STYLE[itemStatus(variable, 12_000)].barColor).toBe('expense');
  });

  it('la barra de lo parcial y lo cercano usa el aviso', () => {
    expect(STATUS_STYLE.partial.barColor).toBe('warning');
    expect(STATUS_STYLE.near.barColor).toBe('warning');
  });
});
