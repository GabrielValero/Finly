import { parseAmount, parseRate } from './money';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'back';

const MAX_INTEGER_DIGITS = 12;

/** Aplica una tecla al buffer (texto crudo: dígitos y a lo sumo una coma, máx. `maxDecimals` decimales). */
export function pressKey(buffer: string, key: KeypadKey, maxDecimals = 2): string {
  if (key === 'back') return buffer.slice(0, -1);

  const commaAt = buffer.indexOf(',');
  if (key === ',') {
    if (commaAt !== -1) return buffer;
    return buffer === '' ? '0,' : `${buffer},`;
  }

  if (commaAt !== -1) {
    return buffer.length - commaAt - 1 >= maxDecimals ? buffer : buffer + key;
  }
  if (buffer === '0') return key === '0' ? buffer : key;
  return buffer.length >= MAX_INTEGER_DIGITS ? buffer : buffer + key;
}

/** Texto para mostrar: miles con punto, coma y decimales tal cual se han tecleado. */
export function bufferToDisplay(buffer: string): string {
  if (buffer === '') return '0';
  const [integer = '0', decimals] = buffer.split(',');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

/** Buffer -> unidades menores (0 si está vacío). */
export function bufferToMinor(buffer: string): number {
  const clean = buffer.endsWith(',') ? buffer.slice(0, -1) : buffer;
  return clean === '' ? 0 : parseAmount(clean);
}

/** Buffer -> tasa escalada (0 si está vacío o es cero). */
export function bufferToRate(buffer: string): number {
  const clean = buffer.endsWith(',') ? buffer.slice(0, -1) : buffer;
  if (clean === '' || /^0(,0*)?$/.test(clean)) return 0;
  return parseRate(clean);
}

/** Unidades menores -> buffer del teclado ("12,5", "7"). Inverso de bufferToMinor. */
export function minorToBuffer(minor: number): string {
  const whole = Math.floor(minor / 100);
  const cents = (minor % 100).toString().padStart(2, '0').replace(/0+$/, '');
  return cents === '' ? String(whole) : `${whole},${cents}`;
}

/** Tasa escalada -> buffer del teclado ("875,6505"). Inverso de bufferToRate. */
export function rateToBuffer(rateScaled: number): string {
  const whole = Math.floor(rateScaled / 1_000_000);
  const frac = (rateScaled % 1_000_000).toString().padStart(6, '0').slice(0, 4).replace(/0+$/, '');
  return frac === '' ? String(whole) : `${whole},${frac}`;
}
