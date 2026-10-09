import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from '../shared/AppText';

export function FatalError({ message }: { message: string }) {
  const styles = useThemedStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center', padding: t.space[24], gap: t.space[12] },
  }));
  return (
    <View style={styles.root}>
      <AppText variant="heading">No se pudo iniciar Finly</AppText>
      <AppText variant="small" color="textMuted" align="center">{message}</AppText>
    </View>
  );
}
