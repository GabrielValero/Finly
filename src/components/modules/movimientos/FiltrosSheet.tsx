import { ScrollView, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useTheme';
import type { useMovementsScreen } from '../../../hooks/useMovementsScreen';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Chip } from '../../shared/Chip';
import { PressableScale } from '../../shared/PressableScale';
import { SheetModal } from '../../shared/SheetModal';

type Vm = ReturnType<typeof useMovementsScreen>;

interface Props {
  vm: Vm;
  visible: boolean;
  onClose: () => void;
  /** Abre el calendario para elegir el rango de fechas. */
  onPickRange: () => void;
}

const TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Egresos' },
  { value: 'transfer', label: 'Transferencias' },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles((t) => ({
    section: { gap: t.space[8] },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
  }));
  return (
    <View style={styles.section}>
      <AppText variant="label" color="textMuted">{title}</AppText>
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

/** Hoja de filtros avanzados: los cambios se aplican al instante y el botón muestra cuántos movimientos quedan. */
export function FiltrosSheet({ vm, visible, onClose, onPickRange }: Props) {
  const { filters } = vm;
  const styles = useThemedStyles((t) => ({
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scroll: { flexGrow: 0, flexShrink: 1 },
    content: { gap: t.space[20], paddingVertical: t.space[8] },
  }));
  const count = vm.resultCount;
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <View style={styles.head}>
        <AppText variant="title">Filtros</AppText>
        <PressableScale onPress={vm.clearFilters} accessibilityLabel="Limpiar filtros">
          <AppText variant="label" color="accent">LIMPIAR</AppText>
        </PressableScale>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="TIPO">
          {TYPES.map((o) => (
            <Chip key={o.value} shape="tile" label={o.label} selected={filters.type === o.value} onPress={() => vm.setType(o.value)} />
          ))}
        </Section>

        <Section title="FECHA">
          <Chip shape="tile" label="Este mes" selected={filters.date.preset === 'month'} onPress={() => vm.setDatePreset('month')} />
          <Chip shape="tile" label="Mes pasado" selected={filters.date.preset === 'prevMonth'} onPress={() => vm.setDatePreset('prevMonth')} />
          <Chip shape="tile" label={vm.rangeLabel} selected={filters.date.preset === 'range'} onPress={onPickRange} />
        </Section>

        {vm.accountOptions.length > 0 ? (
          <Section title="CUENTA">
            {vm.accountOptions.map((a) => (
              <Chip key={a.id} shape="tile" label={a.name} selected={filters.accountIds.includes(a.id)} onPress={() => vm.toggleAccount(a.id)} />
            ))}
          </Section>
        ) : null}

        {vm.categoryOptions.length > 0 ? (
          <Section title="CATEGORÍA">
            {vm.categoryOptions.map((c) => (
              <Chip key={c.id} shape="tile" label={c.name} selected={filters.categoryId === c.id} onPress={() => vm.toggleCategory(c.id)} />
            ))}
          </Section>
        ) : null}

        {vm.subcategoryOptions.length > 0 ? (
          <Section title={`SUBCATEGORÍA · ${vm.subcategoryTitle}`}>
            {vm.subcategoryOptions.map((c) => (
              <Chip key={c.id} shape="tile" label={c.name} selected={filters.subcategoryId === c.id} onPress={() => vm.toggleSubcategory(c.id)} />
            ))}
          </Section>
        ) : null}

        {vm.tagOptions.length > 0 ? (
          <Section title="ETIQUETAS">
            {vm.tagOptions.map((tg) => (
              <Chip key={tg.id} shape="tile" label={`#${tg.name}`} selected={filters.tagIds.includes(tg.id)} onPress={() => vm.toggleTag(tg.id)} />
            ))}
          </Section>
        ) : null}
      </ScrollView>

      <Button label={`Ver ${count} ${count === 1 ? 'movimiento' : 'movimientos'}`} onPress={onClose} />
    </SheetModal>
  );
}
