import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import type { KeypadKey } from '../../utils/keypad';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

const ACCESSIBLE: Partial<Record<KeypadKey, string>> = { back: 'Borrar', neg: 'Cambiar signo', '+': 'Sumar', '-': 'Restar', '×': 'Multiplicar', '÷': 'Dividir' };

const ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

interface KeypadProps {
  onKey: (key: KeypadKey) => void;
  /** Añade la tecla ± junto a la coma (solo para montos con signo, como el saldo de una cuenta). */
  allowNegative?: boolean;
  /** Añade la columna de operaciones (÷ × − +). */
  operators?: boolean;
  /** Muestra la fila «= resultado» que cierra la operación en curso. */
  equals?: string | null;
}

const OP_COLUMN: KeypadKey[] = ['÷', '×', '-', '+'];

export function Keypad({ onKey, allowNegative = false, operators = false, equals = null }: KeypadProps) {
  const styles = useThemedStyles((t) => ({
    grid: { gap: t.space[8] },
    row: { flexDirection: 'row', gap: t.space[8] },
    key: { flex: 1, height: 48, borderRadius: t.radius[16], backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
  }));
  return (
    <View style={styles.grid}>
      {ROWS.map((base, i) => {
        const withNeg = allowNegative && i === ROWS.length - 1 ? (['neg', ...base] as KeypadKey[]) : base;
        const row = operators ? [...withNeg, OP_COLUMN[i] as KeypadKey] : withNeg;
        return (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => (
            <PressableScale key={key} onPress={() => onKey(key)} style={styles.key} accessibilityLabel={ACCESSIBLE[key] ?? key}>
              {key === 'back' ? <Icon name="backspace" size={24} /> : <AppText variant="amountMid" color={OP_COLUMN.includes(key) ? 'accent' : 'text'}>{key === 'neg' ? '±' : key === '-' ? '−' : key}</AppText>}
            </PressableScale>
          ))}
        </View>
        );
      })}
      {equals ? (
        <PressableScale onPress={() => onKey('=')} style={styles.key} accessibilityLabel="Calcular resultado">
          <AppText variant="amountMid" color="accent">= {equals}</AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}
