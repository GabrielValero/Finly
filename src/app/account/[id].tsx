import { useLocalSearchParams } from 'expo-router';
import { CuentaFormView } from '../../components/modules/cuentas/CuentaFormView';

export default function EditAccountRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CuentaFormView id={id} />;
}
