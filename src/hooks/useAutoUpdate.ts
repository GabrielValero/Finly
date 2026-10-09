import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { canReloadNow } from '../utils/updates';

/**
 * Busca updates OTA al abrir la app y cada vez que vuelve a primer plano.
 * - No bloquea el arranque (offline-first): todo ocurre en segundo plano y los errores de red se ignoran.
 * - Si el update termina de bajar poco después de abrir, reinicia solo; si tarda, lo deja
 *   descargado para la próxima apertura, para no interrumpir una captura en curso.
 * - En desarrollo y Expo Go (`Updates.isEnabled === false`) no hace nada.
 */
export function useAutoUpdate(): void {
  useEffect(() => {
    if (!Updates.isEnabled) return;

    let foregroundAt = Date.now();
    let running = false;

    const run = async () => {
      if (running) return;
      running = true;
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        const fetched = await Updates.fetchUpdateAsync();
        if (fetched.isNew && canReloadNow(Date.now() - foregroundAt)) {
          await Updates.reloadAsync();
        }
      } catch {
        // Sin red o servidor no disponible: se reintenta en la próxima apertura.
      } finally {
        running = false;
      }
    };

    void run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      foregroundAt = Date.now();
      void run();
    });
    return () => sub.remove();
  }, []);
}
