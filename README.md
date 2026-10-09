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

## Flujo de trabajo

```
feat/* ──PR──▶ develop ──(OTA automático al canal preview)──▶ tu teléfono
                  │
                  └──PR──▶ main  (versiones estables)
```

- Ramas de trabajo salen de `develop` (`feat/...`, `fix/...`) y vuelven por PR. El CI (typecheck, lint, tests) debe pasar.
- Merge a `develop` → GitHub Actions publica un **update OTA** al canal `preview`. Cierra y abre la app para recibirlo.
- **Build nuevo (APK)** solo si cambió algo nativo: dependencia con código nativo, plugins/permisos/ícono/splash en `app.json`, o upgrade de SDK.
  Se lanza desde GitHub → Actions → "EAS Build (Android APK)" → Run workflow, o en local:
  `npx eas-cli build --platform android --profile preview`
- Update manual (sin pasar por CI): `npx eas-cli update --channel preview --environment preview --message "texto"`
- `runtimeVersion` usa la política **fingerprint**: un update solo lo reciben los binarios con exactamente el mismo código nativo, así que una dependencia nativa nueva nunca rompe una app instalada.
