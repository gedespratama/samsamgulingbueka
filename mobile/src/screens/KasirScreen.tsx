import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import KasirItemModal from '../components/KasirItemModal';
import FilterChips from '../components/ui/FilterChips';
import { useCart } from '../context/CartContext';
import { usePrinter } from '../context/PrinterContext';
import { menuCategories, menuSeed, type Menu } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type CategoryKey = string;

const categoryOptions = [{ key: 'semua', label: 'Semua' }, ...menuCategories.map((c) => ({ key: c.id, label: c.name }))];

export default function KasirScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, totalItems, subtotal, orderType, setOrderType, tableNumber, setTableNumber } = useCart();
  const { status } = usePrinter();
  const [category, setCategory] = useState<CategoryKey>('semua');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const filteredMenus = useMemo(
    () => (category === 'semua' ? menuSeed : menuSeed.filter((m) => m.categoryId === category)),
    [category]
  );

  const handleFinish = () => {
    if (items.length === 0) return;
    navigation.navigate('MainTabs', { screen: 'Keranjang' });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Kasir</Text>
          <Text style={styles.subtitle}>Pilih menu, sesuaikan pesanan pelanggan</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Status printer"
          onPress={() => navigation.navigate('Printer')}
          style={[
            styles.printerChip,
            { backgroundColor: status === 'connected' ? colors.successSoft : '#E5EAF3' },
          ]}
        >
          <MaterialCommunityIcons
            name={status === 'connected' ? 'printer' : 'printer-off-outline'}
            size={16}
            color={status === 'connected' ? colors.success : '#9AA8C2'}
          />
          <Text
            style={[
              styles.printerText,
              { color: status === 'connected' ? colors.success : '#9AA8C2' },
            ]}
          >
            {status === 'connected' ? 'Siap' : status === 'connecting' ? 'Menghubung...' : 'Terputus'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.orderTypeRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOrderType('dine_in')}
          style={[styles.typeChip, orderType === 'dine_in' && styles.typeChipActive]}
        >
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={15}
            color={orderType === 'dine_in' ? colors.white : colors.textMuted}
          />
          <Text style={[styles.typeChipText, orderType === 'dine_in' && styles.typeChipTextActive]}>
            Dine-in
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOrderType('takeaway')}
          style={[styles.typeChip, orderType === 'takeaway' && styles.typeChipActive]}
        >
          <MaterialCommunityIcons
            name="shopping-outline"
            size={15}
            color={orderType === 'takeaway' ? colors.white : colors.textMuted}
          />
          <Text style={[styles.typeChipText, orderType === 'takeaway' && styles.typeChipTextActive]}>
            Takeaway
          </Text>
        </Pressable>
        {orderType === 'dine_in' && (
          <View style={styles.tableInputWrap}>
            <MaterialCommunityIcons name="table-furniture" size={15} color={colors.textMuted} />
            <TextInput
              value={tableNumber}
              onChangeText={(t) => setTableNumber(t.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="Meja"
              placeholderTextColor="#9AA8C2"
              keyboardType="number-pad"
              style={styles.tableInput}
            />
          </View>
        )}
      </View>

      <View style={styles.chipsRow}>
        <FilterChips options={categoryOptions} selected={category} onSelect={setCategory} />
      </View>

      <FlatList
        data={filteredMenus}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.menuRow}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Tidak ada menu di kategori ini</Text>
        }
        renderItem={({ item }) => {
          const out = !item.available || item.stock <= 0;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={out}
              onPress={() => setSelectedMenu(item)}
              style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
            >
              <View style={[styles.menuIcon, { backgroundColor: out ? '#E5EAF3' : '#E3EEFF' }]}>
                <MaterialCommunityIcons
                  name="food-variant"
                  size={24}
                  color={out ? '#9AA8C2' : colors.primary}
                />
              </View>
              <Text style={[styles.menuName, out && styles.menuTextMuted]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.menuPrice, out && styles.menuTextMuted]}>
                {formatRupiah(item.basePrice)}
              </Text>
              <View
                style={[
                  styles.stockBadge,
                  { backgroundColor: out ? '#E5EAF3' : item.stock <= 10 ? '#FEF3C7' : '#DCFCE7' },
                ]}
              >
                <Text
                  style={[
                    styles.stockBadgeText,
                    { color: out ? '#9AA8C2' : item.stock <= 10 ? '#B45309' : '#15803D' },
                  ]}
                >
                  {out ? 'Habis' : `Stok ${item.stock}`}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomCount}>{totalItems} item</Text>
          <Text style={styles.bottomTotal}>{formatRupiah(subtotal)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={items.length === 0}
          onPress={handleFinish}
          style={[styles.finishButton, items.length === 0 && styles.finishButtonDisabled]}
        >
          <MaterialCommunityIcons name="cart-check" size={18} color={colors.white} />
          <Text style={styles.finishButtonText}>Selesaikan</Text>
        </Pressable>
      </View>

      <KasirItemModal
        menu={selectedMenu ?? menuSeed[0]}
        visible={selectedMenu !== null}
        onClose={() => setSelectedMenu(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextArea: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  printerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  printerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  orderTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeChipTextActive: {
    color: colors.white,
  },
  tableInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  tableInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  chipsRow: {
    marginBottom: 10,
  },
  menuList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  menuRow: {
    gap: 10,
    marginBottom: 10,
  },
  menuCard: {
    flex: 1,
    maxWidth: '48.5%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 12,
  },
  menuCardPressed: {
    opacity: 0.75,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    minHeight: 34,
  },
  menuPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  menuTextMuted: {
    color: '#9AA8C2',
  },
  stockBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 32,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bottomTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  finishButtonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
