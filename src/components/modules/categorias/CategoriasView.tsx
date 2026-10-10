import { ScrollView, View } from 'react-native';
import { useCategoriesScreen } from '../../../hooks/useCategoriesScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function CategoriasView() {
  const vm = useCategoriesScreen();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[16], paddingVertical: t.space[4] },
    texts: { flex: 1, gap: t.space[4] },
    panel: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[8] },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 36 },
    link: { height: 32, justifyContent: 'center' },
    empty: { paddingVertical: t.space[32], alignItems: 'center' },
    item: { gap: t.space[8] },
  }));
  return (
    <ScreenTemplate title="CATEGORÍAS" left="back" onLeft={vm.back} right={{ icon: 'plus', onPress: vm.openNew }} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Segmented options={[{ value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Ingresos' }]} value={vm.tab} onChange={vm.setTab} />
        {vm.items.length === 0 ? (
          <View style={styles.empty}><AppText variant="small" color="textMuted">Aún no hay categorías aquí. Crea una con +.</AppText></View>
        ) : null}
        {vm.items.map((c) => {
          const open = vm.expandedId === c.id;
          return (
            <View key={c.id} style={styles.item}>
              <PressableScale onPress={() => vm.toggle(c.id)} style={styles.row}>
                <IconBadge icon={c.icon} />
                <View style={styles.texts}>
                  <AppText variant="heading" numberOfLines={1}>{c.name}</AppText>
                  <AppText variant="caption" color="textMuted">{c.subtitle}</AppText>
                </View>
                <Icon name={open ? 'chevronDown' : 'chevronRight'} size={20} color="textMuted" />
              </PressableScale>
              {open ? (
                <View style={styles.panel}>
                  {c.children.map((s) => (
                    <PressableScale key={s.id} onPress={() => vm.openEdit(s.id)} style={styles.subRow}>
                      <AppText variant="bodyRegular">{s.name}</AppText>
                      <AppText variant="caption" color="textMuted">{s.count}</AppText>
                    </PressableScale>
                  ))}
                  <PressableScale onPress={() => vm.openNewSub(c.id)} style={styles.link}>
                    <AppText variant="caption" color="accent">+ AÑADIR SUBCATEGORÍA</AppText>
                  </PressableScale>
                  <PressableScale onPress={() => vm.openEdit(c.id)} style={styles.link}>
                    <AppText variant="caption" color="accent">EDITAR CATEGORÍA</AppText>
                  </PressableScale>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </ScreenTemplate>
  );
}
