import { useLocalSearchParams } from 'expo-router';
import { PlanificarView } from '../../components/modules/presupuesto/PlanificarView';

export default function BudgetItemRoute() {
  const { id, month } = useLocalSearchParams<{ id: string; month: string }>();
  return <PlanificarView id={id} month={month} />;
}
