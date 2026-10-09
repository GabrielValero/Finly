import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

const dir = new URL('../drizzle/', import.meta.url);
const sqlText = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n--> statement-breakpoint\n');

// Garantiza que los rechazos vienen del CHECK esperado y no de otra causa (p. ej. una FK).
it('tx_rate_rule rechaza por la regla de tasa', () => {
  const db = new DatabaseSync(':memory:');
  const sql = sqlText;
  for (const s of sql.split('--> statement-breakpoint')) db.exec(s);
  db.exec(`INSERT INTO accounts(id,name,currency,icon,opening_minor,sort_order,updated_at) VALUES ('ves','B','VES','b',0,0,0);
           INSERT INTO categories(id,name,icon,kind,exclude_from_reports,updated_at) VALUES ('c','C','i','expense',0,0);`);
  expect(() =>
    db.exec(`INSERT INTO transactions(id,account_id,account_currency,kind,amount_minor,occurred_at,category_id,concept,updated_at)
             VALUES ('t','ves','VES','expense',-100,'2026-10-09T12:00:00','c','',0)`),
  ).toThrow(/tx_rate_rule/);
});
