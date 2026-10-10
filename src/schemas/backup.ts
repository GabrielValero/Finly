import { z } from 'zod';

/** Versión del formato del archivo de respaldo (no de la BD). Súbela si cambia la estructura. */
export const BACKUP_FORMAT = 1;

/** Orden seguro para insertar (padres antes que hijos); para borrar se recorre al revés. */
export const BACKUP_TABLES = ['categories', 'accounts', 'tags', 'exchange_rates', 'budgets', 'budget_items', 'transactions', 'transaction_tags'] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

const cell = z.union([z.string(), z.number(), z.null()]);
const row = z.record(z.string(), cell);

export const backupFileSchema = z.object({
  app: z.literal('finly'),
  format: z.literal(BACKUP_FORMAT),
  exportedAt: z.string(),
  tables: z.object(Object.fromEntries(BACKUP_TABLES.map((t) => [t, z.array(row)])) as Record<BackupTable, z.ZodArray<typeof row>>),
});

export type BackupFile = z.infer<typeof backupFileSchema>;
