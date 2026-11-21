import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from '../shared/AppText';
import { Icon } from '../shared/Icon';
import { PressableScale } from '../shared/PressableScale';

interface Props {
  /** Título centrado (modales/detalle) o grande a la izquierda (pestañas). */
  title?: string;
  titleStyle?: 'center' | 'large';
  /** Título centrado en negrita 20 (pantallas empujadas del diseño G) en vez de la etiqueta en mayúsculas. */
  titleBold?: boolean;
  left?: 'back' | 'close' | null;
  onLeft?: () => void;
  right?: { label?: string; icon?: string; onPress: () => void } | null;
  /** Aplica padding inferior de la barra del sistema (para pantallas sin tab bar). */
  bottomInset?: boolean;
  children: ReactNode;
}

/** Plantilla base de pantalla: fondo del tema, safe area y cabecera estándar. */
export function ScreenTemplate({ title, titleStyle = 'center', titleBold = false, left = null, onLeft, right = null, bottomInset = false, children }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    header: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    round: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    side: { minWidth: 40, alignItems: 'flex-start' },
    sideRight: { minWidth: 40, alignItems: 'flex-end' },
    titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: t.space[8] },
    body: { flex: 1 },
  }));
  const hasHeader = title !== undefined || left !== null || right !== null;
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: bottomInset ? insets.bottom : 0 }]}>
      {hasHeader ? (
        <View style={styles.header}>
          {titleStyle === 'large' ? (
            <AppText variant="title">{title ?? ''}</AppText>
          ) : (
            <>
              <View style={styles.side}>
                {left ? (
                  <PressableScale onPress={onLeft} style={styles.round} accessibilityLabel={left === 'back' ? 'Atrás' : 'Cerrar'}>
                    <Icon name={left === 'back' ? 'back' : 'close'} size={20} />
                  </PressableScale>
                ) : null}
              </View>
              {title ? (
                <View style={styles.titleWrap}>
                  {titleBold ? <AppText variant="subtitle" numberOfLines={1}>{title}</AppText> : <AppText variant="label" color="textMuted">{title}</AppText>}
                </View>
              ) : null}
              <View style={styles.sideRight}>
                {right ? (
                  <PressableScale onPress={right.onPress} accessibilityLabel={right.label ?? 'Acción'}>
                    {right.icon ? <Icon name={right.icon} size={20} /> : <AppText variant="label" color="accent">{right.label ?? ''}</AppText>}
                  </PressableScale>
                ) : null}
              </View>
            </>
          )}
          {titleStyle === 'large' && right ? (
            <PressableScale onPress={right.onPress} style={styles.round}>
              {right.icon ? <Icon name={right.icon} size={20} /> : <AppText variant="label" color="accent">{right.label ?? ''}</AppText>}
            </PressableScale>
          ) : null}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}
