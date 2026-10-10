import { useRouter } from 'expo-router';
import { useBackupStatus } from './useBackupScreen';
import { useCurrentIconLabel } from './useAppIconSettings';
import { useLockSetting } from './useAppLock';
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
  const backup = useBackupStatus();
  const lock = useLockSetting();
  const iconLabel = useCurrentIconLabel();
  const today = dayOf(toLocalIso(new Date()));
  return {
    rateValue: rate ? `${formatRate(rate.rateScaled)} · ${formatAge(rate.validFrom, today)}` : 'Sin tasa',
    sourceValue: sourceLabel(source),
    accountsValue: String(accounts.length),
    categoriesValue: String(categories.length),
    themeValue: seeds.find((s) => s.id === activeId)?.name ?? '',
    backupBanner: backup.hasBackup ? null : backup.text,
    backupValue: backup.hasBackup ? backup.text.replace('Último respaldo: ', '') : 'Nunca',
    lockValue: lock.enabled ? 'Activado' : 'Apagado',
    lockError: lock.error,
    toggleLock: () => void lock.toggle(),
    openBackup: () => router.push('/settings/backup'),
    openRates: () => router.push('/settings/rates'),
    openAccounts: () => router.navigate('/cuentas'),
    openCategories: () => router.push('/categories'),
    iconValue: iconLabel,
    openAppIcon: () => router.push('/settings/app-icon'),
    openTheme: () => router.push('/settings/theme'),
    openDeleteData: () => router.push('/settings/delete-data'),
  };
}
