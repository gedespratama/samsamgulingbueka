import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AddKaryawanModal, { type NewEmployee } from '../components/AddKaryawanModal';
import { employeeRepo } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import { useCashier } from '../context/CashierContext';
import { roleOptions, type Employee, type EmployeeRole } from '../data/mock';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const roleMeta: Record<EmployeeRole, { icon: IconName; tint: string; color: string }> = {
  kasir: { icon: 'cash-register', tint: colors.primarySoft, color: colors.primary },
  admin: { icon: 'clipboard-edit-outline', tint: '#EDE9FE', color: '#7C3AED' },
  pemilik: { icon: 'crown-outline', tint: '#FEF3C7', color: '#D97706' },
};

export default function KaryawanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: employees, refresh } = useDbList(employeeRepo.getAll);
  const { cashier } = useCashier();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const isOwner = cashier?.role === 'pemilik';

  const handleSave = async (data: NewEmployee) => {
    if (editing) {
      await employeeRepo.update({
        ...editing,
        name: data.name,
        role: data.role,
        pin: data.pin || editing.pin,
      });
      await refresh();
      setModalVisible(false);
      setEditing(null);
      const pinChanged = data.pin.length > 0;
      Alert.alert(
        'Berhasil',
        `${data.name} berhasil diperbarui${pinChanged ? ' dan PIN di-reset.' : '.'}`
      );
      return;
    }
    const id = `emp-${Date.now()}`;
    await employeeRepo.create(
      { name: data.name, role: data.role, pin: data.pin, active: true },
      id
    );
    await refresh();
    setModalVisible(false);
    Alert.alert('Berhasil', `${data.name} ditambahkan sebagai ${roleOptions[data.role].label}.`);
  };

  const handleDelete = (employee: Employee) => {
    Alert.alert(
      'Hapus Karyawan',
      `Hapus profil karyawan ${employee.name}?\n\nProfil akan dihapus permanen dan tidak bisa login lagi.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await employeeRepo.remove(employee.id);
              await refresh();
              Alert.alert('Berhasil', `${employee.name} berhasil dihapus.`);
            } catch {
              Alert.alert('Gagal', 'Gagal menghapus karyawan. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  if (!isOwner) {
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
            <Text style={styles.title}>Karyawan</Text>
            <Text style={styles.subtitle}>Manajemen karyawan warung</Text>
          </View>
        </View>
        <View style={styles.restricted}>
          <View style={styles.restrictedIcon}>
            <MaterialCommunityIcons name="lock-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.restrictedTitle}>Akses Terbatas</Text>
          <Text style={styles.restrictedSubtitle}>
            Hanya profil Pemilik yang dapat mengelola data karyawan.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Karyawan</Text>
          <Text style={styles.subtitle}>Manajemen karyawan warung</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah karyawan"
          onPress={() => {
            setEditing(null);
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.banner}>
            <MaterialCommunityIcons name="crown-outline" size={16} color="#D97706" />
            <Text style={styles.bannerText}>
              Kamu login sebagai <Text style={styles.bannerStrong}>{cashier?.name}</Text> (
              {roleOptions[cashier?.role ?? 'kasir'].label}) — akses penuh untuk mengelola
              karyawan.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="account-multiple-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Belum ada karyawan</Text>
            <Text style={styles.emptySubtitle}>Ketuk tombol + di pojok kanan atas untuk menambahkan karyawan.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = roleMeta[item.role];
          return (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: meta.tint }]}>
                <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardRole}>{roleOptions[item.role].description}</Text>
              </View>
              <View style={[styles.roleChip, { backgroundColor: meta.tint }]}>
                <Text style={[styles.roleChipText, { color: meta.color }]}>
                  {roleOptions[item.role].label}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ubah karyawan ${item.name}`}
                onPress={() => {
                  setEditing(item);
                  setModalVisible(true);
                }}
                style={styles.editButton}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textMuted} />
              </Pressable>
              {item.role !== 'pemilik' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus karyawan ${item.name}`}
                  onPress={() => handleDelete(item)}
                  style={[styles.editButton, styles.deleteButton]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                </Pressable>
              )}
            </View>
          );
        }}
      />

      <AddKaryawanModal
        visible={modalVisible}
        editing={editing}
        onClose={() => {
          setModalVisible(false);
          setEditing(null);
        }}
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
    paddingBottom: 8,
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  bannerStrong: {
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardRole: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  restricted: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  restrictedIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  restrictedSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
});
