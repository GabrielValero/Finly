import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListForm } from '../../../hooks/useListForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CategoryPickerModal } from '../../shared/CategoryPickerModal';
import { Card } from '../../shared/Card';
import { Field } from '../../shared/Field';
import { Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { Keypad } from '../../shared/Keypad';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SettingsRow } from '../../shared/SettingsRow';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function ListaFormView({ id }: { id: string }) {
  const vm = useListForm(id);
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState(false);
  const [keypad, setKeypad] = useState<'limit' | 'rate' | null>(null);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    boxRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[12] },
    flex: { flex: 1, minWidth: 0 },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    footer: { paddingHorizontal: t.space[16], paddingTop: t.space[8], paddingBottom: t.space[16] + Math.max(insets.bottom, t.space[8]) },
  }));
  return (
    <ScreenTemplate title={vm.title} titleBold left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Nombre" value={vm.name} onChangeText={vm.setName} placeholder="Ej. Mercado de la semana" maxLength={60} autoFocus={vm.isNew} />

        <AppText variant="label" color="textMuted">Tipo</AppText>
        <Segmented options={[{ value: 'market', label: 'Mercado' }, { value: 'wish', label: 'Deseos' }]} value={vm.kind} onChange={vm.setKind} disabled={vm.kindLocked} />
        {vm.kindLocked ? <AppText variant="small" color="textMuted">El tipo no se puede cambiar en una lista que ya existe.</AppText> : null}
        <AppText variant="small" color="textMuted">
          {vm.kind === 'market' ? 'Para ir de compras: tiene límite, marcas lo que metes al carrito y al terminar se registra el gasto.' : 'Para lo que quieres comprar a futuro: precio objetivo y prioridad; cada deseo se marca como comprado cuando lo compres.'}
        </AppText>

        <PressableScale onPress={() => setPicker(true)} style={styles.box} accessibilityLabel="Elegir categoría de la lista">
          <AppText variant="label" color="textMuted">Categoría</AppText>
          <View style={styles.boxRow}>
            {vm.categoryLabel ? <IconBadge icon={vm.categoryIcon} size={32} tint={vm.categoryColor} /> : null}
            <View style={styles.flex}><AppText variant="body" color={vm.categoryLabel ? 'text' : 'textMuted'} numberOfLines={1}>{vm.categoryLabel ?? 'Elegir categoría'}</AppText></View>
            <Icon name="chevronRight" size={18} color="textMuted" />
          </View>
        </PressableScale>
        <AppText variant="small" color="textMuted">Los productos sin categoría propia usan esta al registrar el gasto.</AppText>

        {vm.kind === 'market' ? (
          <PressableScale onPress={() => setKeypad('limit')} style={styles.box} accessibilityLabel="Editar límite">
            <AppText variant="label" color="textMuted">Límite (USD)</AppText>
            <AppText variant="balance" color={vm.limit.minor > 0 ? 'text' : 'textMuted'} fit>{vm.limitLabel}</AppText>
          </PressableScale>
        ) : null}

        <AppText variant="label" color="textMuted">Tasa para productos en Bs</AppText>
        <Segmented options={[{ value: 'bcv', label: 'BCV' }, { value: 'manual', label: 'Manual' }]} value={vm.rateMode} onChange={vm.setRateMode} />
        {vm.rateMode === 'bcv' ? (
          <AppText variant="small" color="textMuted">{vm.bcvLabel}. Se actualiza sola con la tasa más reciente.</AppText>
        ) : (
          <PressableScale onPress={() => setKeypad('rate')} style={styles.box} accessibilityLabel="Editar tasa manual">
            <AppText variant="label" color="textMuted">Tasa manual</AppText>
            <AppText variant="heading" color={vm.manualRate.rateScaled > 0 ? 'text' : 'textMuted'}>{vm.manualLabel}</AppText>
          </PressableScale>
        )}

        {!vm.isNew ? (
          <>
            <Card style={styles.list}><SettingsRow label="Eliminar lista" danger onPress={vm.confirmDelete} last /></Card>
            <AppText variant="small" color="textMuted">Se borra la lista y sus productos. Los gastos que ya registraste se quedan.</AppText>
          </>
        ) : null}
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}><Button label="Guardar" onPress={() => void vm.save()} disabled={!vm.canSave} /></View>

      <CategoryPickerModal
        visible={picker}
        categories={vm.pickerCategories}
        selectedId={vm.categoryId}
        onSelect={(c) => {
          vm.selectCategory(c);
          setPicker(false);
        }}
        onClose={() => setPicker(false)}
        onNew={() => {
          setPicker(false);
          vm.openNewCategory();
        }}
        onNewSub={(parentId) => {
          setPicker(false);
          vm.openNewSubcategory(parentId);
        }}
      />
      <SheetModal visible={keypad !== null} title={keypad === 'limit' ? 'LÍMITE (USD)' : 'TASA MANUAL (BS POR USD)'} onClose={() => setKeypad(null)}>
        <AppText variant="display" align="center">{keypad === 'limit' ? vm.limit.display : vm.manualRate.display}</AppText>
        <Keypad onKey={keypad === 'limit' ? vm.limit.press : vm.manualRate.press} />
        <Button label="Listo" onPress={() => setKeypad(null)} />
      </SheetModal>
    </ScreenTemplate>
  );
}
