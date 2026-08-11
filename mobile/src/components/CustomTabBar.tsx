import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCart } from '../context/CartContext';
import type { RootTabParamList } from '../navigation/types';
import { colors } from '../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabItem {
  route: keyof RootTabParamList;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}

const sideTabs: TabItem[] = [
  { route: 'Beranda', label: 'Beranda', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { route: 'Riwayat', label: 'Riwayat', icon: 'receipt-text-outline', activeIcon: 'receipt-text' },
  { route: 'Notifikasi', label: 'Notifikasi', icon: 'bell-outline', activeIcon: 'bell' },
  { route: 'Akun', label: 'Akun', icon: 'account-outline', activeIcon: 'account' },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();
  const cartRoute = 'Keranjang';

  const handlePress = (route: keyof RootTabParamList) => {
    navigation.navigate(route);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {sideTabs.slice(0, 2).map((tab) => (
        <TabButton key={tab.route} tab={tab} isActive={state.index === state.routeNames.indexOf(tab.route)} onPress={() => handlePress(tab.route)} />
      ))}

      <View style={styles.cartSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keranjang"
          onPress={() => handlePress(cartRoute)}
          style={({ pressed }) => pressed && styles.cartPressed}
        >
          <LinearGradient
            colors={['#2E7CF6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cartButton}
          >
            <MaterialCommunityIcons name="cart" size={28} color="#FFFFFF" />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {sideTabs.slice(2).map((tab) => (
        <TabButton key={tab.route} tab={tab} isActive={state.index === state.routeNames.indexOf(tab.route)} onPress={() => handlePress(tab.route)} />
      ))}
    </View>
  );
}

function TabButton({ tab, isActive, onPress }: { tab: TabItem; isActive: boolean; onPress: () => void }) {
  const color = isActive ? colors.primary : '#9AA8C2';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={({ pressed }) => [styles.tabButton, pressed && styles.tabPressed]}
    >
      <MaterialCommunityIcons name={isActive ? tab.activeIcon : tab.icon} size={24} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  cartSlot: {
    flex: 1,
    alignItems: 'center',
  },
  cartPressed: {
    opacity: 0.85,
  },
  cartButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -22 }],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
