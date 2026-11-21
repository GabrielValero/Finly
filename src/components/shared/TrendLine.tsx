import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { trendPath } from '../../utils/trendPath';

interface Props {
  values: readonly number[];
  height?: number;
}

/** Línea de tendencia suave, sin ejes. Aislada aquí para poder cambiar la librería de dibujo. */
export function TrendLine({ values, height = 44 }: Props) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const d = width > 0 ? trendPath(values, width, height) : '';
  return (
    <View style={{ height }} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {d ? (
        <Svg width={width} height={height}>
          <Path d={d} stroke={t.colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      ) : null}
    </View>
  );
}
