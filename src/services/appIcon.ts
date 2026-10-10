import { getAppIconName, setAlternateAppIcon, supportsAlternateIcons, type AlternateAppIcons } from 'expo-alternate-app-icons';
import { iconAliasName, parseIconAlias, type IconChoice } from '../utils/appIcons';

export const canChangeAppIcon: boolean = supportsAlternateIcons;

/** Ícono que está activo ahora mismo en el lanzador. */
export function currentAppIcon(): IconChoice {
  try {
    return parseIconAlias(getAppIconName());
  } catch {
    return parseIconAlias(null);
  }
}

/** Cambia el ícono del lanzador (habilita el alias elegido y deshabilita el actual). */
export async function applyAppIcon(choice: IconChoice): Promise<void> {
  await setAlternateAppIcon(iconAliasName(choice) as AlternateAppIcons | null);
}
