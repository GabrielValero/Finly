import { z } from 'zod';

/** Versión del formato del archivo de respaldo (no de la BD). Súbela si cambia la estructura. */
/** 2 añade las listas de compras; el 1 se sigue aceptando (sin listas). */
export const BACKUP_FORMAT = 2;

/** Orden seguro para insertar (padres antes que hijos); para borrar se recorre al revés. */
export const BACKUP_TABLES = ['categories', 'accounts', 'tags', 'exchange_rates', 'budgets', 'budget_items', 'transactions', 'transaction_tags', 'shopping_lists', 'shopping_items'] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

const OPTIONAL_TABLES: readonly BackupTable[] = ['shopping_lists', 'shopping_items'];

const cell = z.union([z.string(), z.number(), z.null()]);
const row = z.record(z.string(), cell);

export const backupFileSchema = z.object({
  app: z.literal('finly'),
  format: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string(),
  // Las tablas añadidas después del formato 1 son opcionales al leer (respaldos viejos).
  tables: z.object(
    Object.fromEntries(
      BACKUP_TABLES.map((t) => [t, OPTIONAL_TABLES.includes(t) ? z.array(row).default([]) : z.array(row)]),
    ) as Record<BackupTable, z.ZodArray<typeof row>>,
  ),
});

export type BackupFile = z.infer<typeof backupFileSchema>;
