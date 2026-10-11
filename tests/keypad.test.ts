import { describe, expect, it } from 'vitest';
import { rateToBuffer, bufferToDisplay, bufferToMinor, bufferToRate, pressKey, type KeypadKey } from '../src/utils/keypad';

const type = (keys: KeypadKey[]) => keys.reduce((b, k) => pressKey(b, k), '');

describe('keypad', () => {
  it('construye números y los muestra con miles', () => {
    expect(bufferToDisplay(type(['4', '5', '0', '0']))).toBe('4.500');
    expect(bufferToDisplay(type(['4', '5', '0', '0', ',', '5']))).toBe('4.500,5');
    expect(bufferToDisplay('')).toBe('0');
  });
  it('limita a 2 decimales y una sola coma', () => {
    expect(type(['1', ',', '2', '3', '4'])).toBe('1,23');
    expect(type(['1', ',', ',', '5'])).toBe('1,5');
  });
  it('coma inicial -> 0, ; ceros a la izquierda se normalizan', () => {
    expect(type([','])).toBe('0,');
    expect(type(['0', '0', '5'])).toBe('5');
    expect(type(['0', '0'])).toBe('0');
  });
  it('borrar', () => {
    expect(type(['1', '2', 'back'])).toBe('1');
    expect(type(['back'])).toBe('');
  });
  it('limita la cantidad de dígitos enteros', () => {
    expect(type(Array(20).fill('9') as KeypadKey[])).toHaveLength(12);
  });
  it('buffer -> unidades menores', () => {
    expect(bufferToMinor('4500,5')).toBe(450050);
    expect(bufferToMinor('12,')).toBe(1200);
    expect(bufferToMinor('')).toBe(0);
  });
  it('tasas con 4 decimales', () => {
    const press4 = (keys: KeypadKey[]) => keys.reduce((b, k) => pressKey(b, k, 4), '');
    expect(press4(['8', '7', '1', ',', '3', '7', '1', '2', '9'])).toBe('871,3712');
    expect(bufferToRate('871,37')).toBe(871_370_000);
    expect(bufferToRate('')).toBe(0);
    expect(bufferToRate('0,')).toBe(0);
  });
});

describe('rateToBuffer', () => {
  it('es inverso de bufferToRate con 4 decimales', () => {
    expect(rateToBuffer(875_650_500)).toBe('875,6505');
    expect(rateToBuffer(36_000_000)).toBe('36');
    expect(bufferToRate(rateToBuffer(875_650_500))).toBe(875_650_500);
  });
});
