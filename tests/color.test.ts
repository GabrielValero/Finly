import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, mix, readableOn, rgbToHex } from '../src/utils/color';

describe('color', () => {
  it('hex <-> rgb', () => {
    expect(hexToRgb('#FF6B2C')).toEqual([255, 107, 44]);
    expect(rgbToHex([255, 107, 44])).toBe('#FF6B2C');
    expect(() => hexToRgb('#FFF')).toThrow();
  });
  it('mix', () => {
    expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mix('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
  it('contraste WCAG', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('readableOn elige el mejor', () => {
    expect(readableOn('#FF6B2C', '#FFFFFF', '#0A0A0B')).toBe('#0A0A0B');
    expect(readableOn('#101010', '#FFFFFF', '#0A0A0B')).toBe('#FFFFFF');
  });
});
