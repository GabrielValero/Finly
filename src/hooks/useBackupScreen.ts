import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { exportBackup, restoreBackup } from '../data/repos/backup';
import { backupFileSchema } from '../schemas/backup';
import { pickBackupText, shareBackupFile } from '../services/backupFiles';
import { usePreferences } from '../store/preferences';
import { backupFileName, parseBackupText, summarizeBackup } from '../utils/backup';
import { dayOf, formatAge, toLocalIso } from '../utils/dates';
import { useDataCounts } from './useData';

/** Texto de estado del último respaldo (compartido con el aviso de Ajustes). */
export function useBackupStatus() {
  const last = usePreferences((s) => s.lastBackupAt);
  const today = dayOf(toLocalIso(new Date()));
  return {
    hasBackup: last !== null,
    text: last ? `Último respaldo: ${formatAge(dayOf(toLocalIso(new Date(last))), today)}` : 'Aún no has hecho un respaldo',
  };
}

export function useBackupScreen() {
  const router = useRouter();
  const counts = useDataCounts();
  const status = useBackupStatus();
  const setLastBackupAt = usePreferences((s) => s.setLastBackupAt);
  const clearLastAccount = usePreferences((s) => s.clearLastAccount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (e: unknown, fallback: string) => {
    setError(e instanceof Error ? e.message : fallback);
    setBusy(false);
  };

  const doExport = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const now = new Date();
      const file = await exportBackup(now);
      await shareBackupFile(backupFileName(dayOf(toLocalIso(now))), JSON.stringify(file));
      setLastBackupAt(now.toISOString());
      setBusy(false);
    } catch (e) {
      fail(e, 'No se pudo exportar el respaldo');
    }
  };

  const doRestore = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const text = await pickBackupText();
      if (text === null) return setBusy(false);
      const parsed = backupFileSchema.safeParse(parseBackupText(text));
      if (!parsed.success) throw new Error('El archivo no es un respaldo de Finly válido');
      const s = summarizeBackup(parsed.data);
      setBusy(false);
      Alert.alert(
        'Restaurar respaldo',
        `Se reemplazarán TODOS los datos actuales por los del archivo (${s.accounts} cuentas, ${s.movements} movimientos, ${s.categories} categorías, ${s.tags} etiquetas).`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: () => {
              setBusy(true);
              restoreBackup(parsed.data).then(
                () => {
                  clearLastAccount();
                  setBusy(false);
                  Alert.alert('Respaldo restaurado', 'Tus datos fueron reemplazados.');
                },
                (e: unknown) => fail(e, 'No se pudo restaurar el respaldo'),
              );
            },
          },
        ],
      );
    } catch (e) {
      fail(e, 'No se pudo leer el archivo');
    }
  };

  return {
    status,
    rows: [
      { label: 'Cuentas', value: counts.accounts },
      { label: 'Movimientos', value: counts.movements },
      { label: 'Categorías', value: counts.categories },
    ],
    busy,
    error,
    doExport,
    doRestore,
    back: () => router.back(),
  };
}
