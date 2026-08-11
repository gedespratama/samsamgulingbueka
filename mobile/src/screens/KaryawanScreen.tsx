import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AddKaryawanModal, { type NewEmployee } from '../components/AddKaryawanModal';
import { employeeSeed, roleOptions, type Employee, type EmployeeRole } from '../data/mock';
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
  const [employees, setEmployees] = useState<Employee[]>(employeeSeed);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSave = (data: NewEmployee) => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: data.name,
      role: data.role,
      pin: data.pin,
      active: true,
    };
    setEmployees((prev) => [...prev, newEmployee]);
    setModalVisible(false);
    Alert.alert('Berhasil', `${data.name} ditambahkan sebagai ${roleOptions[data.role].label}.`);
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
          <Text style={styles.title}>Karyawan</Text>
          <Text style={styles.subtitle}>Manajemen karyawan warung</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah karyawan"
          onPress={() => setModalVisible(true)}
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
              Kamu login sebagai <Text style={styles.bannerStrong}>Pemilik</Text> — akses penuh
              untuk mengelola karyawan.
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
            </View>
          );
        }}
      />

      <AddKaryawanModal
        visible={modalVisible}
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
