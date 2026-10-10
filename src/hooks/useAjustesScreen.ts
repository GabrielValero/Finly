import { useRouter } from 'expo-router';
import { useThemeList } from './useTheme';
import { useAccountsWithBalance, useCategoryRows, useLatestRate } from './useData';
import { usePreferences } from '../store/preferences';
import { dayOf, formatAge, toLocalIso } from '../utils/dates';
import { formatRate } from '../utils/money';

const sourceLabel = (s: 'bcv' | 'manual') => (s === 'bcv' ? 'BCV' : 'Manual');

/** Datos de la pantalla principal de Ajustes (hub). */
export function useAjustesScreen() {
  const router = useRouter();
  const rate = useLatestRate();
  const accounts = useAccountsWithBalance();
  const categories = useCategoryRows();
  const source = usePreferences((s) => s.defaultRateSource);
  const { seeds, activeId } = useThemeList();
  const today = dayOf(toLocalIso(new Date()));
  return {
    rateValue: rate ? `${formatRate(rate.rateScaled)} · ${formatAge(rate.validFrom, today)}` : 'Sin tasa',
    sourceValue: sourceLabel(source),
    accountsValue: String(accounts.length),
    categoriesValue: String(categories.length),
    themeValue: seeds.find((s) => s.id === activeId)?.name ?? '',
    openRates: () => router.push('/settings/rates'),
    openAccounts: () => router.navigate('/cuentas'),
    openCategories: () => router.push('/categories'),
    openTheme: () => router.push('/settings/theme'),
    openDeleteData: () => router.push('/settings/delete-data'),
  };
}
