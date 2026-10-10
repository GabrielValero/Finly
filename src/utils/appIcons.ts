/** Catálogo de íconos de la app: forma × color. La fuente de verdad es src/config/app-icons.json. */
import catalog from '../config/app-icons.json';

export interface IconShape {
  id: string;
  name: string;
}
export interface IconColor {
  id: string;
  name: string;
  background: string;
}
export interface IconChoice {
  shape: string;
  color: string;
}

export const ICON_SHAPES: readonly IconShape[] = catalog.shapes;
export const ICON_COLORS: readonly IconColor[] = catalog.colors;
export const ICON_MARK_COLOR: string = catalog.markColor;
export const DEFAULT_ICON: IconChoice = { shape: catalog.defaultShape, color: catalog.defaultColor };

const pascal = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

export const isDefaultIcon = (c: IconChoice): boolean => c.shape === DEFAULT_ICON.shape && c.color === DEFAULT_ICON.color;

/** Nombre del alias de Android ("IconANaranja"); `null` es el ícono por defecto (la actividad principal). */
export function iconAliasName(c: IconChoice): string | null {
  return isDefaultIcon(c) ? null : `Icon${c.shape.toUpperCase()}${pascal(c.color)}`;
}

/** Inverso de `iconAliasName`. Un nombre desconocido cae al ícono por defecto. */
export function parseIconAlias(name: string | null): IconChoice {
  if (name === null) return DEFAULT_ICON;
  for (const shape of ICON_SHAPES) {
    for (const color of ICON_COLORS) {
      if (iconAliasName({ shape: shape.id, color: color.id }) === name) return { shape: shape.id, color: color.id };
    }
  }
  return DEFAULT_ICON;
}

/** Todos los alias a registrar en el manifiesto (todas las combinaciones salvo la de por defecto). */
export function allIconAliases(): { name: string; choice: IconChoice }[] {
  return ICON_SHAPES.flatMap((s) => ICON_COLORS.map((c) => ({ shape: s.id, color: c.id }))).flatMap((choice) => {
    const name = iconAliasName(choice);
    return name === null ? [] : [{ name, choice }];
  });
}

export function iconLabel(c: IconChoice): string {
  const shape = ICON_SHAPES.find((s) => s.id === c.shape)?.name ?? '';
  const color = ICON_COLORS.find((x) => x.id === c.color)?.name ?? '';
  return `${shape} · ${color}`;
}
