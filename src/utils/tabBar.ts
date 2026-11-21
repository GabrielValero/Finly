/** Ruta que abre el botón central "+": sin cuentas no se puede registrar nada. */
export function centerActionRoute(hasAccounts: boolean): '/capture' | '/account/new' {
  return hasAccounts ? '/capture' : '/account/new';
}

/** Divide las pestañas en dos mitades para dejar el botón central en medio. */
export function splitTabRoutes<T>(routes: readonly T[]): { left: T[]; right: T[] } {
  const mid = Math.ceil(routes.length / 2);
  return { left: routes.slice(0, mid), right: routes.slice(mid) };
}
