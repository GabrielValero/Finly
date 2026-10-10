import { sql } from 'drizzle-orm';
import { db } from '../db';
import { BACKUP_FORMAT, BACKUP_TABLES, type BackupFile, type BackupTable } from '../../schemas/backup';

type Raw = Record<string, string | number | null>;

const columnsOf = (table: BackupTable): string[] =>
  db.all<{ name: string }>(sql`select name from pragma_table_info(${table})`).map((c) => c.name);

/** Vuelca todas las tablas tal cual están guardadas (incluye borrados lógicos y archivadas). */
export async function exportBackup(now: Date): Promise<BackupFile> {
  const tables = {} as Record<BackupTable, Raw[]>;
  db.transaction((tx) => {
    for (const t of BACKUP_TABLES) tables[t] = tx.all<Raw>(sql`select * from ${sql.identifier(t)}`);
  });
  return { app: 'finly', format: BACKUP_FORMAT, exportedAt: now.toISOString(), tables };
}

/**
 * Reemplaza TODOS los datos por los del respaldo, en una sola transacción:
 * si algo falla (columna desconocida, restricción CHECK, clave foránea) no se cambia nada.
 */
export async function restoreBackup(file: BackupFile): Promise<void> {
  const known = new Map(BACKUP_TABLES.map((t) => [t, new Set(columnsOf(t))]));
  for (const t of BACKUP_TABLES) {
    for (const r of file.tables[t]) {
      for (const c of Object.keys(r)) {
        if (!known.get(t)?.has(c)) throw new Error('El respaldo es de una versión de Finly incompatible');
      }
    }
  }
  db.transaction((tx) => {
    // Las claves foráneas se comprueban al confirmar, así el orden de las filas no importa.
    tx.run(sql`pragma defer_foreign_keys = on`);
    for (const t of [...BACKUP_TABLES].reverse()) tx.run(sql`delete from ${sql.identifier(t)}`);
    for (const t of BACKUP_TABLES) {
      for (const r of file.tables[t]) {
        const cols = Object.keys(r);
        if (cols.length === 0) continue;
        tx.run(sql`insert into ${sql.identifier(t)} (${sql.join(cols.map((c) => sql.identifier(c)), sql`, `)}) values (${sql.join(cols.map((c) => sql`${r[c]}`), sql`, `)})`);
      }
    }
  });
}
