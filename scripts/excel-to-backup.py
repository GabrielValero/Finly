#!/usr/bin/env python3
"""Convierte el export Excel de la app anterior (hojas Gastos/Ingresos) en un respaldo de Finly.

Uso:  python3 -I scripts/excel-to-backup.py ENTRADA.xlsx SALIDA.json

El resultado se restaura desde Ajustes → Respaldo → Restaurar (reemplaza TODOS los datos).
Los ids son deterministas: correr el script dos veces con el mismo Excel da el mismo archivo.
No se versiona ningún dato personal: la entrada y la salida viven fuera del repo.
"""
import json
import re
import sys
import time
import uuid
from collections import Counter, defaultdict

import pandas as pd

NS = uuid.UUID('6f1e5c1e-0a53-4a43-9a8e-2f1d3c0b7a11')
NOW_MS = int(time.time() * 1000)

# --- Cuentas nuevas (todas USD, saldo inicial 0: se ajusta luego con "Saldo actual") ---
ACCOUNTS = [
    ('Binance principal', 'dollar'),
    ('Binance padres', 'dollar'),
    ('Ahorros', 'bank'),
    ('Para gastar', 'wallet'),
    ('Para regalos', 'cash'),
]

# --- Categorías (nombres del Excel; Regalo y Regalos se fusionan en "Regalos") ---
EXPENSE_CATS = {
    'Amigos': 'coffee', 'Casa': 'home', 'Comida': 'food', 'Cuidado': 'heart', 'Educación': 'briefcase',
    'Entretenimiento': 'coffee', 'Familia': 'heart', 'Otros': 'wallet', 'Regalos': 'cash', 'Ropa': 'cart',
    'Salud': 'heart', 'Servicios': 'phone', 'Tecnología': 'phone', 'Transporte': 'bus',
}
INCOME_CATS = {'Regalos recibidos': 'cash', 'Otros ingresos': 'cash'}
TAGS = ['Familia', 'Prestamo', 'Ahorros']


def sid(*parts) -> str:
    return str(uuid.uuid5(NS, '|'.join(str(p) for p in parts)))


def minor(usd) -> int:
    return int(round(float(usd) * 100))


def load(path: str, sheet: str) -> pd.DataFrame:
    d = pd.read_excel(path, sheet_name=sheet, header=1)
    want = ['Fecha y hora', 'Categoría', 'Cuenta', 'Cantidad en la divisa predeterminada', 'Divisa predeterminada',
            'Cantidad en la divisa de la cuenta', 'Divisa de la cuenta', 'Etiquetas', 'Comentario']
    missing = [c for c in want if c not in d.columns]
    if missing:
        sys.exit(f'Hoja {sheet}: faltan columnas {missing}. ¿Cambió el formato del export?')
    d = d.rename(columns={'Fecha y hora': 'f', 'Categoría': 'cat', 'Cuenta': 'cta', 'Cantidad en la divisa predeterminada': 'usd',
                          'Divisa predeterminada': 'cur', 'Divisa de la cuenta': 'acur', 'Etiquetas': 'tag', 'Comentario': 'com'})
    d = d.dropna(subset=['f', 'usd']).reset_index(drop=True)
    bad = d[(d.cur != 'USD') | (d.acur != 'USD')]
    if len(bad):
        sys.exit(f'Hoja {sheet}: {len(bad)} filas no están en USD; el script solo soporta USD.')
    if (d.usd <= 0).any():
        sys.exit(f'Hoja {sheet}: hay montos <= 0.')
    d['f'] = pd.to_datetime(d.f)
    d['com'] = d.com.where(d.com.notna(), '').astype(str).str.strip()
    d['tag'] = d.tag.where(d.tag.notna(), '').astype(str).str.strip()
    return d


def main(src: str, dst: str) -> None:
    gastos, ingresos = load(src, 'Gastos'), load(src, 'Ingresos')

    acc_id = {n: sid('account', n) for n, _ in ACCOUNTS}
    cat_id = {n: sid('category', 'expense', n) for n in EXPENSE_CATS} | {n: sid('category', 'income', n) for n in INCOME_CATS}
    tag_id = {n: sid('tag', n) for n in TAGS}

    accounts = [dict(id=acc_id[n], name=n, currency='USD', icon=i, color=None, opening_minor=0, include_in_total=1,
                     archived_at=None, sort_order=k, updated_at=NOW_MS) for k, (n, i) in enumerate(ACCOUNTS)]
    categories = [dict(id=cat_id[n], name=n, icon=i, color=None, kind='expense', parent_id=None, exclude_from_reports=0,
                       archived_at=None, updated_at=NOW_MS) for n, i in EXPENSE_CATS.items()]
    categories += [dict(id=cat_id[n], name=n, icon=i, color=None, kind='income', parent_id=None, exclude_from_reports=0,
                        archived_at=None, updated_at=NOW_MS) for n, i in INCOME_CATS.items()]
    tags = [dict(id=tag_id[n], name=n, updated_at=NOW_MS) for n in TAGS]

    txs: list[dict] = []
    tx_tags: list[dict] = []
    report: Counter = Counter()
    skipped: list[str] = []
    unclassified: list[str] = []

    # Hora determinista: mediodía de Caracas + un segundo por movimiento del mismo día, en orden cronológico
    # (el Excel viene del más nuevo al más viejo, así que se recorre al revés).
    per_day: dict[str, int] = defaultdict(int)
    seen: Counter = Counter()

    def stamp(ts: pd.Timestamp) -> str:
        day = ts.strftime('%Y-%m-%d')
        n = per_day[day]
        per_day[day] += 1
        return f'{day}T12:{n // 60:02d}:{n % 60:02d}'

    def occurrence(kind: str, r) -> int:
        key = (kind, r.f.date(), r.cat, r.cta, round(float(r.usd), 2), r.com)
        seen[key] += 1
        return seen[key]

    def base(**kw):
        row = dict(id=None, account_id=None, account_currency='USD', kind=None, amount_minor=0, occurred_at=None,
                   category_id=None, concept='', note=None, rate_scaled=None, rate_source=None, listed_amount_minor=None,
                   listed_currency=None, transfer_id=None, deleted_at=None, updated_at=NOW_MS)
        row.update(kw)
        return row

    def attach_tags(tx_id: str, r) -> None:
        names = [t for t in re.split(r'[,;]', r.tag) if t.strip()]
        for t in names:
            t = t.strip()
            if t not in tag_id:
                sys.exit(f'Etiqueta desconocida en el Excel: {t!r}')
            tx_tags.append(dict(transaction_id=tx_id, tag_id=tag_id[t]))

    rows = [('G', r) for r in gastos.iloc[::-1].itertuples()] + [('I', r) for r in ingresos.iloc[::-1].itertuples()]
    rows.sort(key=lambda kr: kr[1].f)  # estable: conserva el orden relativo dentro del día

    for kind, r in rows:
        n = occurrence(kind, r)
        when = stamp(r.f)
        tid = sid('tx', kind, r.f.date(), r.cat, r.cta, round(float(r.usd), 2), r.com, n)
        cents = minor(r.usd)

        if kind == 'G':
            cat = 'Regalos' if r.cat in ('Regalo', 'Regalos') else r.cat
            if cat not in EXPENSE_CATS:
                sys.exit(f'Categoría de gasto desconocida: {r.cat!r}')
            acct = 'Para regalos' if cat == 'Regalos' else 'Para gastar'
            tags_row = r
            if re.search(r'pr[eé]st', r.com, re.I) and 'Prestamo' not in r.tag:
                tags_row = r._replace(tag=(r.tag + ',Prestamo').strip(','))
                report['gastos con etiqueta Prestamo añadida'] += 1
            txs.append(base(id=tid, account_id=acc_id[acct], kind='expense', amount_minor=-cents, occurred_at=when,
                            category_id=cat_id[cat], concept=r.com))
            attach_tags(tid, tags_row)
            report['gastos'] += 1
            continue

        # --- Ingresos: casi todos son traspasos entre bolsillos propios ---
        if r.cat in ('Regalo', 'Otros'):
            cat = 'Regalos recibidos' if r.cat == 'Regalo' else 'Otros ingresos'
            txs.append(base(id=tid, account_id=acc_id['Para gastar'], kind='income', amount_minor=cents, occurred_at=when,
                            category_id=cat_id[cat], concept=r.com))
            attach_tags(tid, r)
            report['ingresos reales'] += 1
            continue

        if re.search(r'cuenta de compras', r.com, re.I):
            skipped.append(f'{r.f.date()} ${r.usd}: "{r.com}" (entre dos cuentas viejas que ahora son una)')
            continue

        if r.cat in ('Prestamo propio', 'Ahorros'):
            src_acc, dst_acc = 'Ahorros', 'Para gastar'
        elif r.cat == 'Salario' and r.tag == 'Ahorros':
            src_acc, dst_acc = 'Para gastar', 'Ahorros'  # devolviendo lo que se tomó de los ahorros
        elif r.cat == 'Salario':
            src_acc, dst_acc = 'Binance principal', 'Para gastar'
        else:
            unclassified.append(f'{r.f.date()} {r.cat} ${r.usd} {r.com}')
            continue

        xfer = sid('xfer', tid)
        out_id, in_id = sid('leg', tid, 'out'), sid('leg', tid, 'in')
        txs.append(base(id=out_id, account_id=acc_id[src_acc], kind='transfer', amount_minor=-cents, occurred_at=when,
                        transfer_id=xfer, concept=r.com))
        txs.append(base(id=in_id, account_id=acc_id[dst_acc], kind='transfer', amount_minor=cents, occurred_at=when,
                        transfer_id=xfer, concept=r.com))
        attach_tags(in_id, r)  # una sola pata, para que la etiqueta no cuente doble
        report[f'transferencias {src_acc} → {dst_acc}'] += 1

    if unclassified:
        sys.exit('Ingresos sin regla:\n  ' + '\n  '.join(unclassified))

    file = dict(app='finly', format=1, exportedAt=pd.Timestamp.now('UTC').strftime('%Y-%m-%dT%H:%M:%S.000Z'), tables=dict(
        categories=categories, accounts=accounts, tags=tags, exchange_rates=[], budgets=[], budget_items=[],
        transactions=txs, transaction_tags=tx_tags))
    with open(dst, 'w', encoding='utf-8') as fh:
        json.dump(file, fh, ensure_ascii=False)

    # --- Resumen ---
    bal: dict[str, int] = defaultdict(int)
    for t in txs:
        bal[t['account_id']] += t['amount_minor']
    print(f'Escrito {dst}: {len(txs)} movimientos, {len(tx_tags)} etiquetas aplicadas')
    for k, v in sorted(report.items()):
        print(f'  {k}: {v}')
    for s in skipped:
        print(f'  omitido: {s}')
    print('Saldos resultantes (apertura 0):')
    for n, _ in ACCOUNTS:
        print(f'  {n}: {bal[acc_id[n]] / 100:,.2f}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
