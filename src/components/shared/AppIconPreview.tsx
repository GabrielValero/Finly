import { Image, View } from 'react-native';
import markA from '../../../assets/icons/mark-a.png';
import markB from '../../../assets/icons/mark-b.png';
import markC from '../../../assets/icons/mark-c.png';
import markD from '../../../assets/icons/mark-d.png';
import markE from '../../../assets/icons/mark-e.png';
import markF from '../../../assets/icons/mark-f.png';
import markG from '../../../assets/icons/mark-g.png';
import markH from '../../../assets/icons/mark-h.png';

const MARKS: Record<string, number> = { a: markA, b: markB, c: markC, d: markD, e: markE, f: markF, g: markG, h: markH };

interface Props {
  shape: string;
  background: string;
  size: number;
}

/** Ícono de la app dibujado como lo muestra el lanzador: fondo de color con la marca centrada. */
export function AppIconPreview({ shape, background, size }: Props) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.26, backgroundColor: background, overflow: 'hidden' }}>
      <Image source={MARKS[shape]} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}
