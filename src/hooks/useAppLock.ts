import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePreferences } from '../store/preferences';

/** Tras estos ms en segundo plano, la app vuelve a pedir desbloqueo. */
const RELOCK_AFTER_MS = 30_000;

async function authenticate(message: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: message, cancelLabel: 'Cancelar' });
  return result.success;
}

/** Bloqueo de la app: arranca bloqueada si está activado y se vuelve a bloquear tras un rato en segundo plano. */
export function useAppLock() {
  const enabled = usePreferences((s) => s.lockEnabled);
  const [locked, setLocked] = useState(enabled);
  const [checking, setChecking] = useState(false);
  const leftAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    setChecking(true);
    try {
      if (await authenticate('Desbloquear Finly')) setLocked(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) setLocked(false);
  }, [enabled]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') leftAt.current = Date.now();
      if (state === 'active' && enabled && leftAt.current !== null && Date.now() - leftAt.current > RELOCK_AFTER_MS) {
        leftAt.current = null;
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  useEffect(() => {
    if (locked && enabled) void unlock();
  }, [locked, enabled, unlock]);

  return { locked: locked && enabled, checking, unlock };
}

/** Ajuste "Bloqueo con huella": activar exige que el teléfono tenga biometría/PIN y una autenticación correcta. */
export function useLockSetting() {
  const enabled = usePreferences((s) => s.lockEnabled);
  const setEnabled = usePreferences((s) => s.setLockEnabled);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setError(null);
    if (enabled) {
      if (await authenticate('Confirma para desactivar el bloqueo')) setEnabled(false);
      return;
    }
    const security = await LocalAuthentication.getEnrolledLevelAsync();
    if (security === LocalAuthentication.SecurityLevel.NONE) {
      setError('Configura una huella, rostro o PIN en tu teléfono primero');
      return;
    }
    if (await authenticate('Confirma para activar el bloqueo')) setEnabled(true);
  };
  return { enabled, toggle, error };
}
