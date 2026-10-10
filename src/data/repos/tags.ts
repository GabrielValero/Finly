import { eq } from 'drizzle-orm';
import { db } from '../db';
import { tags } from '../schema';
import { newId } from '../../utils/ids';
import { normalizeTagName } from '../../utils/tags';

/** Devuelve el id de la etiqueta con ese nombre (normalizado), creándola si no existe. */
export async function findOrCreateTag(raw: string): Promise<string | null> {
  const name = normalizeTagName(raw);
  if (name === null) return null;
  const [existing] = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, name));
  if (existing) return existing.id;
  const id = newId();
  await db.insert(tags).values({ id, name, updatedAt: new Date() });
  return id;
}
