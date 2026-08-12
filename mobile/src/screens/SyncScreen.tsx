import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '../components/ui/EmptyState';
import { useSync } from '../context/SyncContext';
import { orderRepo } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import { paymentMethodMeta, type Transaction } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import { timeAgo } from '../utils/time';
import type { RootStackParamList } from '../navigation/types';

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
};

export default function SyncScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const netInfo = useNetInfo();
  const { pendingIds, isSyncing, lastSyncedAt, autoSync, setAutoSync, syncNow } = useSync();
  const { data: allOrders, loading, refresh } = useDbList(orderRepo.getAll);
  const [syncing, setSyncing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const isOffline = netInfo.isConnected === false;
  const pendingTransactions: Transaction[] = allOrders.filter((t) => !t.voided && pendingIds.includes(t.id));

  const handleSync = async () => {
    if (isOffline) {
      Alert.alert('Tidak Ada Koneksi', 'Data tetap aman di perangkat dan akan disinkronkan otomatis saat internet kembali aktif.');
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
          <Text style={styles.title}>Sinkronisasi Data</Text>
          <Text style={styles.subtitle}>Offline-first: data aman tanpa internet</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isOffline && (
          <View style={styles.offlineBanner}>
            <MaterialCommunityIcons name="cloud-off-outline" size={18} color={colors.warning} />
            <Text style={styles.offlineBannerText}>
              Tidak ada koneksi internet. Transaksi baru tetap bisa dicatat dan akan disinkronkan otomatis saat online.
            </Text>
          </View>
        )}

        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: pendingIds.length > 0 ? '#FEF3C7' : colors.successSoft }]}>
            <MaterialCommunityIcons
              name={pendingIds.length > 0 ? 'cloud-upload-outline' : 'cloud-check-outline'}
              size={24}
              color={pendingIds.length > 0 ? '#D97706' : colors.success}
            />
          </View>
          <View style={styles.statusTextArea}>
            <Text style={styles.statusLabel}>Status Sinkronisasi</Text>
            <Text style={[styles.statusValue, { color: pendingIds.length > 0 ? '#D97706' : colors.success }]}>
              {pendingIds.length > 0 ? `${pendingIds.length} transaksi menunggu sinkron` : 'Semua data tersinkron'}
            </Text>
            <Text style={styles.statusMeta}>
              {lastSyncedAt ? `Terakhir sinkron: ${timeAgo(lastSyncedAt)}` : 'Belum pernah sinkron'}
            </Text>
          </View>
        </View>

        <View style={styles.autoRow}>
          <View style={styles.autoTextArea}>
            <Text style={styles.autoLabel}>Sinkronisasi Otomatis</Text>
            <Text style={styles.autoHint}>Kirim data otomatis saat koneksi internet kembali aktif</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {pendingTransactions.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Menunggu Sinkronisasi</Text>
            {pendingTransactions.map((t) => {
              const meta = paymentMethodMeta[t.paymentMethod];
              return (
                <View key={t.id} style={styles.card}>
                  <View style={styles.cardIcon}>
                    <MaterialCommunityIcons name="cloud-off-outline" size={18} color={colors.warning} />
                  </View>
                  <View style={styles.cardTextArea}>
                    <Text style={styles.cardId}>{t.id}</Text>
                    <Text style={styles.cardMeta}>
                      {formatTime(t.createdAt)} - {t.orderType === 'dine_in' ? `Meja ${t.tableNumber}` : 'Takeaway'} -{' '}
                      {meta.label}
                    </Text>
                  </View>
                  <Text style={styles.cardAmount}>{formatRupiah(t.totalAmount)}</Text>
                </View>
              );
            })}
          </>
        ) : (
          <View style={styles.syncedCard}>
            <EmptyState
              icon="cloud-check-outline"
              title="Semua data tersinkron"
              subtitle="Tidak ada transaksi yang menunggu untuk disinkronkan."
            />
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={isSyncing || syncing || pendingIds.length === 0}
          onPress={handleSync}
          style={[
            styles.syncButton,
            (isSyncing || syncing || pendingIds.length === 0) && styles.syncButtonDisabled,
          ]}
        >
          {isSyncing || syncing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialCommunityIcons name="cloud-sync-outline" size={18} color={colors.white} />
          )}
          <Text style={styles.syncButtonText}>
            {isSyncing || syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </Text>
        </Pressable>
      </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 28,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.warningSoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  statusMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  autoTextArea: {
    flex: 1,
  },
  autoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  autoHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: {
    flex: 1,
  },
  cardId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  syncedCard: {
    marginTop: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  syncButtonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
