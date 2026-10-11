import { useEffect } from 'react';
import { AppState } from 'react-native';
import { upsertRate } from '../data/repos/rates';
import { fetchBcvRate } from '../services/bcvRate';
import { usePreferences } from '../store/preferences';
import { shouldRefresh } from '../utils/bcvRate';
import { newId } from '../utils/ids';

/** Último intento de esta sesión de proceso (no persistente): evita martillar la API al alternar apps. */
let lastAttempt: number | null = null;

/**
 * Trae la tasa BCV al abrir la app y al volver a primer plano (máx. 1 vez por hora).
 * Offline-first: si falla no pasa nada, queda la última tasa guardada.
 */
export function useAutoRate(enabled: boolean): void {
  const autoRate = usePreferences((s) => s.autoRate);
  useEffect(() => {
    if (!enabled || !autoRate) return;
    const run = async () => {
      const now = Date.now();
      if (!shouldRefresh(lastAttempt, now)) return;
      lastAttempt = now;
      const rate = await fetchBcvRate();
      if (!rate) {
        lastAttempt = null; // permite reintentar pronto si fue un fallo de red
        return;
      }
      try {
        await upsertRate({ id: newId(), source: 'bcv', rateScaled: rate.rateScaled, validFrom: rate.validFrom, fetchedAt: new Date() });
      } catch {
        // La BD no debería fallar aquí; se reintenta en la próxima apertura.
      }
    };
    void run();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void run();
    });
    return () => sub.remove();
  }, [enabled, autoRate]);
}
