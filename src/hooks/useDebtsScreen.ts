import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { dayOf, formatDayShort, toLocalIso } from '../utils/dates';
import { DIRECTION_LABEL, debtStatus, debtUsd, remainingMinor, summarizeDebts, type DebtDirection, type DebtStatus } from '../utils/debts';
import { formatMoney } from '../utils/money';
import { useLatestRate } from './useData';
import { useAllDebtPayments, useAllDebts } from './useDebtData';

export interface DebtRowVm {
  id: string;
  person: string;
  subtitle: string;
  remaining: string;
  usdNote: string | null;
  progress: number;
  status: DebtStatus;
}

export function useDebtsScreen() {
  const router = useRouter();
  const debts = useAllDebts();
  const payments = useAllDebtPayments();
  const rate = useLatestRate();
  const [tab, setTab] = useState<DebtDirection>('owed_to_me');
  const today = dayOf(toLocalIso(new Date()));

  return useMemo(() => {
    const enriched = debts.map((d) => {
      const own = payments.filter((p) => p.debtId === d.id);
      return { ...d, remainingMinor: remainingMinor(d.principalMinor, own) };
    });
    const totals = summarizeDebts(enriched, rate?.rateScaled ?? null);
    const toRow = (d: (typeof enriched)[number]): DebtRowVm => {
      const status = debtStatus(d.remainingMinor, d.dueOn, today);
      const usd = d.currency === 'VES' ? debtUsd(d.remainingMinor, d.currency, rate?.rateScaled ?? null) : null;
      return {
        id: d.id,
        person: d.person,
        subtitle:
          status === 'settled' ? 'Saldada'
          : d.dueOn ? `${status === 'overdue' ? 'Vencida el' : 'Vence el'} ${formatDayShort(d.dueOn)}`
          : `Desde ${formatDayShort(d.openedOn)}`,
        remaining: formatMoney(d.remainingMinor, d.currency),
        usdNote: usd === null ? null : `≈ ${formatMoney(usd, 'USD')}`,
        progress: 1 - d.remainingMinor / d.principalMinor,
        status,
      };
    };
    const ofTab = enriched.filter((d) => d.direction === tab);
    const open = ofTab.filter((d) => d.remainingMinor > 0).sort((a, b) => (a.dueOn ?? '9999') < (b.dueOn ?? '9999') ? -1 : 1);
    return {
      tab,
      setTab,
      tabs: [
        { value: 'owed_to_me' as const, label: DIRECTION_LABEL.owed_to_me },
        { value: 'i_owe' as const, label: DIRECTION_LABEL.i_owe },
      ],
      owedToMe: formatMoney(totals.owedToMeUsd, 'USD'),
      iOwe: formatMoney(totals.iOweUsd, 'USD'),
      net: `${totals.owedToMeUsd - totals.iOweUsd < 0 ? '-' : ''}${formatMoney(Math.abs(totals.owedToMeUsd - totals.iOweUsd), 'USD')}`,
      netPositive: totals.owedToMeUsd - totals.iOweUsd >= 0,
      unvalued: totals.unvalued,
      open: open.map(toRow),
      settled: ofTab.filter((d) => d.remainingMinor <= 0).map(toRow),
      isEmpty: debts.length === 0,
      emptyTab: ofTab.length === 0,
      openDebt: (id: string) => router.push({ pathname: '/debt/[id]', params: { id } }),
      newDebt: () => router.push({ pathname: '/debt-form/[id]', params: { id: 'new', direction: tab } }),
      back: () => router.back(),
    };
  }, [debts, payments, rate, tab, today, router]);
}
