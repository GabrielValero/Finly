import { describe, expect, it } from 'vitest';
import { caracasDay, parseBcvResponse, shouldRefresh } from '../src/utils/bcvRate';

describe('parseBcvResponse', () => {
  it('convierte promedio a tasa escalada y toma la fecha de Caracas', () => {
    expect(parseBcvResponse({ promedio: 875.6505, fechaActualizacion: '2026-10-09T00:00:00-04:00' })).toEqual({
      rateScaled: 875_650_500,
      validFrom: '2026-10-09',
    });
  });
  it('rechaza respuestas inválidas', () => {
    expect(parseBcvResponse(null)).toBeNull();
    expect(parseBcvResponse({ promedio: null, fechaActualizacion: '2026-10-09T00:00:00-04:00' })).toBeNull();
    expect(parseBcvResponse({ promedio: 0, fechaActualizacion: '2026-10-09T00:00:00-04:00' })).toBeNull();
    expect(parseBcvResponse({ promedio: 50, fechaActualizacion: 'ayer' })).toBeNull();
  });
});

describe('caracasDay', () => {
  it('convierte UTC a día de Caracas', () => {
    expect(caracasDay('2026-10-10T02:00:00Z')).toBe('2026-10-09');
    expect(caracasDay('2026-10-10T05:00:00Z')).toBe('2026-10-10');
  });
});

describe('shouldRefresh', () => {
  it('limita a una consulta por hora', () => {
    expect(shouldRefresh(null, 1000)).toBe(true);
    expect(shouldRefresh(0, 59 * 60 * 1000)).toBe(false);
    expect(shouldRefresh(0, 60 * 60 * 1000)).toBe(true);
  });
});
