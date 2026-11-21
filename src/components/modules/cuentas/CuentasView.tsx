import { ScrollView, View } from 'react-native';
import { useAccountsScreen, type AccountCardVm } from '../../../hooks/useAccountsScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { HumanLine } from '../../shared/HumanLine';
import { IconBadge } from '../../shared/IconBadge';
import { PressableScale } from '../../shared/PressableScale';
import { StatTile } from '../../shared/StatTile';
import { ScreenTemplate } from '../../template/ScreenTemplate';

function AccountRow({ a, last, onPress }: { a: AccountCardVm; last: boolean; onPress: () => void }) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[16], paddingVertical: t.space[12], borderBottomWidth: 1, borderBottomColor: t.colors.border },
    last: { borderBottomWidth: 0 },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { alignItems: 'flex-end', gap: t.space[4], maxWidth: '45%' },
  }));
  return (
    <PressableScale onPress={onPress} style={[styles.row, last ? styles.last : null]} accessibilityLabel={`Ver movimientos de ${a.name}`}>
      <IconBadge icon={a.icon} size={44} />
      <View style={styles.texts}>
        <AppText variant="heading" numberOfLines={1}>{a.name}</AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>{a.meta}</AppText>
      </View>
      <View style={styles.right}>
        <AppText variant="amount" fit>{a.balance}</AppText>
        {a.equivalent ? <AppText variant="caption" color="textMuted" numberOfLines={1}>{a.equivalent}</AppText> : null}
      </View>
    </PressableScale>
  );
}

function AccountGroup({ title, accounts, onOpen }: { title: string; accounts: AccountCardVm[]; onOpen: (id: string) => void }) {
  const styles = useThemedStyles((t) => ({
    group: { gap: t.space[8] },
    card: { paddingVertical: t.space[4] },
  }));
  if (accounts.length === 0) return null;
  return (
    <View style={styles.group}>
      <AppText variant="label" color="textMuted">{title}</AppText>
      <Card style={styles.card}>
        {accounts.map((a, i) => <AccountRow key={a.id} a={a} last={i === accounts.length - 1} onPress={() => onOpen(a.id)} />)}
      </Card>
    </View>
  );
}

export function CuentasView() {
  const vm = useAccountsScreen();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[16] },
    empty: { alignItems: 'center', gap: t.space[16], paddingVertical: t.space[32] },
    total: { gap: t.space[4] },
    human: { marginTop: t.space[12] },
    tiles: { flexDirection: 'row', gap: t.space[12], marginTop: t.space[16] },
    lastBlock: { gap: t.space[4] },
    section: { gap: t.space[8] },
  }));
  return (
    <ScreenTemplate title="Cuentas" titleStyle="large" right={{ icon: 'plus', onPress: vm.openNew }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.total}>
            <AppText variant="label" color="textMuted">Patrimonio total</AppText>
            <AppText variant="balance" fit>{vm.totalLabel}</AppText>
            {vm.totalBsLabel ? <AppText variant="caption" color="textMuted">{vm.totalBsLabel}</AppText> : null}
            {vm.totalNote ? <AppText variant="small" color="warning">{vm.totalNote}</AppText> : null}
          </View>
          {vm.humanLine ? <View style={styles.human}><HumanLine segments={vm.humanLine} variant="bodyRegular" /></View> : null}
          {!vm.isEmpty ? (
            <View style={styles.tiles}>
              <StatTile label="Dólares" value={vm.usdTile} />
              <StatTile label="Bolívares" value={vm.vesTile} />
            </View>
          ) : null}
        </Card>

        {vm.canTransfer ? <Button label="Transferir entre cuentas" icon="transfer" onPress={vm.openTransfer} /> : null}

        {vm.isEmpty ? (
          <View style={styles.empty}>
            <AppText variant="small" color="textMuted" align="center">Aún no tienes cuentas.</AppText>
            <Button label="Crear cuenta" onPress={vm.openNew} />
          </View>
        ) : null}

        <AccountGroup title="Dólares · USD" accounts={vm.usd} onOpen={vm.openAccount} />
        <AccountGroup title="Bolívares · VES" accounts={vm.ves} onOpen={vm.openAccount} />

        {vm.lastTransfer ? (
          <View style={styles.section}>
            <AppText variant="label" color="textMuted">Última transferencia</AppText>
            <Card>
              <View style={styles.lastBlock}>
                <AppText variant="heading" numberOfLines={2}>{vm.lastTransfer.route}</AppText>
                <AppText variant="amount" fit>{vm.lastTransfer.amounts}</AppText>
              </View>
              {vm.lastTransfer.rate ? <AppText variant="caption" color="textMuted">{vm.lastTransfer.rate}</AppText> : null}
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </ScreenTemplate>
  );
}
