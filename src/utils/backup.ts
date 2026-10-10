import type { BackupFile } from '../schemas/backup';

/** "finly-respaldo-2026-10-10.json" */
export function backupFileName(day: string): string {
  return `finly-respaldo-${day}.json`;
}

export interface BackupSummary {
  accounts: number;
  movements: number;
  categories: number;
  tags: number;
}

/** Conteos para mostrar al usuario (movimientos vivos, sin borrados lógicos). */
export function summarizeBackup(file: BackupFile): BackupSummary {
  return {
    accounts: file.tables.accounts.length,
    movements: file.tables.transactions.filter((r) => r.deleted_at === null || r.deleted_at === undefined).length,
    categories: file.tables.categories.length,
    tags: file.tables.tags.length,
  };
}

/** Mensaje legible para el error de `JSON.parse` / validación al leer un archivo. */
export function parseBackupText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un respaldo de Finly válido');
  }
}
