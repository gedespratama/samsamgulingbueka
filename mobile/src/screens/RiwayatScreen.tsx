import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import FilterChips from '../components/ui/FilterChips';
import EmptyState from '../components/ui/EmptyState';
import { useSync } from '../context/SyncContext';
import { useCashier } from '../context/CashierContext';
import { orderRepo } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import { paymentMethodMeta, type Transaction } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import { shareReceiptPdf } from '../utils/receiptPdf';
import { useBlurOnClose } from '../utils/blur';

type RangeKey = 'semua' | 'hari_ini' | 'kemarin' | '7_hari';

const rangeOptions = [
  { key: 'semua', label: 'Semua' },
  { key: 'hari_ini', label: 'Hari Ini' },
  { key: 'kemarin', label: 'Kemarin' },
  { key: '7_hari', label: '7 Hari Terakhir' },
] as { key: RangeKey; label: string }[];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export default function RiwayatScreen() {
  const { pendingIds } = useSync();
  const { data: allTransactions, loading, refresh } = useDbList(orderRepo.getAll);
  const [range, setRange] = useState<RangeKey>('semua');
  const [selected, setSelected] = useState<Transaction | null>(null);

  useBlurOnClose(selected !== null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const transactions = useMemo(() => {
    const now = new Date();
    return allTransactions.filter((t) => {
      const date = new Date(t.createdAt);
      if (range === 'hari_ini') return isSameDay(date, now);
      if (range === 'kemarin') return isSameDay(date, new Date(now.getTime() - 86_400_000));
      if (range === '7_hari') return now.getTime() - date.getTime() <= 7 * 86_400_000;
      return true;
    });
  }, [allTransactions, range]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Penjualan</Text>
        <Text style={styles.subtitle}>{transactions.length} transaksi ditemukan</Text>
      </View>

      <View style={styles.chipsRow}>
        <FilterChips options={rangeOptions} selected={range} onSelect={setRange} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <EmptyState icon="receipt-text-outline" title="Memuat riwayat..." />
          ) : (
            <EmptyState
              icon="receipt-text-outline"
              title="Tidak ada transaksi"
              subtitle="Tidak ada transaksi pada rentang tanggal ini."
            />
          )
        }
        renderItem={({ item }) => {
          const meta = paymentMethodMeta[item.paymentMethod];
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(item)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={styles.cardTextArea}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardId, item.voided && styles.cardIdVoided]}>{item.id}</Text>
                    {item.voided && (
                      <View style={styles.voidBadge}>
                        <MaterialCommunityIcons name="cancel" size={11} color={colors.danger} />
                        <Text style={styles.voidBadgeText}>Dibatalkan</Text>
                      </View>
                    )}
                    {!item.voided && pendingIds.includes(item.id) && (
                      <View style={styles.syncBadge}>
                        <MaterialCommunityIcons name="cloud-off-outline" size={11} color={colors.warning} />
                        <Text style={styles.syncBadgeText}>Menunggu Sinkron</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardMeta}>
                    {formatTime(item.createdAt)} - {formatDate(item.createdAt)} -{' '}
                    {item.orderType === 'dine_in' ? `Meja ${item.tableNumber}` : 'Takeaway'}
                  </Text>
                </View>
                <Text style={[styles.cardTotal, item.voided && styles.cardTotalVoided]}>
                  {formatRupiah(item.totalAmount)}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} onVoided={refresh} />
    </SafeAreaView>
  );
}

function TransactionDetailModal({ transaction, onClose, onVoided }: { transaction: Transaction | null; onClose: () => void; onVoided: () => void }) {
  const { cashier } = useCashier();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!transaction) return;
    setDownloading(true);
    try {
      await shareReceiptPdf({
        orderId: transaction.id,
        createdAt: transaction.createdAt,
        orderType: transaction.orderType,
        tableNumber: transaction.tableNumber,
        items: transaction.items.map((i) => ({
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          variant: i.variant,
          addons: i.addons,
          note: '',
        })),
        subtotal: transaction.totalAmount,
        total: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod,
        transactionType: transaction.transactionType,
        cashierName: cashier?.name,
      });
    } catch {
      Alert.alert('Gagal', 'Gagal membuat PDF struk. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  const handleVoid = () => {
    if (!transaction) return;
    Alert.alert(
      'Void Transaksi',
      `Batalkan transaksi ${transaction.id} sebesar ${formatRupiah(transaction.totalAmount)}?\n\nTransaksi yang dibatalkan tidak akan dihitung dalam laporan penjualan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderRepo.void(transaction.id);
              onClose();
              onVoided();
            } catch {
              Alert.alert('Gagal', 'Gagal membatalkan transaksi. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={transaction !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityRole="button" />
      <View style={styles.sheet}>
        {transaction && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{transaction.id}</Text>
                <Text style={styles.sheetMeta}>
                  {formatDate(transaction.createdAt)} - {formatTime(transaction.createdAt)} -{' '}
                  {paymentMethodMeta[transaction.paymentMethod].label}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={onClose}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {transaction.voided && (
              <View style={styles.voidBanner}>
                <MaterialCommunityIcons name="cancel" size={16} color={colors.danger} />
                <Text style={styles.voidBannerText}>Transaksi ini telah dibatalkan (void)</Text>
              </View>
            )}

            <View style={styles.infoCard}>
              <InfoRow label="Tipe Pesanan" value={transaction.orderType === 'dine_in' ? `Dine-in (Meja ${transaction.tableNumber})` : 'Takeaway'} />
              <InfoRow label="Metode" value={paymentMethodMeta[transaction.paymentMethod].label} />
              <InfoRow label="Jenis Transaksi" value={transaction.transactionType === 'offline' ? 'Offline (Tunai)' : 'Online'} />
              <InfoRow label="Sinkronisasi" value={transaction.voided ? 'Tidak dikirim (void)' : transaction.syncStatus === 'synced' ? 'Tersinkron' : 'Menunggu Sinkronisasi'} />
              <InfoRow label="Status" value={transaction.voided ? 'Dibatalkan' : 'Selesai'} />
            </View>

            <Text style={styles.sectionLabel}>Item Pesanan</Text>
            {transaction.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemName}>
                    {item.qty}x {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>{formatRupiah(item.unitPrice * item.qty)}</Text>
                </View>
                {item.variant && <Text style={styles.itemMeta}>{item.variant}</Text>}
                {item.addons.length > 0 && (
                  <Text style={styles.itemMeta}>{item.addons.map((a) => `+ ${a}`).join('  ')}</Text>
                )}
              </View>
            ))}

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatRupiah(transaction.totalAmount)}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={downloading || transaction.voided}
              onPress={handleDownload}
              style={[styles.downloadButton, (downloading || transaction.voided) && styles.downloadButtonDisabled]}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialCommunityIcons name="file-pdf-box" size={16} color={colors.white} />
              )}
              <Text style={styles.downloadButtonText}>
                {downloading ? 'Membuat PDF...' : 'Unduh PDF Struk'}
              </Text>
            </Pressable>

            {!transaction.voided && (
              <Pressable
                accessibilityRole="button"
                onPress={handleVoid}
                style={styles.voidButton}
              >
                <MaterialCommunityIcons name="cancel" size={16} color={colors.danger} />
                <Text style={styles.voidButtonText}>Void Transaksi</Text>
              </Pressable>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
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
  chipsRow: {
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cardIdVoided: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  voidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  voidBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.danger,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningSoft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  syncBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.warning,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  cardTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  cardTotalVoided: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  voidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  voidBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  voidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  voidButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,27,51,0.45)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sheetMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 16,
  },
  downloadButtonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
