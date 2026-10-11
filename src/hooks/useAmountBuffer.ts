import { useCallback, useState } from 'react';
import { bufferToDisplay, bufferToMinor, bufferToRate, minorToBuffer, pressKey, rateToBuffer, type KeypadKey } from '../utils/keypad';

/** Estado del teclado numérico propio (evita depender del separador decimal del teléfono). */
export function useAmountBuffer(maxDecimals = 2) {
  const [buffer, setBuffer] = useState('');
  const press = useCallback((key: KeypadKey) => setBuffer((b) => pressKey(b, key, maxDecimals)), [maxDecimals]);
  const reset = useCallback(() => setBuffer(''), []);
  const set = useCallback((minor: number) => setBuffer(minor > 0 ? minorToBuffer(minor) : ''), []);
  const setRate = useCallback((rateScaled: number) => setBuffer(rateScaled > 0 ? rateToBuffer(rateScaled) : ''), []);
  const isRate = maxDecimals > 2;
  return {
    buffer,
    display: bufferToDisplay(buffer),
    // Un buffer de tasa admite más de 2 decimales: no es un monto en centavos (parseAmount lanzaría).
    minor: isRate ? 0 : bufferToMinor(buffer),
    rateScaled: isRate ? bufferToRate(buffer) : 0,
    press,
    reset,
    set,
    setRate,
  };
}
