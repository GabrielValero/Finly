import { useMemo, useState } from 'react';
import type { MovementLink } from '../data/repos/debts';
import { formatMoney, type Currency } from '../utils/money';
import { needsRate } from '../utils/rates';
import { useAccountsWithBalance, useLatestRate } from './useData';

/**
 * Elección opcional de la cuenta donde registrar el préstamo o el pago.
 * `link` es null si no se eligió cuenta; `problem` explica por qué no se puede registrar (p. ej. falta la tasa).
 */
export function useMovementLink(debtCurrency: Currency) {
  const accounts = useAccountsWithBalance();
  const rate = useLatestRate();
  const [accountId, setAccountId] = useState<string | null>(null);
  const account = accounts.find((a) => a.id === accountId) ?? null;

  return useMemo(() => {
    const rateRequired = account ? needsRate(account.currency, account.currency === debtCurrency ? null : debtCurrency) : false;
    const link: MovementLink | null = account
      ? { accountId: account.id, accountCurrency: account.currency, rate: rate ? { rateScaled: rate.rateScaled, source: rate.source } : null }
      : null;
    return {
      accountId,
      setAccountId,
      account,
      link,
      problem: rateRequired && !rate ? 'Falta la tasa del día para registrar en esa cuenta' : null,
      options: [
        { value: 'none', label: 'No registrar en una cuenta', hint: 'Solo llevar la deuda' },
        ...accounts.map((a) => ({ value: a.id, label: a.name, hint: `${a.currency} · ${formatMoney(a.balanceMinor, a.currency)}` })),
      ],
      label: account ? account.name : 'No registrar en una cuenta',
    };
  }, [accounts, account, accountId, rate, debtCurrency]);
}
