import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { formatMinor, formatMoney, formatRate, usdToVes, vesToUsd } from '../utils/money';
import { portfolioTotal } from '../utils/portfolio';
import { latestTransfer } from '../utils/transfers';
import { useAccountsWithBalance, useLatestRate, useRecentTransferLegs, type AccountWithBalance } from './useData';

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
  const transferLegs = useRecentTransferLegs();

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
    const last = latestTransfer(transferLegs);
    return {
      totalLabel: `$ ${formatMinor(total.usdMinor)}`,
      totalNote: total.missingRate ? 'Falta la tasa para valorar tus cuentas en Bs' : null,
      usd: accounts.filter((a) => a.currency === 'USD').map(toCard),
      ves: accounts.filter((a) => a.currency === 'VES').map(toCard),
      isEmpty: accounts.length === 0,
      canTransfer: accounts.length >= 2,
      lastTransfer: last
        ? {
            id: last.transferId,
            route: `${last.fromName} → ${last.toName}`,
            amounts: `${formatMoney(last.outMinor, last.outCurrency)} → ${formatMoney(last.inMinor, last.inCurrency)}`,
            rate: last.rateScaled ? `Tasa obtenida ${formatRate(last.rateScaled)}${rate ? ` · ${rate.source === 'bcv' ? 'BCV' : 'Manual'} ${formatRate(rate.rateScaled)}` : ''}` : null,
          }
        : null,
      openTransfer: () => router.push('/transfer'),
      openAccount: (id: string) => router.push({ pathname: '/account-movements/[id]', params: { id } }),
      openNew: () => router.push('/account/new'),
    };
  }, [accounts, rate, transferLegs, router]);
}
