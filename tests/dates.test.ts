import { describe, expect, it } from 'vitest';
import { addMonths, daysBetween, formatDateTimeLong, formatDayLabel, formatMonthLabel, monthBounds, recentMonths, toLocalIso } from '../src/utils/dates';

describe('dates', () => {
  it('toLocalIso usa hora local', () => {
    expect(toLocalIso(new Date(2026, 9, 9, 8, 14, 5))).toBe('2026-10-09T08:14:05');
  });
  it('daysBetween y etiquetas de día', () => {
    expect(daysBetween('2026-10-07', '2026-10-09')).toBe(2);
    expect(formatDayLabel('2026-10-09', '2026-10-09')).toBe('Hoy · 9 oct');
    expect(formatDayLabel('2026-10-08', '2026-10-09')).toBe('Ayer · 8 oct');
    expect(formatDayLabel('2026-10-07', '2026-10-09')).toBe('Mié · 7 oct');
  });
  it('meses', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(formatMonthLabel('2026-10')).toBe('Octubre 2026');
    expect(monthBounds('2026-12')).toEqual({ from: '2026-12-01T00:00:00', to: '2027-01-01T00:00:00' });
    expect(recentMonths('2026-02', 3)).toEqual(['2026-02', '2026-01', '2025-12']);
  });
  it('formatDateTimeLong', () => {
    expect(formatDateTimeLong('2026-10-09T08:14:00')).toBe('9 oct 2026 · 8:14 a. m.');
    expect(formatDateTimeLong('2026-10-09T00:05:00')).toBe('9 oct 2026 · 12:05 a. m.');
    expect(formatDateTimeLong('2026-10-09T15:30:00')).toBe('9 oct 2026 · 3:30 p. m.');
  });
});

import { isValidTime, shiftDay, timeOf, withTime } from '../src/utils/dates';
import { minorToBuffer, bufferToMinor } from '../src/utils/keypad';
import { enteredFromTx } from '../src/utils/entry';

describe('edición de fecha y hora', () => {
  it('shiftDay cruza mes y año conservando la hora', () => {
    expect(shiftDay('2026-10-01T08:14:00', -1)).toBe('2026-09-30T08:14:00');
    expect(shiftDay('2026-12-31T23:59:00', 1)).toBe('2027-01-01T23:59:00');
  });
  it('withTime / timeOf / isValidTime', () => {
    expect(withTime('2026-10-09T08:14:33', '17:05')).toBe('2026-10-09T17:05:00');
    expect(timeOf('2026-10-09T08:14:33')).toBe('08:14');
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('7:5')).toBe(false);
  });
});

describe('minorToBuffer', () => {
  it('es el inverso de bufferToMinor', () => {
    for (const m of [1, 50, 100, 1250, 4_350_000, 7]) expect(bufferToMinor(minorToBuffer(m))).toBe(m);
    expect(minorToBuffer(1250)).toBe('12,5');
    expect(minorToBuffer(700)).toBe('7');
  });
});

describe('enteredFromTx', () => {
  it('usa el precio listado si existe, si no el monto de la cuenta', () => {
    expect(enteredFromTx({ amountMinor: -516, accountCurrency: 'USD', listedAmountMinor: 450000, listedCurrency: 'VES' })).toEqual({ minor: 450000, currency: 'VES' });
    expect(enteredFromTx({ amountMinor: -516, accountCurrency: 'USD', listedAmountMinor: null, listedCurrency: null })).toEqual({ minor: 516, currency: 'USD' });
  });
});
