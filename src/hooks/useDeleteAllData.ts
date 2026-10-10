import { useRouter } from 'expo-router';
import { useState } from 'react';
import { wipeAllData } from '../data/repos/reset';
import { usePreferences } from '../store/preferences';
import { useDataCounts } from './useData';

export const CONFIRM_WORD = 'BORRAR';

export function useDeleteAllData() {
  const router = useRouter();
  const counts = useDataCounts();
  const clearLastAccount = usePreferences((s) => s.clearLastAccount);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const run = async () => {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await wipeAllData(new Date());
      clearLastAccount();
      router.dismissAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron borrar los datos');
      setBusy(false);
    }
  };

  return {
    counts,
    rows: [
      { label: 'Cuentas', value: counts.accounts },
      { label: 'Movimientos', value: counts.movements },
      { label: 'Categorías', value: counts.categories },
      { label: 'Etiquetas', value: counts.tags },
    ],
    typed,
    setTyped,
    confirmed,
    busy,
    error,
    run,
    back: () => router.back(),
  };
}
