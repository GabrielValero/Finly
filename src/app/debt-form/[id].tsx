import { useLocalSearchParams } from 'expo-router';
import { DeudaFormView } from '../../components/modules/deudas/DeudaFormView';
import type { DebtDirection } from '../../utils/debts';

export default function DebtFormRoute() {
  const { id, direction } = useLocalSearchParams<{ id: string; direction?: string }>();
  return <DeudaFormView id={id} direction={direction === 'i_owe' ? 'i_owe' : 'owed_to_me' as DebtDirection} />;
}
