import { useLocalSearchParams } from 'expo-router';
import { DetalleView } from '../../components/modules/movimientos/DetalleView';

export default function MovementRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetalleView id={id} />;
}
