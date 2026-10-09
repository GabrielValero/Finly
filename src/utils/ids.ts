import { uuidv7 } from 'uuidv7';

/** UUID v7 generado en el cliente: ordenable por tiempo y listo para sync futuro. */
export function newId(): string {
  return uuidv7();
}
