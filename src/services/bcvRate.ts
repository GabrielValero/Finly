import { parseBcvResponse, type ParsedBcvRate } from '../utils/bcvRate';

const URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const TIMEOUT_MS = 8000;

/** Consulta la tasa oficial (BCV). `null` ante cualquier fallo: sin red, timeout, HTTP o formato inesperado. */
export async function fetchBcvRate(): Promise<ParsedBcvRate | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return parseBcvResponse(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
