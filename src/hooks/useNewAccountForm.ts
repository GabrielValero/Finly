import { useRouter } from 'expo-router';
import { useState } from 'react';
import { insertAccount } from '../data/repos/accounts';
import { accountInputSchema } from '../schemas/account';
import { newId } from '../utils/ids';
import { formatMoney, type Currency } from '../utils/money';
import { useAmountBuffer } from './useAmountBuffer';
import { useAccountsWithBalance } from './useData';

export function useNewAccountForm() {
  const router = useRouter();
  const existing = useAccountsWithBalance();
  const balance = useAmountBuffer();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [icon, setIcon] = useState('cash');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const duplicate = existing.some((a) => a.name.toLowerCase() === trimmed.toLowerCase());

  const save = async () => {
    setError(null);
    const parsed = accountInputSchema.safeParse({ name, currency, icon, openingMinor: balance.minor, includeInTotal });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    if (duplicate) return setError('Ya tienes una cuenta con ese nombre');
    setSaving(true);
    try {
      await insertAccount({
        id: newId(),
        name: parsed.data.name,
        currency: parsed.data.currency,
        icon: parsed.data.icon,
        color: parsed.data.color,
        openingMinor: parsed.data.openingMinor,
        includeInTotal: parsed.data.includeInTotal,
        archivedAt: null,
        sortOrder: existing.length,
        updatedAt: new Date(),
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
      setSaving(false);
    }
  };

  return {
    name, setName, currency, setCurrency, icon, setIcon, includeInTotal, setIncludeInTotal,
    balance, balanceLabel: formatMoney(balance.minor, currency),
    previewName: trimmed || 'Nueva cuenta',
    canSave: trimmed.length > 0 && !duplicate && !saving,
    error: duplicate ? 'Ya tienes una cuenta con ese nombre' : error,
    save,
    close: () => router.back(),
  };
}
