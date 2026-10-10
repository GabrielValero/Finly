import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { archiveAccount, insertAccount, updateAccount } from '../data/repos/accounts';
import { accountInputSchema } from '../schemas/account';
import { openingForTargetBalance } from '../utils/accounts';
import { newId } from '../utils/ids';
import { formatMoney, type Currency } from '../utils/money';
import { useAmountBuffer } from './useAmountBuffer';
import { useAccountsWithBalance } from './useData';

/** Crear (`id` undefined) o editar una cuenta. */
export function useAccountForm(id?: string) {
  const router = useRouter();
  const accounts = useAccountsWithBalance();
  const existing = id ? (accounts.find((a) => a.id === id) ?? null) : null;
  const isEdit = id !== undefined;

  const balance = useAmountBuffer();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [icon, setIcon] = useState('cash');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [balanceTouched, setBalanceTouched] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setBalanceFromExisting = balance.set;
  useEffect(() => {
    if (hydrated || !existing) return;
    setName(existing.name);
    setCurrency(existing.currency);
    setIcon(existing.icon);
    setIncludeInTotal(existing.includeInTotal);
    setBalanceFromExisting(Math.max(existing.balanceMinor, 0));
    setHydrated(true);
  }, [hydrated, existing, setBalanceFromExisting]);

  const trimmed = name.trim();
  const duplicate = accounts.some((a) => a.id !== id && a.name.toLowerCase() === trimmed.toLowerCase());
  const currencyLocked = isEdit && (existing?.txCount ?? 0) > 0;

  const pressBalance = (key: Parameters<typeof balance.press>[0]) => {
    setBalanceTouched(true);
    balance.press(key);
  };

  const save = async () => {
    setError(null);
    const parsed = accountInputSchema.safeParse({ name, currency, icon, openingMinor: balance.minor, includeInTotal });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    if (duplicate) return setError('Ya tienes una cuenta con ese nombre');
    setSaving(true);
    try {
      if (isEdit && id && existing) {
        // El saldo se deriva (apertura + movimientos): para fijar el saldo actual se ajusta la apertura.
        const openingMinor = balanceTouched ? openingForTargetBalance(parsed.data.openingMinor, existing.balanceMinor, existing.openingMinor) : existing.openingMinor;
        await updateAccount(id, { name: parsed.data.name, currency: parsed.data.currency, icon: parsed.data.icon, openingMinor, includeInTotal: parsed.data.includeInTotal });
      } else {
        await insertAccount({
          id: newId(),
          name: parsed.data.name,
          currency: parsed.data.currency,
          icon: parsed.data.icon,
          color: parsed.data.color,
          openingMinor: parsed.data.openingMinor,
          includeInTotal: parsed.data.includeInTotal,
          archivedAt: null,
          sortOrder: accounts.length,
          updatedAt: new Date(),
        });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la cuenta');
      setSaving(false);
    }
  };

  const confirmArchive = () => {
    if (!existing) return;
    Alert.alert('Archivar cuenta', `${existing.name} dejará de aparecer y de sumar al patrimonio. Sus movimientos se conservan.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Archivar', style: 'destructive', onPress: () => void archiveAccount(existing.id, new Date()).then(() => router.back()) },
    ]);
  };

  const negativeBalance = isEdit && existing !== null && existing.balanceMinor < 0 && !balanceTouched;

  return {
    isEdit,
    notFound: isEdit && accounts.length > 0 && !existing,
    title: isEdit ? 'EDITAR CUENTA' : 'NUEVA CUENTA',
    submitLabel: isEdit ? 'Guardar cambios' : 'Crear cuenta',
    name, setName, currency, setCurrency, icon, setIcon, includeInTotal, setIncludeInTotal,
    currencyLocked,
    balance, pressBalance,
    balanceDisplay: negativeBalance && existing ? formatMoney(existing.balanceMinor, existing.currency) : null,
    balanceLabel: negativeBalance && existing ? formatMoney(existing.balanceMinor, existing.currency) : formatMoney(balance.minor, currency),
    previewName: trimmed || (isEdit ? 'Cuenta' : 'Nueva cuenta'),
    canSave: hydrated && trimmed.length > 0 && !duplicate && !saving,
    error: duplicate ? 'Ya tienes una cuenta con ese nombre' : error,
    save,
    canArchive: isEdit && existing !== null,
    confirmArchive,
    close: () => router.back(),
  };
}
