import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import migrations from '../../drizzle/migrations';
import { db } from '../data/db';
import { seedDefaultCategories } from '../data/repos/categories';

/** Migra la BD y siembra datos iniciales. `ready` cuando la app puede mostrar pantallas. */
export function useBootstrap(): { ready: boolean; error: Error | null } {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success) return;
    seedDefaultCategories().then(
      () => setSeeded(true),
      (e: unknown) => setSeedError(e instanceof Error ? e : new Error('Error al iniciar')),
    );
  }, [success]);

  return { ready: success && seeded, error: error ?? seedError };
}
