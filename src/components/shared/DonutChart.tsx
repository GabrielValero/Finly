import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { mix } from '../../utils/color';
import type { ResolvedTheme } from '../../utils/theme';
import { arcPath } from '../../utils/donut';
import { AppText } from './AppText';

export interface DonutArcVm {
  key: string;
  /** Color de categoría (dato); null usa un tono neutro. */
  color: string | null;
  startDeg: number;
  endDeg: number;
}

interface Props {
  arcs: readonly DonutArcVm[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}

const STROKE = 22;

/** Color de una porción: el de su categoría; "Sin categoría" y "Otros" usan dos neutros distintos. */
export function arcColor(theme: ResolvedTheme, arc: { key: string; color: string | null }): string {
  if (arc.color) return arc.color;
  return arc.key === 'others' ? mix(theme.colors.surface, theme.colors.text, 0.22) : theme.colors.textMuted;
}

/** Dona de gasto por categoría con el total al centro. Aislada aquí para poder cambiar la librería de dibujo. */
export function DonutChart({ arcs, centerLabel, centerValue, size = 168 }: Props) {
  const t = useTheme();
  const r = (size - STROKE) / 2;
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Circle cx={c} cy={c} r={r} stroke={t.colors.surface2} strokeWidth={STROKE} fill="none" />
        {arcs.map((a) => (
          <Path key={a.key} d={arcPath(c, c, r, a.startDeg, a.endDeg)} stroke={arcColor(t, a)} strokeWidth={STROKE} strokeLinecap="butt" fill="none" />
        ))}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', maxWidth: size - STROKE * 2 - 8 }}>
        <AppText variant="label" color="textMuted">{centerLabel}</AppText>
        <AppText variant="amountMid" fit>{centerValue}</AppText>
      </View>
    </View>
  );
}
