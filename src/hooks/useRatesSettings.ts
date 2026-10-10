import { useRouter } from 'expo-router';
import { usePreferences } from '../store/preferences';
import { dayOf, formatAge, formatDayShort, toLocalIso } from '../utils/dates';
import { formatRate } from '../utils/money';
import { useLatestRate, useRateHistory } from './useData';

export function useRatesSettings() {
  const router = useRouter();
  const latest = useLatestRate();
  const history = useRateHistory(30);
  const source = usePreferences((s) => s.defaultRateSource);
  const setSource = usePreferences((s) => s.setDefaultRateSource);
  const today = dayOf(toLocalIso(new Date()));
  const label = (s: 'bcv' | 'manual') => (s === 'bcv' ? 'BCV' : 'Manual');
  return {
    hero: latest
      ? { value: formatRate(latest.rateScaled), caption: `Bs por 1 USD · ${label(latest.source)} · ${formatAge(latest.validFrom, today)}` }
      : { value: '—', caption: 'Aún no hay tasa registrada' },
    source,
    setSource,
    history: history.map((r) => ({ id: r.id, date: formatDayShort(r.validFrom), value: `${formatRate(r.rateScaled)} · ${label(r.source)}` })),
    update: () => router.push('/rate'),
    back: () => router.back(),
  };
}
