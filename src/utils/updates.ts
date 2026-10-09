/**
 * Ventana (ms) tras abrir/volver a la app en la que es seguro reiniciar para aplicar un update.
 * Pasada la ventana el usuario podría estar capturando un movimiento: el update queda
 * descargado y se aplica en la próxima apertura.
 */
export const RELOAD_WINDOW_MS = 15_000;

export function canReloadNow(msSinceForeground: number, windowMs: number = RELOAD_WINDOW_MS): boolean {
  return msSinceForeground >= 0 && msSinceForeground <= windowMs;
}
