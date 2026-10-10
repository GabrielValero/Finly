import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColorKey } from '../../utils/theme';

type Glyph = { lib: 'feather'; name: keyof typeof Feather.glyphMap } | { lib: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };

/** Claves de ícono guardadas en la BD (cuentas, categorías) y usadas por la UI. */
const REGISTRY: Record<string, Glyph> = {
  cart: { lib: 'feather', name: 'shopping-cart' },
  food: { lib: 'mci', name: 'silverware-fork-knife' },
  bus: { lib: 'mci', name: 'bus' },
  heart: { lib: 'feather', name: 'heart' },
  home: { lib: 'feather', name: 'home' },
  phone: { lib: 'feather', name: 'smartphone' },
  wallet: { lib: 'mci', name: 'wallet-outline' },
  cash: { lib: 'mci', name: 'cash' },
  bank: { lib: 'mci', name: 'bank-outline' },
  dollar: { lib: 'mci', name: 'currency-usd' },
  coffee: { lib: 'feather', name: 'coffee' },
  briefcase: { lib: 'feather', name: 'briefcase' },
  transfer: { lib: 'feather', name: 'repeat' },
  plus: { lib: 'feather', name: 'plus' },
  close: { lib: 'feather', name: 'x' },
  back: { lib: 'feather', name: 'chevron-left' },
  chevronDown: { lib: 'feather', name: 'chevron-down' },
  chevronRight: { lib: 'feather', name: 'chevron-right' },
  chevronLeft: { lib: 'feather', name: 'chevron-left' },
  calendar: { lib: 'feather', name: 'calendar' },
  swap: { lib: 'feather', name: 'arrow-down' },
  check: { lib: 'feather', name: 'check' },
  backspace: { lib: 'feather', name: 'delete' },
  list: { lib: 'feather', name: 'list' },
  pie: { lib: 'feather', name: 'pie-chart' },
  sliders: { lib: 'feather', name: 'sliders' },
};

export const CATEGORY_ICON_KEYS = ['cart', 'food', 'bus', 'heart', 'home', 'phone', 'coffee', 'briefcase', 'wallet', 'cash'] as const;
export const ACCOUNT_ICON_KEYS = ['cash', 'bank', 'wallet', 'dollar', 'phone', 'briefcase'] as const;

interface Props {
  name: string;
  size?: number;
  color?: ThemeColorKey;
}

export function Icon({ name, size = 22, color = 'text' }: Props) {
  const t = useTheme();
  const glyph = REGISTRY[name] ?? REGISTRY.wallet!;
  const tint = t.colors[color];
  return glyph.lib === 'feather' ? (
    <Feather name={glyph.name} size={size} color={tint} />
  ) : (
    <MaterialCommunityIcons name={glyph.name} size={size} color={tint} />
  );
}
