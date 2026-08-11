import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function QuantityStepper({ value, onChange, min = 1, max, size = 'md' }: Props) {
  const dim = size === 'sm' ? 26 : 32;
  const iconSize = size === 'sm' ? 14 : 16;

  const canDecrease = value > min;
  const canIncrease = max === undefined || value < max;

  const decrease = () => {
    if (canDecrease) onChange(value - 1);
  };

  const increase = () => {
    if (canIncrease) onChange(value + 1);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kurangi jumlah"
        disabled={!canDecrease}
        onPress={decrease}
        style={[styles.button, { width: dim, height: dim }, !canDecrease && styles.buttonDisabled]}
      >
        <MaterialCommunityIcons name="minus" size={iconSize} color={colors.text} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tambah jumlah"
        disabled={!canIncrease}
        onPress={increase}
        style={[styles.button, { width: dim, height: dim }, !canIncrease && styles.buttonDisabled]}
      >
        <MaterialCommunityIcons name="plus" size={iconSize} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    minWidth: 22,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
