import { describe, expect, it } from 'vitest';
import { needsRate, resolveRate, type RateRecord } from '../src/utils/rates';

const rates: RateRecord[] = [
  { source: 'bcv', rateScaled: 36_000_000, validFrom: '2026-10-02' },
  { source: 'bcv', rateScaled: 37_000_000, validFrom: '2026-10-06' }, // lunes aplicado desde sábado
  { source: 'manual', rateScaled: 40_000_000, validFrom: '2026-10-01' },
];

describe('resolveRate', () => {
  it('toma la más reciente <= fecha', () => {
    expect(resolveRate(rates, 'bcv', '2026-10-05')?.rateScaled).toBe(36_000_000);
    expect(resolveRate(rates, 'bcv', '2026-10-06')?.rateScaled).toBe(37_000_000);
    expect(resolveRate(rates, 'bcv', '2026-12-31')?.rateScaled).toBe(37_000_000);
  });
  it('filtra por fuente', () => {
    expect(resolveRate(rates, 'manual', '2026-10-09')?.rateScaled).toBe(40_000_000);
  });
  it('null si no hay tasa anterior', () => {
    expect(resolveRate(rates, 'bcv', '2026-09-01')).toBeNull();
  });
});

describe('needsRate', () => {
  it('cuenta VES siempre', () => {
    expect(needsRate('VES', null)).toBe(true);
    expect(needsRate('VES', 'VES')).toBe(true);
  });
  it('cuenta USD solo si se listó en Bs', () => {
    expect(needsRate('USD', null)).toBe(false);
    expect(needsRate('USD', 'USD')).toBe(false);
    expect(needsRate('USD', 'VES')).toBe(true);
  });
});

describe('pickLatestRate', () => {
  it('prefiere la fuente elegida y cae a la otra si no hay', async () => {
    const { pickLatestRate } = await import('../src/utils/rates');
    expect(pickLatestRate(rates, 'manual')?.rateScaled).toBe(40_000_000);
    expect(pickLatestRate(rates, 'bcv')?.validFrom).toBe('2026-10-06');
    expect(pickLatestRate(rates.filter((r) => r.source === 'bcv'), 'manual')?.source).toBe('bcv');
    expect(pickLatestRate([], 'bcv')).toBeNull();
  });
});
