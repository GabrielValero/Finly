import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  name: string;
  detail: string;
  amount: string;
  checked: boolean;
  purchased: boolean;
  badge: string | null;
  /** market: casilla de carrito. wish: botón "Comprado". */
  mode: 'market' | 'wish';
  onPress: () => void;
  onToggle: () => void;
}

export function RowProducto({ name, detail, amount, checked, purchased, badge, mode, onPress, onToggle }: Props) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], minHeight: 56, paddingVertical: t.space[8] },
    main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.space[8], minWidth: 0 },
    texts: { flex: 1, gap: 2, minWidth: 0 },
    box: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' },
    boxOn: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    right: { maxWidth: '35%' },
    badge: { paddingHorizontal: t.space[8], height: 20, borderRadius: 10, backgroundColor: t.colors.surface2, justifyContent: 'center' },
    dim: { opacity: 0.5 },
  }));
  const done = purchased || (mode === 'market' && checked);
  return (
    <View style={[styles.row, purchased ? styles.dim : null]}>
      {mode === 'market' ? (
        <PressableScale onPress={onToggle} disabled={purchased} style={[styles.box, done ? styles.boxOn : null]} accessibilityLabel={checked ? 'Quitar del carrito' : 'Meter al carrito'}>
          {done ? <Icon name="check" size={16} color="onAccent" /> : null}
        </PressableScale>
      ) : null}
      <PressableScale onPress={onPress} style={styles.main}>
        <View style={styles.texts}>
          <AppText variant="body" numberOfLines={1}>{name}</AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>{purchased ? 'Comprado' : detail}</AppText>
        </View>
        {badge ? <View style={styles.badge}><AppText variant="caption" color="textMuted">{badge}</AppText></View> : null}
        <View style={styles.right}><AppText variant="amountMid" fit>{amount}</AppText></View>
      </PressableScale>
      {mode === 'wish' && !purchased ? (
        <PressableScale onPress={onToggle} style={[styles.box, styles.boxOn]} accessibilityLabel="Marcar como comprado">
          <Icon name="cart" size={14} color="onAccent" />
        </PressableScale>
      ) : null}
    </View>
  );
}
