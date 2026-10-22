import { bufferToDisplay, bufferToMinor, minorToBuffer, pressKey, type KeypadKey } from './keypad';

export type OperatorKey = '+' | '-' | '×' | '÷';
export const OPERATORS: readonly OperatorKey[] = ['÷', '×', '-', '+'];

const OPERATOR_RE = /([+\-×÷])/;
/** Tope de seguridad del resultado (en unidades menores) para no salirse de los enteros exactos. */
const MAX_MINOR = 99_999_999_999_999n;

export function isOperator(key: string): key is OperatorKey {
  return key === '+' || key === '-' || key === '×' || key === '÷';
}

/** Un buffer de expresión es "12,5+3×2": operandos como en el teclado simple separados por operadores. */
export function hasOperation(buffer: string): boolean {
  return OPERATOR_RE.test(buffer);
}

/** División entera redondeando half-away-from-zero. */
function divRound(n: bigint, d: bigint): bigint {
  const negative = (n < 0n) !== (d < 0n);
  const abs = (x: bigint) => (x < 0n ? -x : x);
  const q = (abs(n) * 2n + abs(d)) / (abs(d) * 2n);
  return negative ? -q : q;
}

/**
 * Evalúa la expresión en unidades menores (centavos) con aritmética entera: × y ÷ antes que + y −,
 * de izquierda a derecha. Un operador final se ignora. null si divide entre cero o el resultado se desborda.
 */
export function evaluateExpression(buffer: string): number | null {
  const parts = buffer.split(OPERATOR_RE);
  if (parts.length > 1 && parts[parts.length - 1] === '') parts.splice(-2); // operador final sin operando
  const nums: bigint[] = [];
  const ops: OperatorKey[] = [];
  parts.forEach((p, i) => {
    if (i % 2 === 0) nums.push(BigInt(bufferToMinor(p)));
    else ops.push(p as OperatorKey);
  });

  // Primera pasada: × y ÷
  const values: bigint[] = [nums[0] ?? 0n];
  const addOps: OperatorKey[] = [];
  for (let i = 0; i < ops.length; i += 1) {
    const op = ops[i] as OperatorKey;
    const next = nums[i + 1] ?? 0n;
    if (op === '×' || op === '÷') {
      const last = values[values.length - 1] ?? 0n;
      if (op === '×') values[values.length - 1] = divRound(last * next, 100n);
      else {
        if (next === 0n) return null;
        values[values.length - 1] = divRound(last * 100n, next);
      }
    } else {
      addOps.push(op);
      values.push(next);
    }
  }
  // Segunda pasada: + y −
  let total = values[0] ?? 0n;
  addOps.forEach((op, i) => {
    const v = values[i + 1] ?? 0n;
    total = op === '+' ? total + v : total - v;
  });
  if (total > MAX_MINOR || total < -MAX_MINOR) return null;
  return Number(total);
}

/** Aplica una tecla al buffer de expresión. Los dígitos, la coma y borrar actúan sobre el último operando. */
export function pressExpressionKey(buffer: string, key: KeypadKey, maxDecimals = 2): string {
  if (key === 'neg') return buffer;
  if (key === '=') {
    if (!hasOperation(buffer)) return buffer;
    const result = evaluateExpression(buffer);
    return result !== null && result > 0 ? minorToBuffer(result) : buffer;
  }
  if (isOperator(key)) {
    if (buffer === '') return buffer;
    const last = buffer[buffer.length - 1] ?? '';
    if (isOperator(last)) return buffer.slice(0, -1) + key;
    const trimmed = last === ',' ? buffer.slice(0, -1) : buffer;
    return trimmed + key;
  }
  if (key === 'back') {
    return buffer.slice(0, -1);
  }
  const at = Math.max(...['+', '-', '×', '÷'].map((o) => buffer.lastIndexOf(o)));
  const head = buffer.slice(0, at + 1);
  const operand = buffer.slice(at + 1);
  return head + pressKey(operand, key, maxDecimals);
}

/** Texto para mostrar: operandos con miles y operadores con espacios ("1.200 + 3 × 2"). */
export function expressionDisplay(buffer: string): string {
  if (!hasOperation(buffer)) return bufferToDisplay(buffer);
  return buffer
    .split(OPERATOR_RE)
    .map((p, i) => {
      if (i % 2 === 1) return ` ${p === '-' ? '−' : p} `;
      return p === '' ? '' : bufferToDisplay(p);
    })
    .join('')
    .trimStart();
}
