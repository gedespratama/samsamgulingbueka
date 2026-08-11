import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme';

export interface ChipOption<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
}

export default function FilterChips<T extends string>({ options, selected, onSelect }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isActive = option.key === selected;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(option.key)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.white,
  },
});
