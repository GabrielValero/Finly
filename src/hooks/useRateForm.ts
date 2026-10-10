import { useRouter } from 'expo-router';
import { useState } from 'react';
import { upsertRate } from '../data/repos/rates';
import { rateInputSchema } from '../schemas/rate';
import { dayOf, toLocalIso } from '../utils/dates';
import { newId } from '../utils/ids';
import { formatRate } from '../utils/money';
import type { RateSource } from '../utils/rates';
import { usePreferences } from '../store/preferences';
import { useAmountBuffer } from './useAmountBuffer';
import { useLatestRate } from './useData';

export function useRateForm() {
  const router = useRouter();
  const latest = useLatestRate();
  const defaultSource = usePreferences((s) => s.defaultRateSource);
  const amount = useAmountBuffer(4);
  const [source, setSource] = useState<RateSource>(defaultSource);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(null);
    const parsed = rateInputSchema.safeParse({ source, rateScaled: amount.rateScaled, validFrom: dayOf(toLocalIso(new Date())) });
    if (!parsed.success) return setError('Escribe una tasa válida');
    setSaving(true);
    try {
      await upsertRate({ id: newId(), ...parsed.data, fetchedAt: new Date() });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la tasa');
      setSaving(false);
    }
  };

  return {
    amount,
    source,
    setSource,
    latestLabel: latest ? `Última: ${formatRate(latest.rateScaled)} · ${latest.source === 'bcv' ? 'BCV' : 'manual'} · ${latest.validFrom}` : 'Aún no hay tasa registrada',
    canSave: amount.rateScaled > 0 && !saving,
    error,
    save,
    close: () => router.back(),
  };
}
