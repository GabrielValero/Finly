import { describe, expect, it } from 'vitest';
import { resolveEntry } from '../src/utils/entry';
import { MoneyError } from '../src/utils/money';

const RATE = 36_500_000; // 36,5 Bs/$
const base = { rateScaled: RATE, rateSource: 'bcv' as const };

describe('resolveEntry', () => {
  it('USD en cuenta USD: sin tasa', () => {
    expect(resolveEntry({ ...base, enteredMinor: 1250, enteredCurrency: 'USD', accountCurrency: 'USD' })).toEqual({
      amountMinor: 1250, listedAmountMinor: null, listedCurrency: null, rateScaled: null, rateSource: null,
    });
  });
  it('USD en cuenta USD funciona sin tasa disponible', () => {
    expect(() => resolveEntry({ rateScaled: null, rateSource: null, enteredMinor: 100, enteredCurrency: 'USD', accountCurrency: 'USD' })).not.toThrow();
  });
  it('Bs pagados desde cuenta USD: convierte y guarda precio listado + tasa', () => {
    expect(resolveEntry({ ...base, enteredMinor: 36500, enteredCurrency: 'VES', accountCurrency: 'USD' })).toEqual({
      amountMinor: 1000, listedAmountMinor: 36500, listedCurrency: 'VES', rateScaled: RATE, rateSource: 'bcv',
    });
  });
  it('Bs en cuenta Bs: monto directo, tasa guardada para el equivalente USD', () => {
    expect(resolveEntry({ ...base, enteredMinor: 36500, enteredCurrency: 'VES', accountCurrency: 'VES' })).toEqual({
      amountMinor: 36500, listedAmountMinor: null, listedCurrency: null, rateScaled: RATE, rateSource: 'bcv',
    });
  });
  it('USD en cuenta Bs: convierte a Bs y guarda el precio en USD', () => {
    expect(resolveEntry({ ...base, enteredMinor: 1000, enteredCurrency: 'USD', accountCurrency: 'VES' })).toMatchObject({
      amountMinor: 36500, listedAmountMinor: 1000, listedCurrency: 'USD', rateScaled: RATE,
    });
  });
  it('exige tasa cuando interviene', () => {
    const none = { rateScaled: null, rateSource: null };
    expect(() => resolveEntry({ ...none, enteredMinor: 100, enteredCurrency: 'VES', accountCurrency: 'USD' })).toThrow(MoneyError);
    expect(() => resolveEntry({ ...none, enteredMinor: 100, enteredCurrency: 'VES', accountCurrency: 'VES' })).toThrow(MoneyError);
  });
  it('rechaza montos inválidos o que se redondean a cero', () => {
    expect(() => resolveEntry({ ...base, enteredMinor: 0, enteredCurrency: 'USD', accountCurrency: 'USD' })).toThrow(MoneyError);
    expect(() => resolveEntry({ ...base, enteredMinor: 1, enteredCurrency: 'VES', accountCurrency: 'USD' })).toThrow(MoneyError);
  });
});
