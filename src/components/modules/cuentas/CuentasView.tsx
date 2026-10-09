import { ScrollView, View } from 'react-native';
import { useAccountsScreen, type AccountCardVm } from '../../../hooks/useAccountsScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { IconBadge } from '../../shared/IconBadge';
import { ScreenTemplate } from '../../template/ScreenTemplate';

function AccountCard({ a }: { a: AccountCardVm }) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[16] },
    texts: { flex: 1, gap: t.space[4] },
    right: { alignItems: 'flex-end', gap: t.space[4] },
  }));
  return (
    <Card>
      <View style={styles.row}>
        <IconBadge icon={a.icon} />
        <View style={styles.texts}>
          <AppText variant="heading" numberOfLines={1}>{a.name}</AppText>
          <AppText variant="caption" color="textMuted">{a.meta}</AppText>
        </View>
        <View style={styles.right}>
          <AppText variant="amount">{a.balance}</AppText>
          {a.equivalent ? <AppText variant="caption" color="textMuted">{a.equivalent}</AppText> : null}
        </View>
      </View>
    </Card>
  );
}

export function CuentasView() {
  const vm = useAccountsScreen();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    group: { paddingTop: t.space[8] },
    empty: { alignItems: 'center', gap: t.space[16], paddingVertical: t.space[32] },
  }));
  return (
    <ScreenTemplate title="Cuentas" titleStyle="large" right={{ icon: 'plus', onPress: vm.openNew }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <AppText variant="label" color="textMuted">Patrimonio total</AppText>
          <AppText variant="balance">{vm.totalLabel}</AppText>
          {vm.totalNote ? <AppText variant="small" color="warning">{vm.totalNote}</AppText> : null}
        </Card>
        {vm.isEmpty ? (
          <View style={styles.empty}>
            <AppText variant="small" color="textMuted" align="center">Aún no tienes cuentas.</AppText>
            <Button label="Crear cuenta" onPress={vm.openNew} />
          </View>
        ) : null}
        {vm.usd.length > 0 ? (
          <View style={styles.group}><AppText variant="label" color="textMuted">Dólares · USD</AppText></View>
        ) : null}
        {vm.usd.map((a) => <AccountCard key={a.id} a={a} />)}
        {vm.ves.length > 0 ? (
          <View style={styles.group}><AppText variant="label" color="textMuted">Bolívares · VES</AppText></View>
        ) : null}
        {vm.ves.map((a) => <AccountCard key={a.id} a={a} />)}
      </ScrollView>
    </ScreenTemplate>
  );
}
