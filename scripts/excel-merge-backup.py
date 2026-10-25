#!/usr/bin/env python3
"""Fusiona el export Excel de la app anterior en un respaldo REAL de Finly (formato 3).

Uso:
  python3 -I scripts/excel-merge-backup.py EXCEL.xlsx RESPALDO.json SALIDA.json \
      --salario 700 --salario-desde 2026-02 --salario-dia 2 [--mesada 100 --mesada-hasta 2026-09] \
      [--saldo "Para gastar=123,45" ...] [--hasta 2026-10-10]

Qué hace:
  1. Quita del respaldo todo lo que importó un script anterior (ids uuid v5) y lo que escribiste a mano
     en Finly con fecha <= --hasta (el Excel manda hasta esa fecha; Finly desde el día siguiente).
  2. Vuelve a importar el Excel usando la columna «Cuenta» y las reglas de CUENTAS/REGLAS de abajo.
  3. Genera el salario y la mesada mensuales (no vienen en el Excel).
  4. Ajusta el saldo inicial de cada cuenta de --saldo para que el saldo de hoy coincida con tu dinero real.
  Se conserva todo lo demás: tasas, presupuestos, listas, deudas y los movimientos de Finly posteriores a --hasta.

Los ids son deterministas (uuid v5): correr el script de nuevo sobre su propia salida da el mismo resultado.
No se versiona ningún dato personal: las entradas y la salida viven fuera del repo.
"""
import argparse
import json
import re
import sys
import time
import uuid
from collections import Counter, defaultdict

import pandas as pd

NS = uuid.UUID('6f1e5c1e-0a53-4a43-9a8e-2f1d3c0b7a11')
NOW_MS = int(time.time() * 1000)

# --- Reglas de uso de las cuentas (acordadas con el usuario) ---
ACCOUNTS = ['Para gastar', 'Binance padres', 'Ahorros', 'Para compras', 'Para regalos', 'Binance Principal']
# Cuenta vieja del Excel -> cuenta de Finly donde "vive" ese flujo.
OLD_ACCOUNT = {'Principal': 'Para gastar', 'Para Compras': 'Para compras', 'Salidas 😎😈': 'Para gastar', 'Para familia': 'Para regalos'}
# Gastos de estas categorías son cosas físicas -> Para compras, vengan de la cuenta que vengan.
PURCHASE_CATS = {'Ropa', 'Tecnología'}
LOAN_RE = re.compile(r'pr[eé]st', re.I)
LOAN_CATEGORY = ('Préstamos', 'cash')

# Salario y mesada mensuales: se pasan por línea de comandos (--salario, --mesada...) para no dejar cifras personales en el repo.


def sid(*parts) -> str:
    return str(uuid.uuid5(NS, '|'.join(str(p) for p in parts)))


def is_imported(tx_id: str) -> bool:
    return tx_id[14] == '5'  # uuid v5: lo escribió un script; las filas de la app son v7


def minor(usd) -> int:
    return int(round(float(usd) * 100))


def load(path: str, sheet: str) -> pd.DataFrame:
    d = pd.read_excel(path, sheet_name=sheet, header=1)
    want = ['Fecha y hora', 'Categoría', 'Cuenta', 'Cantidad en la divisa predeterminada', 'Divisa predeterminada',
            'Divisa de la cuenta', 'Etiquetas', 'Comentario']
    missing = [c for c in want if c not in d.columns]
    if missing:
        sys.exit(f'Hoja {sheet}: faltan columnas {missing}. ¿Cambió el formato del export?')
    d = d.rename(columns={'Fecha y hora': 'f', 'Categoría': 'cat', 'Cuenta': 'cta', 'Cantidad en la divisa predeterminada': 'usd',
                          'Divisa predeterminada': 'cur', 'Divisa de la cuenta': 'acur', 'Etiquetas': 'tag', 'Comentario': 'com'})
    d = d.dropna(subset=['f', 'usd']).reset_index(drop=True)
    if len(d[(d.cur != 'USD') | (d.acur != 'USD')]):
        sys.exit(f'Hoja {sheet}: hay filas que no están en USD; el script solo soporta USD.')
    if (d.usd <= 0).any():
        sys.exit(f'Hoja {sheet}: hay montos <= 0.')
    unknown = set(d.cta) - set(OLD_ACCOUNT)
    if unknown:
        sys.exit(f'Hoja {sheet}: cuentas del Excel sin regla: {sorted(unknown)}')
    d['f'] = pd.to_datetime(d.f)
    d['com'] = d.com.where(d.com.notna(), '').astype(str).str.strip()
    d['tag'] = d.tag.where(d.tag.notna(), '').astype(str).str.strip()
    return d


def parse_saldo(items: list[str]) -> dict[str, int]:
    out = {}
    for it in items:
        name, _, value = it.rpartition('=')
        if name not in ACCOUNTS:
            sys.exit(f'--saldo: cuenta desconocida {name!r}. Opciones: {ACCOUNTS}')
        out[name] = minor(value.replace('.', '').replace(',', '.') if ',' in value else value)
    return out


def main(args: argparse.Namespace) -> None:
    backup = json.load(open(args.backup, encoding='utf-8'))
    if backup.get('app') != 'finly' or backup.get('format') not in (1, 2, 3):
        sys.exit('El respaldo no es de Finly o es de una versión desconocida.')
    T = backup['tables']
    gastos, ingresos = load(args.excel, 'Gastos'), load(args.excel, 'Ingresos')
    if gastos.f.max() > pd.Timestamp(args.hasta) or ingresos.f.max() > pd.Timestamp(args.hasta):
        sys.exit(f'El Excel tiene movimientos posteriores a --hasta {args.hasta}.')

    acc = {a['name']: a['id'] for a in T['accounts']}
    for n in ACCOUNTS:
        if n not in acc:
            sys.exit(f'Falta la cuenta {n!r} en el respaldo.')
    cats = {(c['kind'], c['name']): c['id'] for c in T['categories']}
    tags = {t['name']: t['id'] for t in T['tags']}
    for need in [('expense', n) for n in ('Amigos', 'Casa', 'Comida', 'Cuidado', 'Educación', 'Entretenimiento', 'Familia', 'Otros', 'Regalos',
                                          'Ropa', 'Salud', 'Servicios', 'Tecnología', 'Transporte', 'Mesada')] + \
            [('income', n) for n in ('Regalos recibidos', 'Otros ingresos', 'Salario')]:
        if need not in cats:
            sys.exit(f'Falta la categoría {need} en el respaldo.')
    for n in ('Familia', 'Prestamo', 'Ahorros'):
        if n not in tags:
            sys.exit(f'Falta la etiqueta {n!r} en el respaldo.')

    # --- 1. Limpieza del respaldo ---
    dropped_user = [t for t in T['transactions'] if not is_imported(t['id']) and t['occurred_at'][:10] <= args.hasta]
    drop_ids = {t['id'] for t in T['transactions'] if is_imported(t['id'])} | {t['id'] for t in dropped_user}
    kept_txs = [t for t in T['transactions'] if t['id'] not in drop_ids]
    kept_tx_tags = [x for x in T['transaction_tags'] if x['transaction_id'] not in drop_ids]

    categories = list(T['categories'])
    loan_key = ('expense', LOAN_CATEGORY[0])
    if loan_key not in cats:
        cid = sid('category', 'expense', LOAN_CATEGORY[0])
        categories.append(dict(id=cid, name=LOAN_CATEGORY[0], icon=LOAN_CATEGORY[1], color=None, kind='expense', parent_id=None,
                               exclude_from_reports=0, archived_at=None, updated_at=NOW_MS))
        cats[loan_key] = cid

    txs: list[dict] = []
    tx_tags: list[dict] = []
    report: Counter = Counter()
    flags: list[str] = []
    loans: list[str] = []

    def base(**kw):
        row = dict(id=None, account_id=None, account_currency='USD', kind=None, amount_minor=0, occurred_at=None, category_id=None,
                   concept='', note=None, rate_scaled=None, rate_source=None, listed_amount_minor=None, listed_currency=None,
                   transfer_id=None, deleted_at=None, updated_at=NOW_MS)
        row.update(kw)
        return row

    def attach_tags(tx_id: str, raw: str) -> None:
        for t in (x.strip() for x in re.split(r'[,;]', raw) if x.strip()):
            if t not in tags:
                sys.exit(f'Etiqueta desconocida en el Excel: {t!r}')
            tx_tags.append(dict(transaction_id=tx_id, tag_id=tags[t]))

    def transfer(tid: str, src: str, dst: str, cents: int, when: str, concept: str, tag_raw: str = '') -> None:
        xfer, out_id, in_id = sid('xfer', tid), sid('leg', tid, 'out'), sid('leg', tid, 'in')
        txs.append(base(id=out_id, account_id=acc[src], kind='transfer', amount_minor=-cents, occurred_at=when, transfer_id=xfer, concept=concept))
        txs.append(base(id=in_id, account_id=acc[dst], kind='transfer', amount_minor=cents, occurred_at=when, transfer_id=xfer, concept=concept))
        attach_tags(in_id, tag_raw)  # una sola pata: la etiqueta no cuenta doble
        report[f'transferencias {src} → {dst}'] += 1

    # Hora determinista: mediodía + un segundo por movimiento del mismo día, en orden cronológico
    # (el Excel viene del más nuevo al más viejo, así que se recorre al revés).
    per_day: dict[str, int] = defaultdict(int)
    seen: Counter = Counter()

    def stamp(ts: pd.Timestamp) -> str:
        day = ts.strftime('%Y-%m-%d')
        n = per_day[day]
        per_day[day] += 1
        return f'{day}T12:{n // 60:02d}:{n % 60:02d}'

    rows = [('G', r) for r in gastos.iloc[::-1].itertuples()] + [('I', r) for r in ingresos.iloc[::-1].itertuples()]
    rows.sort(key=lambda kr: kr[1].f)

    for kind, r in rows:
        key = (kind, r.f.date(), r.cat, r.cta, round(float(r.usd), 2), r.com)
        seen[key] += 1
        when = stamp(r.f)
        tid = sid('tx', *key, seen[key])
        cents = minor(r.usd)
        dest = OLD_ACCOUNT[r.cta]

        if kind == 'G':
            cat = 'Regalos' if r.cat in ('Regalo', 'Regalos') else r.cat
            if ('expense', cat) not in cats:
                sys.exit(f'Categoría de gasto desconocida: {r.cat!r}')
            tag_raw = r.tag
            if LOAN_RE.search(r.com):
                cat, account = LOAN_CATEGORY[0], 'Para gastar'
                if 'Prestamo' not in tag_raw:
                    tag_raw = f'{tag_raw},Prestamo'.strip(',')
                loans.append(f'{r.f.date()} ${r.usd:.2f} {r.com}')
            elif cat == 'Regalos' or r.cta == 'Para familia':
                account = 'Para regalos'
            elif r.cta == 'Para Compras' or cat in PURCHASE_CATS:
                account = 'Para compras'
            else:
                account = 'Para gastar'
            txs.append(base(id=tid, account_id=acc[account], kind='expense', amount_minor=-cents, occurred_at=when,
                            category_id=cats[('expense', cat)], concept=r.com))
            attach_tags(tid, tag_raw)
            report[f'gastos → {account}'] += 1
            continue

        # --- Ingresos: casi todos son traspasos entre bolsillos propios ---
        if r.cat in ('Regalo', 'Otros'):
            cat = 'Regalos recibidos' if r.cat == 'Regalo' else 'Otros ingresos'
            txs.append(base(id=tid, account_id=acc[dest], kind='income', amount_minor=cents, occurred_at=when,
                            category_id=cats[('income', cat)], concept=r.com))
            attach_tags(tid, r.tag)
            report[f'ingresos reales → {dest}'] += 1
        elif r.cat in ('Prestamo propio', 'Ahorros'):
            transfer(tid, 'Ahorros', dest, cents, when, r.com, r.tag)
        elif r.cat == 'Salario':
            if re.search(r'cuenta de compras', r.com, re.I):
                transfer(tid, 'Para compras', dest, cents, when, r.com, r.tag)
            elif r.cta == 'Para Compras' and 'Ahorros' in r.tag:
                transfer(tid, 'Para compras', 'Ahorros', cents, when, r.com, r.tag)  # devolución a los ahorros
            else:
                transfer(tid, 'Binance Principal', dest, cents, when, r.com, r.tag)
                if r.cta == 'Para familia':
                    flags.append(f'{r.f.date()} ${r.usd:.2f} «{r.com}» entró a Para regalos (cuenta vieja Para familia); si era la mensualidad de tus padres, va a Binance padres')
        else:
            sys.exit(f'Ingreso sin regla: {r.f.date()} {r.cat} ${r.usd} {r.com}')

    # --- 3. Salario y mesada mensuales (no vienen en el Excel) ---
    salary_minor, mesada_minor = minor(args.salario.replace(',', '.')), minor(args.mesada.replace(',', '.'))
    y, m = map(int, args.salario_desde.split('-'))
    last = args.hasta[:7]
    while f'{y:04d}-{m:02d}' <= last:
        month = f'{y:04d}-{m:02d}'
        day = f'{month}-{args.salario_dia:02d}'
        txs.append(base(id=sid('salary', month), account_id=acc['Binance Principal'], kind='income', amount_minor=salary_minor,
                        occurred_at=f'{day}T09:00:00', category_id=cats[('income', 'Salario')], concept='Salario'))
        report['salarios generados'] += 1
        if mesada_minor > 0 and month <= args.mesada_hasta:
            transfer(sid('mesada', month), 'Binance Principal', 'Binance padres', mesada_minor, f'{day}T09:00:01', 'Mesada padres')
            txs.append(base(id=sid('mesada-gasto', month), account_id=acc['Binance padres'], kind='expense', amount_minor=-mesada_minor,
                            occurred_at=f'{day}T09:00:02', category_id=cats[('expense', 'Mesada')], concept='Mesada padres'))
            report['mesadas generadas'] += 1
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)

    # --- 4. Ensamblar y cuadrar saldos ---
    all_txs = kept_txs + txs
    ids = [t['id'] for t in all_txs]
    assert len(ids) == len(set(ids)), 'ids de movimiento repetidos'
    cat_ids = {c['id'] for c in categories}
    acc_ids = set(acc.values())
    for t in all_txs:
        assert t['account_id'] in acc_ids and (t['category_id'] is None or t['category_id'] in cat_ids), t
        assert t['amount_minor'] != 0, t
    by_transfer: dict[str, int] = defaultdict(int)
    for t in all_txs:
        if t['transfer_id']:
            by_transfer[t['transfer_id']] += t['amount_minor']
    assert all(v == 0 for v in by_transfer.values()), 'transferencia descuadrada'

    moved: dict[str, int] = defaultdict(int)
    for t in all_txs:
        if t['deleted_at'] is None:
            moved[t['account_id']] += t['amount_minor']
    saldos = parse_saldo(args.saldo)
    accounts = []
    for a in T['accounts']:
        a = dict(a)
        if a['name'] in saldos:
            a['opening_minor'] = saldos[a['name']] - moved[a['id']]
            a['updated_at'] = NOW_MS
        accounts.append(a)

    out = dict(backup)
    out.update(format=3, exportedAt=pd.Timestamp.now('UTC').strftime('%Y-%m-%dT%H:%M:%S.000Z'))
    out['tables'] = dict(T, categories=categories, accounts=accounts, transactions=all_txs, transaction_tags=kept_tx_tags + tx_tags)
    with open(args.out, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False)

    # --- Resumen ---
    print(f'Escrito {args.out}: {len(all_txs)} movimientos ({len(kept_txs)} conservados de Finly, {len(txs)} nuevos), {len(out["tables"]["transaction_tags"])} etiquetas')
    print(f'Quitados: {len(drop_ids) - len(dropped_user)} importados antes + {len(dropped_user)} tuyos con fecha <= {args.hasta}:')
    for t in dropped_user:
        print(f'  - {t["occurred_at"][:16]} {t["kind"]} {t["amount_minor"] / 100:,.2f} {t["concept"]}')
    for k, v in sorted(report.items()):
        print(f'  {k}: {v}')
    print(f'Préstamos reclasificados: {len(loans)}')
    for f in flags:
        print(f'  ojo: {f}')
    print('Saldo = apertura + movimientos:')
    for n in ACCOUNTS:
        a = next(x for x in accounts if x['name'] == n)
        mark = '' if n in saldos else '   (sin --saldo: apertura sin tocar)'
        print(f'  {n}: movimientos {moved[a["id"]] / 100:>10,.2f} | apertura {a["opening_minor"] / 100:>10,.2f} | saldo {(a["opening_minor"] + moved[a["id"]]) / 100:>10,.2f}{mark}')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('excel')
    p.add_argument('backup')
    p.add_argument('out')
    p.add_argument('--saldo', action='append', default=[], metavar='"Cuenta=monto"')
    p.add_argument('--salario', required=True, help='salario mensual en USD que entra a Binance Principal')
    p.add_argument('--salario-desde', required=True, metavar='YYYY-MM', help='primer mes con salario')
    p.add_argument('--salario-dia', type=int, default=2)
    p.add_argument('--mesada', default='0', help='mesada mensual en USD de Binance Principal a Binance padres (0 = no generar)')
    p.add_argument('--mesada-hasta', default='0000-00', metavar='YYYY-MM', help='último mes con mesada generada')
    p.add_argument('--hasta', default='2026-10-10', help='último día cubierto por el Excel (YYYY-MM-DD)')
    main(p.parse_args())
