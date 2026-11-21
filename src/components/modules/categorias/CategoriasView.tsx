import { ScrollView, View } from 'react-native';
import { useCategoriesScreen } from '../../../hooks/useCategoriesScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { ScreenTemplate } from '../../template/ScreenTemplate';

/** Categorías (pantalla 25): lista en tarjeta con subcategorías desplegables. */
export function CategoriasView() {
  const vm = useCategoriesScreen();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    card: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    item: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
    itemLast: { borderBottomWidth: 0 },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], minHeight: 68 },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    subs: { paddingLeft: 56, paddingBottom: t.space[8] },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40 },
    link: { height: 36, justifyContent: 'center' },
    empty: { paddingVertical: t.space[32], alignItems: 'center' },
  }));
  return (
    <ScreenTemplate title="Categorías" titleBold left="back" onLeft={vm.back} right={{ icon: 'plus', onPress: vm.openNew, label: 'Nueva categoría' }} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Segmented options={[{ value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Ingresos' }]} value={vm.tab} onChange={vm.setTab} />
        {vm.items.length === 0 ? (
          <View style={styles.empty}><AppText variant="small" color="textMuted">Aún no hay categorías aquí. Crea una con +.</AppText></View>
        ) : (
          <Card style={styles.card}>
            {vm.items.map((c, i) => {
              const open = vm.expandedId === c.id;
              return (
                <View key={c.id} style={[styles.item, i === vm.items.length - 1 ? styles.itemLast : null]}>
                  <PressableScale onPress={() => vm.toggle(c.id)} style={styles.row}>
                    <IconBadge icon={c.icon} size={44} tint={c.color} />
                    <View style={styles.texts}>
                      <AppText variant="heading" numberOfLines={1}>{c.name}</AppText>
                      <AppText variant="caption" color={c.excluded ? 'accent' : 'textMuted'}>{c.subtitle}</AppText>
                    </View>
                    <Icon name={open ? 'chevronDown' : 'chevronRight'} size={20} color="textMuted" />
                  </PressableScale>
                  {open ? (
                    <View style={styles.subs}>
                      {c.children.map((s) => (
                        <PressableScale key={s.id} onPress={() => vm.openEdit(s.id)} style={styles.subRow}>
                          <AppText variant="bodyRegular" numberOfLines={1}>{s.name}</AppText>
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
          </Card>
        )}
      </ScrollView>
    </ScreenTemplate>
  );
}
