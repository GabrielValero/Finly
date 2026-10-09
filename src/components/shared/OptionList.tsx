import { ScrollView, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  options: readonly Option[];
  selected: string | null;
  onSelect: (value: string) => void;
}

export function OptionList({ options, selected, onSelect }: Props) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: t.space[12] },
    texts: { gap: t.space[4] },
  }));
  return (
    <ScrollView>
      {options.map((o) => (
        <PressableScale key={o.value} onPress={() => onSelect(o.value)} style={styles.row}>
          <View style={styles.texts}>
            <AppText variant="body" color={o.value === selected ? 'accent' : 'text'}>{o.label}</AppText>
            {o.hint ? <AppText variant="caption" color="textMuted">{o.hint}</AppText> : null}
          </View>
          {o.value === selected ? <Icon name="check" size={20} color="accent" /> : null}
        </PressableScale>
      ))}
    </ScrollView>
  );
}
