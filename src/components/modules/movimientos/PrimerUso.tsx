import { View } from 'react-native';
import { useCurrentIconTile } from '../../../hooks/useAppIconSettings';
import { useThemedStyles } from '../../../hooks/useTheme';
import { mix } from '../../../utils/color';
import { AppIconPreview } from '../../shared/AppIconPreview';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';

const STEPS = ['Crea tu primera cuenta', 'Registra la tasa del día', 'Anota tu primer movimiento'] as const;

interface Props {
  onCreateAccount: () => void;
}

/** Bienvenida del primer uso (pantalla 32): sin cuentas todavía, tres pasos y una sola acción. */
export function PrimerUso({ onCreateAccount }: Props) {
  const icon = useCurrentIconTile();
  const styles = useThemedStyles((t) => ({
    wrap: { gap: t.space[24], paddingTop: t.space[24] },
    hero: { alignItems: 'center', gap: t.space[8] },
    card: { gap: t.space[16] },
    step: { flexDirection: 'row', alignItems: 'center', gap: t.space[12] },
    badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: mix(t.colors.surface, t.colors.textMuted, 0.16) },
    badgeCurrent: { backgroundColor: t.colors.accent },
  }));
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <AppIconPreview shape={icon.shape} background={icon.background} size={88} />
        <AppText variant="title">Finly</AppText>
        <AppText variant="bodyRegular" color="textMuted">Tu plata, en Bs y en USD.</AppText>
      </View>
      <Card style={styles.card}>
        <AppText variant="subtitle">Hola. Dejemos todo listo en tres pasos.</AppText>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.step}>
            <View style={[styles.badge, i === 0 ? styles.badgeCurrent : null]}>
              <AppText variant="caption" color={i === 0 ? 'onAccent' : 'textMuted'}>{i + 1}</AppText>
            </View>
            <AppText variant="body" color={i === 0 ? 'text' : 'textMuted'}>{label}</AppText>
          </View>
        ))}
      </Card>
      <Button label="Crear mi primera cuenta" onPress={onCreateAccount} />
    </View>
  );
}
