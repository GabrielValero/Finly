import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { formatMinor, formatMoney, usdToVes, vesToUsd } from '../utils/money';
import { portfolioTotal } from '../utils/portfolio';
import { useAccountsWithBalance, useLatestRate, type AccountWithBalance } from './useData';

export interface AccountCardVm {
  id: string;
  name: string;
  icon: string;
  meta: string;
  balance: string;
  equivalent: string | null;
}

export function useAccountsScreen() {
  const router = useRouter();
  const accounts = useAccountsWithBalance();
  const rate = useLatestRate();

  return useMemo(() => {
    const toCard = (a: AccountWithBalance): AccountCardVm => {
      let equivalent: string | null = null;
      if (rate) {
        equivalent = a.currency === 'USD'
          ? `≈ ${formatMoney(usdToVes(a.balanceMinor, rate.rateScaled), 'VES')}`
          : `≈ ${formatMoney(vesToUsd(a.balanceMinor, rate.rateScaled), 'USD')}`;
      }
      return { id: a.id, name: a.name, icon: a.icon, meta: a.currency, balance: formatMoney(a.balanceMinor, a.currency), equivalent };
    };
    const total = portfolioTotal(accounts, rate?.rateScaled ?? null);
    return {
      totalLabel: `$ ${formatMinor(total.usdMinor)}`,
      totalNote: total.missingRate ? 'Falta la tasa para valorar tus cuentas en Bs' : null,
      usd: accounts.filter((a) => a.currency === 'USD').map(toCard),
      ves: accounts.filter((a) => a.currency === 'VES').map(toCard),
      isEmpty: accounts.length === 0,
      openNew: () => router.push('/account/new'),
    };
  }, [accounts, rate, router]);
}
