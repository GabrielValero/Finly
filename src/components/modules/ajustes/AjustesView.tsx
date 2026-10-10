import { ScrollView, View } from 'react-native';
import { useThemeSettings } from '../../../hooks/useThemeSettings';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { PressableScale } from '../../shared/PressableScale';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function AjustesView() {
  const vm = useThemeSettings();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: t.space[12] },
    left: { gap: t.space[8] },
    swatches: { flexDirection: 'row', gap: t.space[4] },
    dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: t.colors.border },
  }));
  return (
    <ScreenTemplate title="Ajustes" titleStyle="large">
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="label" color="textMuted">Datos</AppText>
        <Card>
          <PressableScale onPress={vm.openCategories} style={styles.row}>
            <AppText variant="body">Categorías</AppText>
            <Icon name="chevronRight" size={20} color="textMuted" />
          </PressableScale>
          <PressableScale onPress={vm.openDeleteData} style={styles.row}>
            <AppText variant="body" color="expense">Borrar todos los datos</AppText>
            <Icon name="chevronRight" size={20} color="textMuted" />
          </PressableScale>
        </Card>
        <AppText variant="label" color="textMuted">Tema</AppText>
        <Card>
          {vm.items.map((item) => (
            <PressableScale key={item.id} onPress={() => vm.select(item.id)} style={styles.row}>
              <View style={styles.left}>
                <AppText variant="body" color={item.selected ? 'accent' : 'text'}>{item.name}</AppText>
                <View style={styles.swatches}>
                  {item.swatches.map((c) => (
                    <View key={c} style={[styles.dot, { backgroundColor: c }]} />
                  ))}
                </View>
              </View>
              {item.selected ? <Icon name="check" size={20} color="accent" /> : null}
            </PressableScale>
          ))}
        </Card>
        <AppText variant="small" color="textMuted">Más ajustes (respaldo, importar datos) llegan pronto.</AppText>
      </ScrollView>
    </ScreenTemplate>
  );
}
