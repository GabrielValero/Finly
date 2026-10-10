import { View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { ScreenTemplate } from '../../template/ScreenTemplate';

/** Pantalla pendiente de implementar: deja claro que viene, sin botones muertos. */
export function PlaceholderView({ title }: { title: string }) {
  const styles = useThemedStyles((t) => ({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[8] },
  }));
  return (
    <ScreenTemplate title={title} titleStyle="large">
      <View style={styles.center}>
        <AppText variant="heading">Próximamente</AppText>
        <AppText variant="small" color="textMuted">Esta sección llega en la siguiente entrega.</AppText>
      </View>
    </ScreenTemplate>
  );
}
