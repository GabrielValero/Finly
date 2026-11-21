import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { mix } from '../../utils/color';
import type { StatusTone } from '../../utils/budgetDisplay';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { StatusBadge } from './StatusBadge';

interface Props {
  name: string;
  detail: string;
  amount: string;
  checked: boolean;
  purchased: boolean;
  /** Prioridad de un deseo pendiente (Alta / Media / Baja). */
  badge: string | null;
  badgeTone?: StatusTone;
  /** Mercado pendiente sin precio: invita a añadirlo en vez de mostrar el detalle. */
  needsPrice?: boolean;
  /** market: casilla de carrito. wish: botón "Comprar". */
  mode: 'market' | 'wish';
  onPress: () => void;
  onToggle: () => void;
}

/** Fila de un producto: casilla (mercado) o botón "Comprar" (deseos), nombre, detalle y monto. */
export function RowProducto({ name, detail, amount, checked, purchased, badge, badgeTone = 'textMuted', needsPrice = false, mode, onPress, onToggle }: Props) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], minHeight: 64, paddingVertical: t.space[12] },
    main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.space[8], minWidth: 0 },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    box: { width: 26, height: 26, borderRadius: t.radius[8], borderWidth: 2, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' },
    boxOn: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    right: { maxWidth: '35%' },
    buy: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingHorizontal: t.space[12], height: 34, borderRadius: t.radius[12], backgroundColor: mix(t.colors.surface, t.colors.accent, 0.16) },
    dim: { opacity: 0.5 },
    nameWrap: { flexShrink: 1 },
  }));
  const done = purchased || (mode === 'market' && checked);
  return (
    <View style={[styles.row, purchased ? styles.dim : null]}>
      {mode === 'market' ? (
        <PressableScale onPress={onToggle} disabled={purchased} style={[styles.box, done ? styles.boxOn : null]} accessibilityRole="checkbox" accessibilityLabel={`En el carrito: ${name}`} accessibilityState={{ checked: done }}>
          {done ? <Icon name="check" size={16} color="onAccent" /> : null}
        </PressableScale>
      ) : null}
      <PressableScale onPress={onPress} style={styles.main}>
        <View style={styles.texts}>
          <View style={styles.nameRow}>
            <View style={styles.nameWrap}><AppText variant="body" numberOfLines={1}>{name}</AppText></View>
            {badge ? <StatusBadge label={badge} tone={badgeTone} /> : null}
          </View>
          {needsPrice ? (
            <AppText variant="caption" color="accent" numberOfLines={1}>Sin precio · toca para añadirlo</AppText>
          ) : (
            <AppText variant="caption" color="textMuted" numberOfLines={1}>{detail}</AppText>
          )}
        </View>
        {needsPrice ? null : <View style={styles.right}><AppText variant="amount" fit>{amount}</AppText></View>}
      </PressableScale>
      {mode === 'wish' && !purchased ? (
        <PressableScale onPress={onToggle} style={styles.buy} accessibilityLabel={`Comprar ${name}`}>
          <Icon name="cart" size={14} color="accent" />
          <AppText variant="small" color="accent">Comprar</AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}
