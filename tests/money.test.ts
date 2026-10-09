import { describe, expect, it } from 'vitest';
import {
  formatMinor, formatMoney, formatRate, impliedRate, MoneyError, parseAmount, parseRate, usdToVes, vesToUsd,
} from '../src/utils/money';

describe('parseAmount (es-VE)', () => {
  it.each([
    ['4.500,00', 450000],
    ['4500,5', 450050],
    ['4500', 450000],
    ['1.234.567,89', 123456789],
    ['0,99', 99],
    ['  12,3 ', 1230],
    ['4.500', 450000],
  ])('%s -> %d', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', 'abc', '1,234,5', '12,345', '-5', '1.23', '1..000', '4.50,00'])('rechaza "%s"', (input) => {
    expect(() => parseAmount(input)).toThrow(MoneyError);
  });

  it('rechaza montos fuera del rango seguro', () => {
    expect(() => parseAmount('999.999.999.999.999.999')).toThrow(MoneyError);
  });
});

describe('parseRate', () => {
  it('escala a 1e6', () => {
    expect(parseRate('36,5432')).toBe(36_543_200);
    expect(parseRate('36.5')).toBe(36_500_000);
    expect(parseRate('40')).toBe(40_000_000);
  });
  it('rechaza cero o basura', () => {
    expect(() => parseRate('0')).toThrow(MoneyError);
    expect(() => parseRate('x')).toThrow(MoneyError);
  });
});

describe('format', () => {
  it('formatMinor agrupa miles', () => {
    expect(formatMinor(123456789)).toBe('1.234.567,89');
    expect(formatMinor(5)).toBe('0,05');
    expect(formatMinor(-450000)).toBe('-4.500,00');
  });
  it('formatMoney por moneda', () => {
    expect(formatMoney(1250, 'USD')).toBe('$12,50');
    expect(formatMoney(-450000, 'VES')).toBe('-Bs 4.500,00');
  });
  it('formatRate', () => {
    expect(formatRate(36_543_200)).toBe('36,5432');
    expect(formatRate(40_000_000)).toBe('40,00');
  });
  it('ida y vuelta parse(format(x)) === x', () => {
    for (const v of [0, 1, 99, 100, 123456, 987654321]) {
      expect(parseAmount(formatMinor(v))).toBe(v);
    }
  });
});

describe('conversión con BigInt', () => {
  const rate = parseRate('36,5'); // 36.5 Bs/USD
  it('USD -> VES', () => {
    expect(usdToVes(1000, rate)).toBe(36500); // $10 -> Bs 365,00
  });
  it('VES -> USD redondea half-away', () => {
    expect(vesToUsd(36500, rate)).toBe(1000);
    expect(vesToUsd(1, rate)).toBe(0); // 0,01 Bs = ~0,0003 USD
    expect(vesToUsd(-36500, rate)).toBe(-1000);
  });
  it('no pierde precisión con montos enormes (Number se desbordaría)', () => {
    const huge = 900_000_000_000_000; // 9e12 Bs
    const out = vesToUsd(huge, 40_000_000);
    expect(out).toBe(22_500_000_000_000);
  });
  it('impliedRate', () => {
    expect(impliedRate(36500, 1000)).toBe(36_500_000);
    expect(impliedRate(-36500, -1000)).toBe(36_500_000);
    expect(() => impliedRate(100, 0)).toThrow(MoneyError);
  });
  it('rechaza tasa inválida', () => {
    expect(() => usdToVes(100, 0)).toThrow(MoneyError);
  });
});
