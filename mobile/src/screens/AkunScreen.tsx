import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePrinter } from '../context/PrinterContext';
import { useSync } from '../context/SyncContext';
import { useCashier } from '../context/CashierContext';
import { roleOptions, type EmployeeRole } from '../data/mock';
import { colors } from '../theme';
import { timeAgo } from '../utils/time';
import type { RootStackParamList } from '../navigation/types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const roleMeta: Record<EmployeeRole, { icon: IconName; tint: string; color: string }> = {
  kasir: { icon: 'cash-register', tint: colors.primarySoft, color: colors.primary },
  admin: { icon: 'clipboard-edit-outline', tint: '#EDE9FE', color: '#7C3AED' },
  pemilik: { icon: 'crown-outline', tint: '#FEF3C7', color: '#D97706' },
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

interface MenuRow {
  key: string;
  label: string;
  icon: IconName;
  tint: string;
  color: string;
  value?: string;
  route?: keyof RootStackParamList;
}

const menuRows: MenuRow[] = [
  { key: 'pin', label: 'Ganti PIN', icon: 'lock-outline', tint: colors.primarySoft, color: colors.primary },
  { key: 'printer', label: 'Koneksi Printer', icon: 'printer-outline', tint: '#E5F6EC', color: colors.success, route: 'Printer' },
  { key: 'sync', label: 'Sinkronisasi Data', icon: 'cloud-sync-outline', tint: '#EDE9FE', color: '#7C3AED', route: 'Sync' },
  { key: 'bantuan', label: 'Pusat Bantuan', icon: 'help-circle-outline', tint: '#FEF3C7', color: '#D97706' },
  { key: 'tentang', label: 'Tentang Aplikasi', icon: 'information-outline', tint: '#E0F2FE', color: '#0284C7', value: 'v1.0.0' },
];

export default function AkunScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status, device } = usePrinter();
  const { lastSyncedAt, pendingIds } = useSync();
  const { cashier, lock } = useCashier();

  const role = cashier?.role ?? 'kasir';
  const roleMetaValue = roleMeta[role];

  const handlePress = (row: MenuRow) => {
    if (row.route) {
      navigation.navigate(row.route);
      return;
    }
    Alert.alert(row.label, `Fitur ${row.label} segera hadir.`);
  };

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dan mengunci aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => lock() },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(cashier?.name ?? '') || 'KS'}</Text>
          </View>
          <View style={styles.profileTextArea}>
            <Text style={styles.profileName}>{cashier?.name ?? 'Kasir'}</Text>
            <Text style={styles.profileRole}>
              {roleOptions[role].label} - Samsam Guling Bu Eka
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleMetaValue.tint }]}>
            <MaterialCommunityIcons name={roleMetaValue.icon} size={14} color={roleMetaValue.color} />
            <Text style={[styles.roleBadgeText, { color: roleMetaValue.color }]}>
              {roleOptions[role].label}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pengaturan</Text>
        <View style={styles.menuCard}>
          {menuRows.map((row, index) => (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              onPress={() => handlePress(row)}
              style={[styles.menuRow, index < menuRows.length - 1 && styles.menuRowBorder]}
            >
              <View style={[styles.menuIcon, { backgroundColor: row.tint }]}>
                <MaterialCommunityIcons name={row.icon} size={19} color={row.color} />
              </View>
              <Text style={styles.menuLabel}>{row.label}</Text>
              {row.key === 'printer' ? (
                <Text style={[styles.menuValue, { color: status === 'connected' ? colors.success : '#9AA8C2' }]}>
                  {status === 'connected' ? device?.name ?? 'Terkoneksi' : status === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
                </Text>
              ) : row.key === 'sync' ? (
                <Text style={[styles.menuValue, { color: pendingIds.length > 0 ? '#D97706' : colors.textMuted }]}>
                  {pendingIds.length > 0
                    ? `${pendingIds.length} menunggu sinkron`
                    : lastSyncedAt
                      ? `Terakhir ${timeAgo(lastSyncedAt)}`
                      : 'Belum sinkron'}
                </Text>
              ) : row.value ? (
                <Text style={styles.menuValue}>{row.value}</Text>
              ) : null}
              <MaterialCommunityIcons name="chevron-right" size={18} color="#B8C7E8" />
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
        >
          <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>

        <Text style={styles.version}>Samsam Guling Bu Eka - v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
  },
  profileTextArea: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  profileRole: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  menuValue: {
    fontSize: 11,
    color: colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 16,
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9AA8C2',
    marginTop: 20,
  },
});
