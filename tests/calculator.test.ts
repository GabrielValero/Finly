import { describe, expect, it } from 'vitest';
import { convertAmount, latestRatePerSource } from '../src/utils/calculator';

describe('calculadora de divisas', () => {
  it('convierte en ambos sentidos con la tasa dada', () => {
    const rate = 500_000_000; // 500 Bs por USD
    expect(convertAmount(1000, 'USD', rate)).toBe(500_000);
    expect(convertAmount(500_000, 'VES', rate)).toBe(1000);
    expect(convertAmount(1, 'VES', rate)).toBe(0);
  });

  it('elige la última tasa de cada fuente', () => {
    const out = latestRatePerSource([
      { source: 'bcv', rateScaled: 480_000_000, validFrom: '2026-10-19' },
      { source: 'bcv', rateScaled: 490_000_000, validFrom: '2026-10-20' },
      { source: 'manual', rateScaled: 600_000_000, validFrom: '2026-10-18' },
    ]);
    expect(out.map((o) => [o.source, o.rateScaled])).toEqual([['bcv', 490_000_000], ['manual', 600_000_000]]);
    expect(latestRatePerSource([])).toEqual([]);
  });
});
