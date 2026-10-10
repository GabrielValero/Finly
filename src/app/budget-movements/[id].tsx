import { useLocalSearchParams } from 'expo-router';
import { ListaMovimientosView } from '../../components/modules/movimientos/ListaMovimientosView';

export default function BudgetMovementsRoute() {
  const { id, month } = useLocalSearchParams<{ id: string; month: string }>();
  return <ListaMovimientosView scope={{ type: 'budget', id, month }} />;
}
