# Finly

App de finanzas personales (uso propio): multicuenta, multimoneda VES/USD, transferencias, presupuestos mensuales, offline-first.

## Arquitectura

```
components → hooks → utils / data
```

- `src/utils/` TypeScript puro (sin React, sin BD). Dinero, tasas, saldos, transferencias. Lint lo impide.
- `src/schemas/` zod para validar en los bordes (formularios, backup, APIs).
- `src/data/` Drizzle + expo-sqlite. Esquema en `src/data/schema`, migraciones generadas en `drizzle/`.
- `src/hooks/` casos de uso. Los componentes solo acceden a lógica y datos vía hooks.
- `src/store/` zustand, solo estado de UI (mes seleccionado, preferencias). Nunca datos de BD.
- `src/components/{template,shared,modules}`.

## Reglas de dinero

- Montos enteros en unidades menores (centavos). Tasas = Bs por USD × 1.000.000.
- Multiplicación monto×tasa con BigInt. Parser es-VE propio (`4.500,00`), nunca `parseFloat`.
- Saldo = apertura + suma de movimientos (derivado, nunca fuente de verdad almacenada).
- Tasa en el movimiento: obligatoria si la cuenta es VES o el precio se listó en otra moneda; prohibida si no. Se aplica también como `CHECK` en SQLite.

## Comandos

```
npm test          # vitest (utils, schemas, invariantes del esquema contra SQLite real)
npm run typecheck
npm run lint
npm run db:generate   # tras cambiar el esquema
```

No subir datos personales (Excel, backups): están en `.gitignore`.
