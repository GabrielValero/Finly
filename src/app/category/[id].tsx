import { useLocalSearchParams } from 'expo-router';
import { CategoriaFormView } from '../../components/modules/categorias/CategoriaFormView';

export default function CategoryRoute() {
  const { id, kind, parentId, sub, pick } = useLocalSearchParams<{ id: string; kind?: string; parentId?: string; sub?: string; pick?: string }>();
  return <CategoriaFormView id={id} kind={kind} parentId={parentId} sub={sub} pick={pick} />;
}
