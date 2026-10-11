import { z } from 'zod';
import { RATE_SCALE } from './money';

/** Respuesta de https://ve.dolarapi.com/v1/dolares/oficial (solo lo que usamos). */
export const dolarApiSchema = z.object({
  promedio: z.number().positive().finite(),
  fechaActualizacion: z.string(),
});

export interface ParsedBcvRate {
  rateScaled: number;
  /** YYYY-MM-DD en hora de Caracas (UTC-4, sin horario de verano). */
  validFrom: string;
}

const CARACAS_OFFSET_MS = -4 * 60 * 60 * 1000;

/** Fecha calendario (Caracas) de un instante ISO con o sin offset. */
export function caracasDay(iso: string): string | null {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return new Date(ms + CARACAS_OFFSET_MS).toISOString().slice(0, 10);
}

/** Valida el JSON de dolarapi y lo convierte a tasa escalada. `null` si no es usable. */
export function parseBcvResponse(json: unknown): ParsedBcvRate | null {
  const parsed = dolarApiSchema.safeParse(json);
  if (!parsed.success) return null;
  const validFrom = caracasDay(parsed.data.fechaActualizacion);
  const rateScaled = Math.round(parsed.data.promedio * RATE_SCALE);
  if (validFrom === null || rateScaled <= 0) return null;
  return { rateScaled, validFrom };
}

/** ¿Vale la pena consultar de nuevo? Máximo una vez cada `minMs` (por defecto 1 h). */
export function shouldRefresh(lastAttemptMs: number | null, nowMs: number, minMs = 60 * 60 * 1000): boolean {
  return lastAttemptMs === null || nowMs - lastAttemptMs >= minMs;
}
