import { useCallback, useState } from 'react';
import { bufferToDisplay, bufferToMinor, bufferToRate, pressKey, type KeypadKey } from '../utils/keypad';

/** Estado del teclado numérico propio (evita depender del separador decimal del teléfono). */
export function useAmountBuffer(maxDecimals = 2) {
  const [buffer, setBuffer] = useState('');
  const press = useCallback((key: KeypadKey) => setBuffer((b) => pressKey(b, key, maxDecimals)), [maxDecimals]);
  const reset = useCallback(() => setBuffer(''), []);
  return {
    buffer,
    display: bufferToDisplay(buffer),
    minor: bufferToMinor(buffer),
    rateScaled: maxDecimals > 2 ? bufferToRate(buffer) : 0,
    press,
    reset,
  };
}
