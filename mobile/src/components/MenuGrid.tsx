import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { menuItems } from '../data/mock';
import { colors } from '../theme';

interface Props {
  onPressItem: (key: string, label: string) => void;
  hiddenKeys?: string[];
}

export default function MenuGrid({ onPressItem, hiddenKeys = [] }: Props) {
  const items = menuItems.filter((item) => !hiddenKeys.includes(item.key));
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Utama</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => onPressItem(item.key, item.label)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.tint }]}>
              <MaterialCommunityIcons name={item.icon} size={24} color={item.iconColor} />
            </View>
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  item: {
    width: '22%',
    backgroundColor: colors.card,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  itemPressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
});
