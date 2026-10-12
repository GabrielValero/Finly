import { ScrollView, View } from 'react-native';
import { useDebtsScreen, type DebtRowVm } from '../../../hooks/useDebtsScreen';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Fab } from '../../shared/Fab';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { ScreenTemplate } from '../../template/ScreenTemplate';

function DebtRow({ row, onPress }: { row: DebtRowVm; onPress: () => void }) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    row: { gap: t.space[8] },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[12] },
    flex: { flex: 1, minWidth: 0, gap: t.space[4] },
    right: { alignItems: 'flex-end', gap: t.space[4] },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden' },
  }));
  const barColor = row.status === 'overdue' ? theme.colors.expense : row.status === 'settled' ? theme.colors.income : theme.colors.accent;
  return (
    <PressableScale onPress={onPress} accessibilityLabel={row.person}>
      <Card style={styles.row}>
        <View style={styles.top}>
          <View style={styles.flex}>
            <AppText variant="heading" numberOfLines={1}>{row.person}</AppText>
            <AppText variant="small" color={row.status === 'overdue' ? 'expense' : 'textMuted'} numberOfLines={1}>{row.subtitle}</AppText>
          </View>
          <View style={styles.right}>
            <AppText variant="amountMid">{row.remaining}</AppText>
            {row.usdNote ? <AppText variant="caption" color="textMuted">{row.usdNote}</AppText> : null}
          </View>
        </View>
        {row.status !== 'settled' && row.progress > 0 ? (
          <View style={styles.track}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: barColor, width: `${Math.round(Math.min(row.progress, 1) * 100)}%` }} />
          </View>
        ) : null}
      </Card>
    </PressableScale>
  );
}

export function DeudasView() {
  const vm = useDebtsScreen();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: 120, gap: t.space[8] },
    cols: { flexDirection: 'row', gap: t.space[8] },
    col: { flex: 1, minWidth: 0, gap: t.space[4] },
    section: { paddingTop: t.space[12] },
    empty: { alignItems: 'center', gap: t.space[12] },
  }));
  return (
    <ScreenTemplate title="DEUDAS" left="back" onLeft={vm.back}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card highlight style={{ gap: 8 }}>
            <AppText variant="label" color="textMuted">Balance neto (USD)</AppText>
            <AppText variant="display" color={vm.netPositive ? 'income' : 'expense'} fit>{vm.net}</AppText>
            <View style={styles.cols}>
              <View style={styles.col}>
                <AppText variant="label" color="textMuted">Te deben</AppText>
                <AppText variant="amountMid" fit>{vm.owedToMe}</AppText>
              </View>
              <View style={styles.col}>
                <AppText variant="label" color="textMuted">Debes</AppText>
                <AppText variant="amountMid" fit>{vm.iOwe}</AppText>
              </View>
            </View>
            {vm.unvalued > 0 ? (
              <AppText variant="small" color="textMuted">
                {vm.unvalued} {vm.unvalued === 1 ? 'deuda en Bs no está incluida' : 'deudas en Bs no están incluidas'} porque falta la tasa del día.
              </AppText>
            ) : null}
          </Card>

          <Segmented options={vm.tabs} value={vm.tab} onChange={vm.setTab} />

          {vm.emptyTab ? (
            <Card>
              <View style={styles.empty}>
                <AppText variant="heading" align="center">{vm.isEmpty ? 'Aún no tienes deudas' : 'Nada por aquí'}</AppText>
                <AppText variant="small" color="textMuted" align="center">
                  Lleva el control de lo que te deben y lo que debes, con pagos parciales. Si quieres, también se registra como movimiento en una de tus cuentas.
                </AppText>
                <Button label="Registrar deuda" onPress={vm.newDebt} />
              </View>
            </Card>
          ) : (
            <>
              {vm.open.map((r) => <DebtRow key={r.id} row={r} onPress={() => vm.openDebt(r.id)} />)}
              {vm.settled.length > 0 ? (
                <>
                  <View style={styles.section}><AppText variant="label" color="textMuted">Saldadas</AppText></View>
                  {vm.settled.map((r) => <DebtRow key={r.id} row={r} onPress={() => vm.openDebt(r.id)} />)}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
        <Fab onPress={vm.newDebt} label="Nueva deuda" />
      </View>
    </ScreenTemplate>
  );
}
