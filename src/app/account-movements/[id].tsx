import { useLocalSearchParams } from 'expo-router';
import { ListaMovimientosView } from '../../components/modules/movimientos/ListaMovimientosView';

export default function AccountMovementsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListaMovimientosView scope={{ type: 'account', id }} />;
}
