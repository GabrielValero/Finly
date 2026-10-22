import { useCallback, useState } from 'react';
import { evaluateExpression, expressionDisplay, hasOperation, pressExpressionKey } from '../utils/expression';
import { bufferToDisplay, bufferToMinor, bufferToRate, minorToBuffer, pressKey, rateToBuffer, type KeypadKey } from '../utils/keypad';

/**
 * Estado del teclado numérico propio (evita depender del separador decimal del teléfono).
 * `allowNegative` habilita la tecla ± (solo donde el signo lo decide el usuario, p. ej. el saldo de una cuenta);
 * en el resto de pantallas el signo lo da el tipo de movimiento y un monto negativo sería un dato inválido.
 * `allowOps` activa la calculadora (+ − × ÷): el buffer es una expresión y `minor` su resultado.
 */
export function useAmountBuffer(maxDecimals = 2, allowNegative = false, allowOps = false) {
  const [buffer, setBuffer] = useState('');
  const press = useCallback(
    (key: KeypadKey) => setBuffer((b) => (allowOps ? pressExpressionKey(b, key, maxDecimals) : key === 'neg' && !allowNegative ? b : pressKey(b, key, maxDecimals))),
    [maxDecimals, allowNegative, allowOps],
  );
  const reset = useCallback(() => setBuffer(''), []);
  const set = useCallback((minor: number) => setBuffer(minor > 0 || (allowNegative && minor < 0) ? minorToBuffer(minor) : ''), [allowNegative]);
  const setRate = useCallback((rateScaled: number) => setBuffer(rateScaled > 0 ? rateToBuffer(rateScaled) : ''), []);
  const isRate = maxDecimals > 2;
  const operation = allowOps && hasOperation(buffer);
  const evaluated = operation ? evaluateExpression(buffer) : null;
  return {
    buffer,
    display: allowOps ? expressionDisplay(buffer) : bufferToDisplay(buffer),
    /** Hay una operación en curso (muestra «= resultado»). */
    operation,
    /** Resultado de la operación en unidades menores; null si es inválida (÷ 0 o desborde). */
    result: evaluated,
    // Un buffer de tasa admite más de 2 decimales: no es un monto en centavos (parseAmount lanzaría).
    minor: isRate ? 0 : allowOps ? (evaluateExpression(buffer) ?? 0) : bufferToMinor(buffer),
    rateScaled: isRate ? bufferToRate(buffer) : 0,
    press,
    reset,
    set,
    setRate,
  };
}
