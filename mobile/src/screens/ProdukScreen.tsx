import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MenuFormModal, { type MenuFormData } from '../components/MenuFormModal';
import FilterChips from '../components/ui/FilterChips';
import EmptyState from '../components/ui/EmptyState';
import { menuCategories, menuSeed, type Menu } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type CategoryKey = string;

const categoryOptions = [{ key: 'semua', label: 'Semua' }, ...menuCategories.map((c) => ({ key: c.id, label: c.name }))];

export default function ProdukScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menus, setMenus] = useState<Menu[]>(menuSeed);
  const [category, setCategory] = useState<CategoryKey>('semua');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);

  const filteredMenus = useMemo(
    () => (category === 'semua' ? menus : menus.filter((m) => m.categoryId === category)),
    [menus, category]
  );

  const openAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (menu: Menu) => {
    setEditing(menu);
    setModalVisible(true);
  };

  const handleSave = (data: MenuFormData) => {
    if (editing) {
      setMenus((prev) =>
        prev.map((m) =>
          m.id === editing.id
            ? { ...m, name: data.name, categoryId: data.categoryId, basePrice: data.price, costPrice: data.costPrice, stock: data.stock, available: data.available }
            : m
        )
      );
      Alert.alert('Berhasil', `${data.name} berhasil diperbarui.`);
    } else {
      const newMenu: Menu = {
        id: `m-${Date.now()}`,
        name: data.name,
        basePrice: data.price,
        costPrice: data.costPrice,
        categoryId: data.categoryId,
        stock: data.stock,
        available: data.available,
        variants: [],
        addons: [],
      };
      setMenus((prev) => [...prev, newMenu]);
      Alert.alert('Berhasil', `${data.name} berhasil disimpan.`);
    }
    setModalVisible(false);
  };

  const handleDelete = (menu: Menu) => {
    Alert.alert('Hapus Menu', `Yakin ingin menghapus menu ${menu.name}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          setMenus((prev) => prev.filter((m) => m.id !== menu.id));
          Alert.alert('Berhasil', `${menu.name} berhasil dihapus.`);
        },
      },
    ]);
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
          <Text style={styles.title}>Produk</Text>
          <Text style={styles.subtitle}>Manajemen menu & HPP dinamis</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah menu"
          onPress={openAdd}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        <FilterChips options={categoryOptions} selected={category} onSelect={setCategory} />
      </View>

      <FlatList
        data={filteredMenus}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="silverware-fork-knife"
            title="Belum ada menu"
            subtitle="Ketuk tombol + di pojok kanan atas untuk menambahkan menu."
          />
        }
        renderItem={({ item }) => {
          const profit = item.basePrice - item.costPrice;
          const catName = menuCategories.find((c) => c.id === item.categoryId)?.name ?? '-';
          return (
            <View style={[styles.card, !item.available && styles.cardInactive]}>
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="food-variant" size={22} color={colors.primary} />
                </View>
                <View style={styles.cardTextArea}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardCategory}>{catName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.available ? colors.successSoft : '#E5EAF3' }]}>
                  <Text style={[styles.statusBadgeText, { color: item.available ? colors.success : '#9AA8C2' }]}>
                    {item.available ? 'Tersedia' : 'Nonaktif'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardMetaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Harga Jual</Text>
                  <Text style={styles.metaValue}>{formatRupiah(item.basePrice)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>HPP</Text>
                  <Text style={styles.metaValue}>{formatRupiah(item.costPrice)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Laba</Text>
                  <Text style={[styles.metaValue, { color: profit >= 0 ? colors.success : colors.danger }]}>
                    {formatRupiah(profit)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Stok</Text>
                  <Text style={[styles.metaValue, { color: item.stock === 0 ? colors.danger : colors.text }]}>
                    {item.stock}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openEdit(item)}
                  style={[styles.actionButton, styles.actionEdit]}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.primary} />
                  <Text style={styles.actionEditText}>Ubah</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleDelete(item)}
                  style={[styles.actionButton, styles.actionDelete]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={15} color={colors.danger} />
                  <Text style={styles.actionDeleteText}>Hapus</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <MenuFormModal
        visible={modalVisible}
        editing={editing}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
    paddingVertical: 9,
  },
  actionEdit: {
    backgroundColor: colors.primarySoft,
  },
  actionEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  actionDelete: {
    backgroundColor: '#FEE2E2',
  },
  actionDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
});
