/** Sustituto mínimo de `expo-sqlite` sobre node:sqlite, para ejecutar el driver real de Drizzle en tests. */
import { DatabaseSync, type StatementSync } from 'node:sqlite';

type Param = string | number | null | Uint8Array | bigint;

class Result {
  constructor(
    private readonly rows: unknown[],
    readonly changes: number,
    readonly lastInsertRowId: number,
  ) {}
  getAllSync() { return this.rows; }
  getFirstSync() { return this.rows[0] ?? null; }
  resetSync() {}
}

class Statement {
  constructor(private readonly st: StatementSync) {}
  private isQuery() { return this.st.columns().length > 0; }
  executeSync(params: Param[] = []) {
    if (this.isQuery()) { this.st.setReturnArrays(false); return new Result(this.st.all(...params), 0, 0); }
    const r = this.st.run(...params);
    return new Result([], Number(r.changes), Number(r.lastInsertRowid));
  }
  executeForRawResultSync(params: Param[] = []) {
    this.st.setReturnArrays(true);
    return new Result(this.st.all(...params), 0, 0);
  }
  finalizeSync() {}
}

export class SQLiteDatabase {
  readonly raw = new DatabaseSync(':memory:');
  execSync(sql: string) { this.raw.exec(sql); }
  prepareSync(sql: string) { return new Statement(this.raw.prepare(sql)); }
}

export function openDatabaseSync() {
  return new SQLiteDatabase();
}
export function addDatabaseChangeListener() {
  return { remove() {} };
}
