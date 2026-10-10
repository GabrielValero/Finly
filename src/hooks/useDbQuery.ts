import { useFocusEffect } from 'expo-router';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lectura reactiva de SQLite.
 * - Se vuelve a consultar cuando cambia CUALQUIERA de las tablas indicadas (incluidas las de los joins).
 * - También al volver a enfocar la pantalla (red de seguridad si se perdiera un evento).
 * - Los errores se lanzan en el render: nunca quedan como una lista "vacía" silenciosa.
 * Los cambios en ráfaga (varias filas de una transacción) se agrupan en una sola relectura.
 */
export function useDbQuery<T>(build: () => PromiseLike<T[]>, tables: readonly string[], deps: readonly unknown[] = []): T[] {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const reload = useRef<() => void>(() => undefined);

  useEffect(() => {
    let cancelled = false;
    let scheduled = false;
    const load = () => {
      Promise.resolve(build()).then(
        (rows) => {
          if (!cancelled) setData(rows);
        },
        (e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
        },
      );
    };
    reload.current = load;
    load();
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (!tables.includes(tableName) || scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        if (!cancelled) load();
      }, 0);
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
    // `build` y `tables` cambian de identidad en cada render; solo `deps` decide cuándo reiniciar.
  }, deps);

  useFocusEffect(useCallback(() => reload.current(), []));

  if (error) throw error;
  return data;
}
