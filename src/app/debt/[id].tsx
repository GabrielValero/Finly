import { useLocalSearchParams } from 'expo-router';
import { DeudaDetalleView } from '../../components/modules/deudas/DeudaDetalleView';

export default function DebtRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DeudaDetalleView id={id} />;
}
