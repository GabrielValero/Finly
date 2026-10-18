import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import type { KeypadKey } from '../../utils/keypad';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

const ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

/** `allowNegative` añade la tecla ± junto a la coma (solo para montos con signo, como el saldo de una cuenta). */
export function Keypad({ onKey, allowNegative = false }: { onKey: (key: KeypadKey) => void; allowNegative?: boolean }) {
  const styles = useThemedStyles((t) => ({
    grid: { gap: t.space[8] },
    row: { flexDirection: 'row', gap: t.space[8] },
    key: { flex: 1, height: 48, borderRadius: t.radius[16], backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
  }));
  return (
    <View style={styles.grid}>
      {ROWS.map((base, i) => {
        const row = allowNegative && i === ROWS.length - 1 ? (['neg', ...base] as KeypadKey[]) : base;
        return (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => (
            <PressableScale key={key} onPress={() => onKey(key)} style={styles.key} accessibilityLabel={key === 'back' ? 'Borrar' : key === 'neg' ? 'Cambiar signo' : key}>
              {key === 'back' ? <Icon name="backspace" size={24} /> : <AppText variant="amountMid">{key === 'neg' ? '±' : key}</AppText>}
            </PressableScale>
          ))}
        </View>
        );
      })}
    </View>
  );
}
