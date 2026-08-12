import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '../components/ui/EmptyState';
import QuantityStepper from '../components/ui/QuantityStepper';
import { useCart } from '../context/CartContext';
import { useCashier } from '../context/CashierContext';
import { usePrinter } from '../context/PrinterContext';
import { orderRepo, syncRepo } from '../db/repositories';
import { paymentMethodMeta, type PaymentMethodKey, type Transaction } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import { shareReceiptPdf } from '../utils/receiptPdf';
import { useBlurOnClose } from '../utils/blur';
import type { RootStackParamList } from '../navigation/types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const methodIcon: Record<PaymentMethodKey, IconName> = {
  tunai: 'cash',
  qris: 'qrcode-scan',
  transfer: 'bank-transfer',
  hutang: 'account-cash',
};

export default function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    items,
    subtotal,
    orderType,
    tableNumber,
    updateQty,
    removeItem,
    clearCart,
    setPaidOrder,
  } = useCart();
  const [method, setMethod] = useState<PaymentMethodKey>('tunai');
  const [cashPaid, setCashPaid] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [printing, setPrinting] = useState(false);
  const { status: printerStatus } = usePrinter();
  const { cashier } = useCashier();

  useBlurOnClose(successVisible);

  const paidAmount = method === 'tunai' ? (Number(cashPaid) || 0) : subtotal;
  const change = Math.max(0, paidAmount - subtotal);

  const handlePay = async () => {
    const id = `TRX-${Date.now().toString().slice(-4)}`;
    const transaction: Transaction = {
      id,
      orderType,
      tableNumber: tableNumber ? Number(tableNumber) : null,
      items: items.map((i) => ({
        menuId: i.menuId,
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        variant: i.variant,
        addons: i.addons.map((a) => a.name),
      })),
      totalAmount: subtotal,
      paymentMethod: method,
      transactionType: 'offline',
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    try {
      await orderRepo.create(transaction);
      await syncRepo.enqueue('order', id);
    } catch {
      Alert.alert('Gagal', 'Gagal menyimpan transaksi. Silakan coba lagi.');
      return;
    }
    setOrderId(id);
    setPaidOrder({ total: subtotal, method, orderType });
    setSuccessVisible(true);
  };

  const handlePrintReceipt = async () => {
    setPrinting(true);
    try {
      await shareReceiptPdf({
        orderId,
        createdAt: new Date().toISOString(),
        orderType,
        tableNumber: tableNumber ? Number(tableNumber) : null,
        items: items.map((i) => ({
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          variant: i.variant,
          addons: i.addons.map((a) => a.name),
          note: i.note,
        })),
        subtotal,
        total: subtotal,
        paymentMethod: method,
        transactionType: 'offline',
        paidAmount,
        cashierName: cashier?.name,
      });
    } catch {
      Alert.alert('Gagal', 'Gagal membuat PDF struk. Silakan coba lagi.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDone = () => {
    setSuccessVisible(false);
    clearCart();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Keranjang</Text>
        <Text style={styles.subtitle}>Periksa pesanan sebelum dibayar</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="cart-off"
            title="Keranjang kosong"
            subtitle="Belum ada pesanan. Pilih menu di layar Kasir terlebih dahulu."
            actionLabel="Pilih Menu di Kasir"
            onAction={() => navigation.navigate('Kasir')}
          />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <View key={item.key} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTextArea}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatRupiah(item.unitPrice)}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Hapus item"
                    onPress={() => removeItem(item.key)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
                {item.variant && (
                  <Text style={styles.itemMeta}>{item.variant}</Text>
                )}
                {item.addons.length > 0 && (
                  <Text style={styles.itemMeta}>
                    {item.addons.map((a) => `+ ${a.name} (${formatRupiah(a.price)})`).join('  ')}
                  </Text>
                )}
                {item.note ? <Text style={styles.itemNote}>Catatan: {item.note}</Text> : null}
                <View style={styles.itemFooter}>
                  <QuantityStepper value={item.qty} onChange={(q) => updateQty(item.key, q)} size="sm" />
                  <Text style={styles.itemSubtotal}>{formatRupiah(item.unitPrice * item.qty)}</Text>
                </View>
              </View>
            ))}

            <View style={styles.typeCard}>
              <Text style={styles.sectionLabel}>Tipe Pesanan</Text>
              <View style={styles.typeRow}>
                <View style={[styles.typeBadge, orderType === 'dine_in' && styles.typeBadgeActive]}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={15} color={orderType === 'dine_in' ? colors.white : colors.textMuted} />
                  <Text style={[styles.typeBadgeText, orderType === 'dine_in' && styles.typeBadgeTextActive]}>Dine-in</Text>
                </View>
                <View style={[styles.typeBadge, orderType === 'takeaway' && styles.typeBadgeActive]}>
                  <MaterialCommunityIcons name="shopping-outline" size={15} color={orderType === 'takeaway' ? colors.white : colors.textMuted} />
                  <Text style={[styles.typeBadgeText, orderType === 'takeaway' && styles.typeBadgeTextActive]}>Takeaway</Text>
                </View>
              </View>
            </View>

            <View style={styles.methodCard}>
              <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
              <View style={styles.methodGrid}>
                {(Object.keys(methodIcon) as PaymentMethodKey[]).map((key) => {
                  const selected = method === key;
                  const meta = paymentMethodMeta[key];
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setMethod(key)}
                      style={[styles.methodButton, selected && styles.methodButtonSelected]}
                    >
                      <View style={[styles.methodIconWrap, { backgroundColor: selected ? meta.color : colors.background }]}>
                        <MaterialCommunityIcons name={meta.icon} size={18} color={selected ? colors.white : colors.textMuted} />
                      </View>
                      <Text style={[styles.methodText, selected && styles.methodTextSelected]}>
                        {meta.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {method === 'tunai' && (
                <View style={styles.cashSection}>
                  <Text style={styles.sectionLabel}>Uang Diterima</Text>
                  <View style={styles.cashRow}>
                    <TextInput
                      value={cashPaid ? Number(cashPaid).toLocaleString('id-ID') : ''}
                      onChangeText={(t) => setCashPaid(t.replace(/[^0-9]/g, '').slice(0, 9))}
                      placeholder="Contoh: 50.000"
                      placeholderTextColor="#9AA8C2"
                      keyboardType="number-pad"
                      style={styles.cashInput}
                    />
                    <View style={styles.changeBox}>
                      <Text style={styles.changeLabel}>Kembalian</Text>
                      <Text style={styles.changeValue}>{formatRupiah(change)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelTotal}>Total</Text>
                <Text style={styles.summaryValueTotal}>{formatRupiah(subtotal)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <Text style={styles.printerStatus}>
              Status Printer:{' '}
              <Text
                style={[
                  styles.printerStatusStrong,
                  { color: printerStatus === 'connected' ? colors.success : '#9AA8C2' },
                ]}
              >
                {printerStatus === 'connected'
                  ? 'Terkoneksi (Bluetooth)'
                  : printerStatus === 'connecting'
                    ? 'Menghubungkan...'
                    : 'Tidak Terkoneksi'}
              </Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handlePay}
              style={({ pressed }) => [styles.payButton, pressed && styles.payButtonPressed]}
            >
              <MaterialCommunityIcons name="printer-outline" size={18} color={colors.white} />
              <Text style={styles.payButtonText}>BAYAR & CETAK STRUK</Text>
            </Pressable>
          </View>
        </>
      )}

      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={() => setSuccessVisible(false)}>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="check" size={36} color={colors.white} />
            </View>
            <Text style={styles.successTitle}>Pembayaran Berhasil</Text>
            <Text style={styles.successTotal}>{formatRupiah(subtotal)}</Text>
            <Text style={styles.successMeta}>
              {paymentMethodMeta[method].label} - {orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={printing}
              onPress={handlePrintReceipt}
              style={[styles.successButton, styles.successButtonPrimary, printing && styles.successButtonDisabled]}
            >
              {printing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialCommunityIcons name="file-pdf-box" size={16} color={colors.white} />
              )}
              <Text style={styles.successButtonText}>
                {printing ? 'Membuat PDF...' : 'Cetak & Unduh PDF Struk'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleDone}
              style={[styles.successButton, styles.successButtonSecondary]}
            >
              <Text style={styles.successButtonTextSecondary}>Selesai</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingBottom: 8,
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
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemTextArea: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  itemNote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  typeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typeBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeBadgeTextActive: {
    color: colors.white,
  },
  methodCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: '48.5%',
  },
  methodButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  methodIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  methodTextSelected: {
    color: colors.primary,
  },
  cashSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  cashRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cashInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  changeBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  changeLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  summaryLabelTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  summaryValueTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  printerStatus: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  printerStatusStrong: {
    color: colors.success,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  payButtonPressed: {
    opacity: 0.85,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,27,51,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 14,
  },
  successTotal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  successMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 10,
    alignSelf: 'stretch',
  },
  successButtonPrimary: {
    backgroundColor: colors.primary,
    marginTop: 18,
  },
  successButtonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  successButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  successButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
