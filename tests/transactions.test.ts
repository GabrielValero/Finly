import { describe, expect, it } from 'vitest';
import { MoneyError } from '../src/utils/money';
import { accountBalance, buildTransfer, signedAmount, usdEquivalent, type TxLike } from '../src/utils/transactions';

const tx = (p: Partial<TxLike>): TxLike => ({
  accountId: 'a', accountCurrency: 'USD', kind: 'expense', amountMinor: -100, rateScaled: null, ...p,
});

describe('accountBalance', () => {
  it('apertura + movimientos vivos de la cuenta', () => {
    const txs = [
      tx({ amountMinor: -1000 }),
      tx({ kind: 'income', amountMinor: 5000 }),
      tx({ amountMinor: -999, deletedAt: 1 }),
      tx({ accountId: 'b', amountMinor: -777 }),
    ];
    expect(accountBalance(10000, 'a', txs)).toBe(14000);
  });
});

describe('usdEquivalent', () => {
  it('USD tal cual; VES con snapshot', () => {
    expect(usdEquivalent(tx({ amountMinor: -1250 }))).toBe(-1250);
    expect(usdEquivalent(tx({ accountCurrency: 'VES', amountMinor: -36500, rateScaled: 36_500_000 }))).toBe(-1000);
  });
  it('VES sin tasa lanza', () => {
    expect(() => usdEquivalent(tx({ accountCurrency: 'VES', rateScaled: null }))).toThrow(MoneyError);
  });
});

describe('buildTransfer', () => {
  const usd = { id: 'u', currency: 'USD' as const };
  const ves = { id: 'v', currency: 'VES' as const };
  it('misma moneda: patas opuestas, sin tasa', () => {
    const [o, i] = buildTransfer({ from: usd, to: { id: 'u2', currency: 'USD' }, outMinor: 500, inMinor: 500, transferId: 't' });
    expect(o.amountMinor).toBe(-500);
    expect(i.amountMinor).toBe(500);
    expect(o.rateScaled).toBeNull();
    expect(o.transferId).toBe(i.transferId);
  });
  it('cruzada: tasa implícita en ambas patas', () => {
    const [o, i] = buildTransfer({ from: usd, to: ves, outMinor: 1000, inMinor: 36500, transferId: 't' });
    expect(o.rateScaled).toBe(36_500_000);
    expect(i.rateScaled).toBe(36_500_000);
    const [o2] = buildTransfer({ from: ves, to: usd, outMinor: 36500, inMinor: 1000, transferId: 't' });
    expect(o2.rateScaled).toBe(36_500_000);
  });
  it('valida entradas', () => {
    expect(() => buildTransfer({ from: usd, to: usd, outMinor: 1, inMinor: 1, transferId: 't' })).toThrow(MoneyError);
    expect(() => buildTransfer({ from: usd, to: { id: 'x', currency: 'USD' }, outMinor: 1, inMinor: 2, transferId: 't' })).toThrow(MoneyError);
    expect(() => buildTransfer({ from: usd, to: ves, outMinor: 0, inMinor: 1, transferId: 't' })).toThrow(MoneyError);
  });
});

describe('signedAmount', () => {
  it('signo por tipo', () => {
    expect(signedAmount('expense', 100)).toBe(-100);
    expect(signedAmount('income', 100)).toBe(100);
    expect(() => signedAmount('income', 0)).toThrow(MoneyError);
  });
});
