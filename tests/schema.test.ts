import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';

const sqlText = readFileSync(new URL('../drizzle/0000_init.sql', import.meta.url), 'utf8');

let db: DatabaseSync;
beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const stmt of sqlText.split('--> statement-breakpoint')) db.exec(stmt);
  db.exec(`INSERT INTO accounts(id,name,currency,icon,opening_minor,sort_order,updated_at) VALUES
    ('usd','Binance','USD','dollar',0,0,0), ('ves','Banesco','VES','bank',0,1,0);
   INSERT INTO categories(id,name,icon,kind,exclude_from_reports,updated_at) VALUES ('c','Comida','food','expense',0,0);`);
});

type Row = Partial<{
  id: string; account_id: string; account_currency: string; kind: string; amount_minor: number;
  category_id: string | null; rate_scaled: number | null; rate_source: string | null;
  listed_amount_minor: number | null; listed_currency: string | null; transfer_id: string | null;
}>;

function insert(row: Row) {
  const r = {
    id: crypto.randomUUID(), account_id: 'usd', account_currency: 'USD', kind: 'expense', amount_minor: -100,
    category_id: 'c', rate_scaled: null, rate_source: null, listed_amount_minor: null, listed_currency: null,
    transfer_id: null, ...row,
  };
  db.prepare(`INSERT INTO transactions(id,account_id,account_currency,kind,amount_minor,occurred_at,category_id,concept,
      rate_scaled,rate_source,listed_amount_minor,listed_currency,transfer_id,updated_at)
    VALUES (?,?,?,?,?,'2026-10-09T12:00:00',?,'',?,?,?,?,?,0)`).run(
    r.id, r.account_id, r.account_currency, r.kind, r.amount_minor, r.category_id,
    r.rate_scaled, r.rate_source, r.listed_amount_minor, r.listed_currency, r.transfer_id);
}

describe('regla de tasa (CHECK tx_rate_rule)', () => {
  it('gasto USD puro sin tasa: OK', () => {
    expect(() => insert({})).not.toThrow();
  });
  it('gasto USD puro con tasa: rechazado', () => {
    expect(() => insert({ rate_scaled: 36_000_000, rate_source: 'bcv' })).toThrow();
  });
  it('gasto en cuenta VES sin tasa: rechazado', () => {
    expect(() => insert({ account_id: 'ves', account_currency: 'VES', amount_minor: -36500 })).toThrow();
  });
  it('gasto en cuenta VES con tasa: OK', () => {
    expect(() => insert({ account_id: 'ves', account_currency: 'VES', amount_minor: -36500, rate_scaled: 36_500_000, rate_source: 'bcv' })).not.toThrow();
  });
  it('USD pagado con precio listado en Bs requiere tasa', () => {
    const listed = { listed_amount_minor: 36500, listed_currency: 'VES' };
    expect(() => insert(listed)).toThrow();
    expect(() => insert({ ...listed, rate_scaled: 36_500_000, rate_source: 'manual' })).not.toThrow();
  });
});

describe('otras invariantes', () => {
  it('signo coherente con el tipo', () => {
    expect(() => insert({ kind: 'expense', amount_minor: 100 })).toThrow();
    expect(() => insert({ kind: 'income', amount_minor: -100 })).toThrow();
    expect(() => insert({ amount_minor: 0 })).toThrow();
  });
  it('categoría obligatoria salvo transferencias', () => {
    expect(() => insert({ category_id: null })).toThrow();
    expect(() => insert({ kind: 'transfer', category_id: null, transfer_id: 't1', amount_minor: -100 })).not.toThrow();
  });
  it('transfer_id solo en transferencias', () => {
    expect(() => insert({ transfer_id: 't1' })).toThrow();
    expect(() => insert({ kind: 'transfer', category_id: null, transfer_id: null })).toThrow();
  });
  it('FK: cuenta inexistente rechazada', () => {
    expect(() => insert({ account_id: 'nope' })).toThrow();
  });
});
