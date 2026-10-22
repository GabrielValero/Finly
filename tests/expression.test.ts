import { describe, expect, it } from 'vitest';
import { evaluateExpression, expressionDisplay, hasOperation, pressExpressionKey } from '../src/utils/expression';
import type { KeypadKey } from '../src/utils/keypad';

const type = (keys: KeypadKey[]) => keys.reduce((b, k) => pressExpressionKey(b, k), '');

describe('evaluateExpression', () => {
  it('respeta la precedencia y no usa flotantes', () => {
    expect(evaluateExpression('12,5+3×2')).toBe(1850);
    expect(evaluateExpression('0,1+0,2')).toBe(30);
    expect(evaluateExpression('2,5×4')).toBe(1000);
    expect(evaluateExpression('100÷3')).toBe(3333);
    expect(evaluateExpression('10-4÷2')).toBe(800);
  });

  it('cantidad sin operadores y operador final', () => {
    expect(evaluateExpression('12,5')).toBe(1250);
    expect(evaluateExpression('')).toBe(0);
    expect(evaluateExpression('5+')).toBe(500);
    expect(evaluateExpression('5+3×')).toBe(800);
  });

  it('resultado negativo, división entre cero y desborde', () => {
    expect(evaluateExpression('5-8')).toBe(-300);
    expect(evaluateExpression('10÷0')).toBeNull();
    expect(evaluateExpression('999999999999×999999999999')).toBeNull();
  });

  it('redondea half-away-from-zero', () => {
    expect(evaluateExpression('0,01×0,5')).toBe(1);
    expect(evaluateExpression('1÷3')).toBe(33);
    expect(evaluateExpression('2÷3')).toBe(67);
  });
});

describe('pressExpressionKey', () => {
  it('teclea operandos y operadores', () => {
    expect(type(['1', '2', ',', '5', '+', '3', '×', '2'])).toBe('12,5+3×2');
    expect(type(['+'])).toBe('');
  });

  it('un operador seguido de otro lo reemplaza; la coma final se descarta', () => {
    expect(type(['5', '+', '×'])).toBe('5×');
    expect(type(['5', ',', '+'])).toBe('5+');
  });

  it('cada operando tiene sus propios decimales y ceros', () => {
    expect(type(['5', '+', ',', '5'])).toBe('5+0,5');
    expect(type(['5', '+', '0', '7'])).toBe('5+7');
    expect(type(['1', ',', '2', '3', '4', '+', '1', ',', '2', '3', '4'])).toBe('1,23+1,23');
  });

  it('borrar quita dígitos y luego el operador', () => {
    expect(type(['5', '+', '3', 'back'])).toBe('5+');
    expect(type(['5', '+', '3', 'back', 'back'])).toBe('5');
  });

  it('= colapsa a su resultado positivo y no toca lo inválido', () => {
    expect(type(['1', '2', ',', '5', '+', '3', '×', '2', '='])).toBe('18,5');
    expect(type(['5', '-', '8', '='])).toBe('5-8');
    expect(type(['1', '0', '÷', '0', '='])).toBe('10÷0');
    expect(type(['7', '='])).toBe('7');
  });
});

describe('expressionDisplay', () => {
  it('agrupa miles y espacia operadores', () => {
    expect(expressionDisplay('1200,5+3×2')).toBe('1.200,5 + 3 × 2');
    expect(expressionDisplay('5-')).toBe('5 − ');
    expect(expressionDisplay('')).toBe('0');
    expect(hasOperation('5+')).toBe(true);
    expect(hasOperation('5')).toBe(false);
  });
});
