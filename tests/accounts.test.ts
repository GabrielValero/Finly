import { describe, expect, it } from 'vitest';
import { accountBalance } from '../src/utils/transactions';
import { openingForTargetBalance } from '../src/utils/accounts';

describe('openingForTargetBalance', () => {
  it('fijar el saldo actual no altera los movimientos y deja el saldo pedido', () => {
    const txs = [{ accountId: 'a', accountCurrency: 'USD' as const, kind: 'expense' as const, amountMinor: -3000, rateScaled: null }, { accountId: 'a', accountCurrency: 'USD' as const, kind: 'income' as const, amountMinor: 1000, rateScaled: null }];
    const opening = 10_000;
    const balance = accountBalance(opening, 'a', txs); // 8.000
    const next = openingForTargetBalance(25_000, balance, opening);
    expect(accountBalance(next, 'a', txs)).toBe(25_000);
  });
});
