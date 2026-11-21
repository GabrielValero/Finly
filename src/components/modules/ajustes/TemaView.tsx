import { ScrollView, View } from 'react-native';
import { useThemeSettings } from '../../../hooks/useThemeSettings';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { PressableScale } from '../../shared/PressableScale';
import { SettingsRow } from '../../shared/SettingsRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function TemaView() {
  const vm = useThemeSettings();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, borderRadius: t.radius[20], borderWidth: 1, borderColor: t.colors.border, padding: t.space[16] },
    selected: { borderColor: t.colors.accent, borderWidth: 2 },
    left: { gap: t.space[8], flex: 1, minWidth: 0 },
    swatches: { flexDirection: 'row', gap: t.space[4] },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: t.colors.border },
  }));
  return (
    <ScreenTemplate title="Tema" titleBold left="back" onLeft={vm.back}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {vm.items.map((item) => (
          <PressableScale key={item.id} onPress={() => vm.select(item.id)} style={[styles.card, item.selected ? styles.selected : null]}>
            <View style={styles.left}>
              <AppText variant="body" color={item.selected ? 'accent' : 'text'} numberOfLines={1}>{item.name}</AppText>
              <View style={styles.swatches}>
                {item.swatches.map((c) => (
                  <View key={c} style={[styles.dot, { backgroundColor: c }]} />
                ))}
              </View>
            </View>
            {item.selected ? <Icon name="check" size={20} color="accent" /> : null}
          </PressableScale>
        ))}
        <Card style={styles.list}>
          <SettingsRow label="Ícono de la app" value={vm.iconValue} onPress={vm.openAppIcon} last />
        </Card>
        <AppText variant="small" color="textMuted">Más adelante podrás crear tus propios temas: color principal, fondos e ingresos/gastos.</AppText>
      </ScrollView>
    </ScreenTemplate>
  );
}
