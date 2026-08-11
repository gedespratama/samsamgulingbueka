import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePrinter } from '../context/PrinterContext';
import { useSync } from '../context/SyncContext';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Row {
  key: string;
  label: string;
  subtitle: string;
  icon: IconName;
  tint: string;
  color: string;
}

const rows: Row[] = [
  { key: 'printer', label: 'Koneksi Printer Bluetooth', subtitle: 'Cari dan sambungkan printer struk', icon: 'printer-outline', tint: colors.primarySoft, color: colors.primary },
  { key: 'sync', label: 'Sinkronisasi Otomatis', subtitle: 'Kirim data offline saat online', icon: 'cloud-sync-outline', tint: '#EDE9FE', color: '#7C3AED' },
  { key: 'notif', label: 'Notifikasi Stok', subtitle: 'Peringatan stok menipis & kedaluwarsa', icon: 'bell-outline', tint: '#FEF3C7', color: '#D97706' },
  { key: 'tentang', label: 'Tentang Aplikasi', subtitle: 'Samsam Guling Bu Eka - v1.0.0', icon: 'information-outline', tint: '#E0F2FE', color: '#0284C7' },
];

export default function LainnyaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status, testPrint } = usePrinter();
  const { pendingIds, isSyncing, autoSync, setAutoSync, syncNow } = useSync();
  const netInfo = useNetInfo();
  const [printing, setPrinting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stockNotif, setStockNotif] = useState(true);

  const isConnected = status === 'connected';

  const handlePrinter = async () => {
    if (isConnected) {
      setPrinting(true);
      try {
        await testPrint();
      } catch {
        Alert.alert('Gagal', 'Gagal membuat struk uji coba. Coba lagi.');
      } finally {
        setPrinting(false);
      }
    } else {
      navigation.navigate('Printer');
    }
  };

  const handleSync = async () => {
    if (netInfo.isConnected === false) {
      Alert.alert('Tidak Ada Koneksi', 'Data tetap aman dan akan disinkronkan otomatis saat internet kembali aktif.');
      return;
    }
    setSyncing(true);
    try {
      const count = await syncNow();
      if (count > 0) {
        Alert.alert('Sinkronisasi Berhasil', `${count} transaksi berhasil disinkronkan ke server.`);
      }
    } finally {
      setSyncing(false);
    }
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
          <Text style={styles.title}>Lainnya</Text>
          <Text style={styles.subtitle}>Pengaturan aplikasi</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: isConnected ? colors.successSoft : '#E5EAF3' }]}>
            <MaterialCommunityIcons
              name={isConnected ? 'printer' : 'printer-off-outline'}
              size={22}
              color={isConnected ? colors.success : '#9AA8C2'}
            />
          </View>
          <View style={styles.statusTextArea}>
            <Text style={styles.statusLabel}>Status Printer</Text>
            <Text style={[styles.statusValue, { color: isConnected ? colors.success : '#9AA8C2' }]}>
              {isConnected ? 'Terkoneksi (Bluetooth)' : status === 'connecting' ? 'Menghubungkan...' : 'Tidak Terkoneksi'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={printing || status === 'connecting'}
            onPress={handlePrinter}
            style={styles.statusButton}
          >
            {printing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.statusButtonText}>{isConnected ? 'Uji Cetak' : 'Sambungkan'}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.menuCard}>
          <RowItem
            row={rows[1]}
            onPress={() => setAutoSync(!autoSync)}
            right={
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
          <RowItem
            row={rows[2]}
            onPress={() => setStockNotif((v) => !v)}
            right={
              <Switch
                value={stockNotif}
                onValueChange={setStockNotif}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
          <RowItem
            row={rows[3]}
            onPress={() => Alert.alert('Tentang', 'Samsam Guling Bu Eka v1.0.0 - POS Mobile offline-first.')}
          />
        </View>

        <View style={styles.syncCard}>
          <View
            style={[
              styles.syncIcon,
              { backgroundColor: pendingIds.length > 0 ? colors.warningSoft : colors.successSoft },
            ]}
          >
            <MaterialCommunityIcons
              name={pendingIds.length > 0 ? 'cloud-upload-outline' : 'cloud-check-outline'}
              size={22}
              color={pendingIds.length > 0 ? colors.warning : colors.success}
            />
          </View>
          <View style={styles.syncTextArea}>
            <Text style={styles.syncTitle}>Sinkronisasi Offline</Text>
            <Text style={styles.syncSubtitle}>
              {pendingIds.length > 0
                ? `${pendingIds.length} transaksi menunggu sinkronisasi.`
                : 'Semua transaksi offline sudah tersinkron.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={syncing || isSyncing || pendingIds.length === 0}
            onPress={handleSync}
            style={[styles.syncButton, (syncing || isSyncing || pendingIds.length === 0) && styles.syncButtonDisabled]}
          >
            {syncing || isSyncing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.syncButtonText}>Sinkron Sekarang</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RowItem({ row, onPress, right }: { row: Row; onPress: () => void; right?: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.menuRow}
    >
      <View style={[styles.menuIcon, { backgroundColor: row.tint }]}>
        <MaterialCommunityIcons name={row.icon} size={19} color={row.color} />
      </View>
      <View style={styles.menuTextArea}>
        <Text style={styles.menuLabel}>{row.label}</Text>
        <Text style={styles.menuSubtitle}>{row.subtitle}</Text>
      </View>
      {right}
    </Pressable>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 28,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextArea: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  statusButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
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
  menuTextArea: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  syncIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTextArea: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  syncSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  syncButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
});
