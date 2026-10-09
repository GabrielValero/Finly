import { describe, expect, it } from 'vitest';
import { transactionInputSchema } from '../src/schemas/transaction';

const base = {
  accountId: 'a', accountCurrency: 'USD', kind: 'expense', amountMinor: 500,
  occurredAt: '2026-10-09T12:00:00', categoryId: 'c',
};

describe('transactionInputSchema', () => {
  it('USD puro sin tasa es válido', () => {
    expect(transactionInputSchema.safeParse(base).success).toBe(true);
  });
  it('USD puro con tasa es inválido', () => {
    expect(transactionInputSchema.safeParse({ ...base, rateScaled: 1, rateSource: 'bcv' }).success).toBe(false);
  });
  it('cuenta VES exige tasa', () => {
    expect(transactionInputSchema.safeParse({ ...base, accountCurrency: 'VES' }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...base, accountCurrency: 'VES', rateScaled: 36_000_000, rateSource: 'bcv' }).success).toBe(true);
  });
  it('monto debe ser positivo y entero', () => {
    expect(transactionInputSchema.safeParse({ ...base, amountMinor: 0 }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...base, amountMinor: 1.5 }).success).toBe(false);
  });
});
