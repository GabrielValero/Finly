import { View } from 'react-native';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import type { BarTone } from '../../utils/budgetDisplay';
import { AppText } from './AppText';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';
import { ProgressBar } from './ProgressBar';

interface Props {
  title: string;
  /** "Mercado · Comida". */
  kindLabel: string;
  subtitle: string;
  amount: string;
  progress: number;
  state: 'none' | 'ok' | 'near' | 'over';
  showBar: boolean;
  /** Color de la categoría de la lista (dato): tiñe el ícono. */
  color?: string | null;
  icon?: 'cart' | 'star';
  /** "Te quedan $X de $Y". */
  limitText?: string | null;
  /** Fila del historial: atenuada. */
  dim?: boolean;
  onPress: () => void;
}

const BAR: Record<'none' | 'ok' | 'near' | 'over', BarTone> = { none: 'accent', ok: 'accent', near: 'warning', over: 'expense' };

/** Tarjeta de una lista de compras: ícono teñido, nombre, tipo · categoría, total y, con límite, barra y lo que queda. */
export function RowLista({ title, kindLabel, subtitle, amount, progress, state, showBar, color = null, icon = 'cart', limitText = null, dim = false, onPress }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    wrap: { gap: t.space[12], padding: t.space[16], backgroundColor: t.colors.surface, borderRadius: t.radius[24], borderWidth: 1, borderColor: t.colors.border },
    dim: { opacity: 0.55 },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[12] },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { maxWidth: '40%' },
    limit: { gap: t.space[8] },
  }));
  return (
    <PressableScale onPress={onPress} style={[styles.wrap, dim ? styles.dim : null]} accessibilityLabel={`${title}. ${kindLabel}. ${subtitle}`}>
      <View style={styles.row}>
        <IconBadge icon={icon} size={44} tint={color ?? theme.colors.accent} color={color ? 'text' : 'accent'} />
        <View style={styles.texts}>
          <AppText variant="heading" numberOfLines={1}>{title}</AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>{kindLabel}</AppText>
        </View>
        {amount ? <View style={styles.right}><AppText variant="amount" fit>{amount}</AppText></View> : null}
      </View>
      <AppText variant="small" color="textMuted" numberOfLines={1}>{subtitle}</AppText>
      {showBar ? (
        <View style={styles.limit}>
          <ProgressBar value={progress} color={BAR[state]} height={6} />
          {limitText ? <AppText variant="caption" color={state === 'over' ? 'expense' : 'textMuted'}>{limitText}</AppText> : null}
        </View>
      ) : null}
    </PressableScale>
  );
}
