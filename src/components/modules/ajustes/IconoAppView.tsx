import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppIconSettings } from '../../../hooks/useAppIconSettings';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppIconPreview } from '../../shared/AppIconPreview';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { PressableScale } from '../../shared/PressableScale';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function IconoAppView() {
  const vm = useAppIconSettings();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    hero: { alignItems: 'center', gap: t.space[8], paddingVertical: t.space[16] },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[12] },
    cell: { width: '22%', aspectRatio: 1, borderRadius: t.radius[16], borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    cellSelected: { borderColor: t.colors.accent },
    colors: { flexDirection: 'row', gap: t.space[12] },
    color: { flex: 1, backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingVertical: t.space[12], alignItems: 'center', gap: t.space[8] },
    colorSelected: { borderColor: t.colors.accent, borderWidth: 2 },
    dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: t.colors.border },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom, gap: t.space[8] },
  }));
  return (
    <ScreenTemplate title="ÍCONO DE LA APP" left="back" onLeft={vm.back}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <AppIconPreview shape={vm.draft.shape} background={vm.background} size={112} />
          <AppText variant="body">{vm.label}</AppText>
        </View>
        <AppText variant="label" color="textMuted">Forma</AppText>
        <View style={styles.grid}>
          {vm.shapes.map((s) => (
            <PressableScale key={s.id} onPress={() => vm.selectShape(s.id)} style={[styles.cell, s.selected ? styles.cellSelected : null]} accessibilityLabel={s.name}>
              <AppIconPreview shape={s.id} background={vm.background} size={64} />
            </PressableScale>
          ))}
        </View>
        <AppText variant="label" color="textMuted">Color</AppText>
        <View style={styles.colors}>
          {vm.colors.map((c) => (
            <PressableScale key={c.id} onPress={() => vm.selectColor(c.id)} style={[styles.color, c.selected ? styles.colorSelected : null]} accessibilityLabel={c.name}>
              <View style={[styles.dot, { backgroundColor: c.background }]} />
              <AppText variant="caption" color={c.selected ? 'accent' : 'text'}>{c.name}</AppText>
            </PressableScale>
          ))}
        </View>
        <AppText variant="small" color="textMuted">
          {vm.supported ? 'Android puede tardar unos segundos en actualizar el ícono en tu pantalla de inicio.' : 'Este dispositivo no permite cambiar el ícono.'}
        </AppText>
        {vm.applied ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={16} color="income" />
            <AppText variant="small" color="income">Ícono aplicado</AppText>
          </View>
        ) : null}
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Aplicar ícono" onPress={() => void vm.apply()} disabled={!vm.canApply || !vm.supported} />
      </View>
    </ScreenTemplate>
  );
}
