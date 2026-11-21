import { ScrollView, View } from 'react-native';
import type { useListDetail } from '../../../hooks/useListDetail';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { PressableScale } from '../../shared/PressableScale';
import { SheetModal } from '../../shared/SheetModal';

type Vm = ReturnType<typeof useListDetail>;

/** Hoja "Registrar compra": de qué cuenta sale, cómo se registrará por categoría y cuánto es en total. */
export function PurchaseSheet({ vm }: { vm: Vm }) {
  const styles = useThemedStyles((t) => ({
    body: { flexGrow: 0 },
    content: { gap: t.space[12] },
    radioRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], padding: t.space[12], borderRadius: t.radius[16], backgroundColor: t.colors.surface2, borderWidth: 1, borderColor: t.colors.surface2 },
    radioRowOn: { borderColor: t.colors.accent },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' },
    radioOn: { borderColor: t.colors.accent },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.colors.accent },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { maxWidth: '40%' },
    groupRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], paddingVertical: t.space[8] },
    swatch: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.colors.textMuted },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.space[12], paddingTop: t.space[4] },
  }));
  const p = vm.purchase;
  return (
    <SheetModal visible={vm.purchaseOpen} title="REGISTRAR COMPRA" onClose={vm.closePurchase}>
      {p ? (
        <>
          <ScrollView style={styles.body} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <AppText variant="label" color="textMuted">Pagar desde</AppText>
            {vm.accountChoices.map((a) => {
              const on = a.id === vm.accountId;
              return (
                <PressableScale key={a.id} onPress={() => vm.setAccountId(a.id)} style={[styles.radioRow, on ? styles.radioRowOn : null]} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${a.name}, ${a.balance}`}>
                  <View style={[styles.radio, on ? styles.radioOn : null]}>{on ? <View style={styles.dot} /> : null}</View>
                  <View style={styles.texts}>
                    <AppText variant="body" numberOfLines={1}>{a.name}</AppText>
                    {a.hint ? <AppText variant="caption" color="textMuted" numberOfLines={1}>{a.hint}</AppText> : null}
                  </View>
                  <View style={styles.right}><AppText variant="amount" fit>{a.balance}</AppText></View>
                </PressableScale>
              );
            })}

            <AppText variant="label" color="textMuted">Se registrará como</AppText>
            {p.groups.map((g) => (
              <View key={g.key} style={styles.groupRow}>
                <View style={[styles.swatch, g.color ? { backgroundColor: g.color } : null]} />
                <View style={styles.texts}>
                  <AppText variant="body" numberOfLines={1}>{g.label}</AppText>
                  <AppText variant="caption" color="textMuted">{g.count} {g.count === 1 ? 'producto' : 'productos'}</AppText>
                </View>
                <View style={styles.right}><AppText variant="amount" fit>{g.amount}</AppText></View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <AppText variant="label" color="textMuted">Total</AppText>
              <AppText variant="balance" fit>{p.totalLabel}</AppText>
            </View>
            {p.inBs ? <AppText variant="small" color="textMuted">Saldrán {p.inBs} de la cuenta, a la tasa {vm.rateLabel}.</AppText> : null}
            {p.warnings.map((w) => (
              <AppText key={w} variant="small" color="expense">{w}</AppText>
            ))}
            {p.info ? <AppText variant="small" color="textMuted">{p.info}</AppText> : null}
            {vm.purchaseError ? <AppText variant="small" color="expense">{vm.purchaseError}</AppText> : null}
          </ScrollView>
          <Button label="Registrar gasto" onPress={() => void vm.confirmPurchase()} disabled={p.blocked || vm.purchaseSaving} />
        </>
      ) : null}
    </SheetModal>
  );
}
