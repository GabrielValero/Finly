import { isNull } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { db } from '../data/db';
import { accounts } from '../data/schema';
import { centerActionRoute } from '../utils/tabBar';

/** Acción del botón central "+": consulta puntual al pulsar para no decidir con datos aún sin cargar. */
export function useCenterAction() {
  const router = useRouter();
  return () => {
    void db
      .select({ id: accounts.id })
      .from(accounts)
      .where(isNull(accounts.archivedAt))
      .limit(1)
      .then((rows) => router.push(centerActionRoute(rows.length > 0)));
  };
}
