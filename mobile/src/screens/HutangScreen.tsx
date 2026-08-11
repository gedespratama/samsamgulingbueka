import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EmptyState from '../components/ui/EmptyState';
import {
  customerDebtsSeed,
  supplierDebtsSeed,
  type CustomerDebt,
  type SupplierDebt,
} from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type TabKey = 'pelanggan' | 'supplier';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(iso));

export default function HutangScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<TabKey>('pelanggan');
  const [customerDebts, setCustomerDebts] = useState<CustomerDebt[]>(customerDebtsSeed);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebt[]>(supplierDebtsSeed);
  const [addVisible, setAddVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');

  const customerUnpaid = customerDebts
    .filter((d) => d.status === 'unpaid')
    .reduce((sum, d) => sum + d.amount, 0);
  const supplierUnpaid = supplierDebts
    .filter((d) => d.status === 'unpaid')
    .reduce((sum, d) => sum + d.amount, 0);

  const openAdd = () => {
    setName('');
    setAmount('');
    setNote('');
    setDueDate('');
    setAddVisible(true);
  };

  const canSave = name.trim().length > 0 && Number(amount) > 0;

  const handleSave = () => {
    if (!canSave) return;
    const amountNum = Number(amount);
    if (tab === 'pelanggan') {
      setCustomerDebts((prev) => [
        {
          id: `cd-${Date.now()}`,
          customerName: name.trim(),
          amount: amountNum,
          note: note.trim(),
          status: 'unpaid',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      Alert.alert('Berhasil', `Hutang ${name.trim()} sebesar ${formatRupiah(amountNum)} tercatat.`);
    } else {
      setSupplierDebts((prev) => [
        {
          id: `sd-${Date.now()}`,
          supplierName: name.trim(),
          amount: amountNum,
          note: note.trim(),
          dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          status: 'unpaid',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      Alert.alert('Berhasil', `Hutang ke ${name.trim()} sebesar ${formatRupiah(amountNum)} tercatat.`);
    }
    setAddVisible(false);
  };

  const markCustomerPaid = (debt: CustomerDebt) => {
    Alert.alert('Tandai Lunas', `Lunasi hutang ${debt.customerName} sebesar ${formatRupiah(debt.amount)}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Lunas',
        onPress: () =>
          setCustomerDebts((prev) => prev.map((d) => (d.id === debt.id ? { ...d, status: 'paid' as const } : d))),
      },
    ]);
  };

  const markSupplierPaid = (debt: SupplierDebt) => {
    Alert.alert('Tandai Lunas', `Lunasi hutang ke ${debt.supplierName} sebesar ${formatRupiah(debt.amount)}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Lunas',
        onPress: () =>
          setSupplierDebts((prev) => prev.map((d) => (d.id === debt.id ? { ...d, status: 'paid' as const } : d))),
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
          <Text style={styles.title}>Hutang</Text>
          <Text style={styles.subtitle}>Catat hutang dua arah</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah hutang"
          onPress={openAdd}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab('pelanggan')}
          style={[styles.tabButton, tab === 'pelanggan' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === 'pelanggan' && styles.tabTextActive]}>
            Hutang Pelanggan
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab('supplier')}
          style={[styles.tabButton, tab === 'supplier' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === 'supplier' && styles.tabTextActive]}>
            Hutang ke Supplier
          </Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <MaterialCommunityIcons
            name={tab === 'pelanggan' ? 'account-cash' : 'truck-outline'}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.summaryTextArea}>
          <Text style={styles.summaryLabel}>
            {tab === 'pelanggan' ? 'Total Belum Dibayar Pelanggan' : 'Total Hutang ke Supplier'}
          </Text>
          <Text style={styles.summaryValue}>
            {formatRupiah(tab === 'pelanggan' ? customerUnpaid : supplierUnpaid)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {tab === 'pelanggan' ? (
          customerDebts.length === 0 ? (
            <EmptyState icon="account-cash" title="Belum ada hutang pelanggan" />
          ) : (
            customerDebts.map((debt) => {
              const unpaid = debt.status === 'unpaid';
              return (
                <View key={debt.id} style={[styles.card, !unpaid && styles.cardPaid]}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardAvatar}>
                      <MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.cardTextArea}>
                      <Text style={styles.cardName}>{debt.customerName}</Text>
                      <Text style={styles.cardMeta}>{formatDate(debt.createdAt)} - {debt.note || 'Tanpa catatan'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: unpaid ? '#FEE2E2' : colors.successSoft }]}>
                      <Text style={[styles.statusBadgeText, { color: unpaid ? colors.danger : colors.success }]}>
                        {unpaid ? 'Belum Lunas' : 'Lunas'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.cardAmount}>{formatRupiah(debt.amount)}</Text>
                    {unpaid && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => markCustomerPaid(debt)}
                        style={styles.payButton}
                      >
                        <Text style={styles.payButtonText}>Tandai Lunas</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : supplierDebts.length === 0 ? (
          <EmptyState icon="truck-outline" title="Belum ada hutang supplier" />
        ) : (
          supplierDebts.map((debt) => {
            const unpaid = debt.status === 'unpaid';
            return (
              <View key={debt.id} style={[styles.card, !unpaid && styles.cardPaid]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardAvatar}>
                    <MaterialCommunityIcons name="truck-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.cardTextArea}>
                    <Text style={styles.cardName}>{debt.supplierName}</Text>
                    <Text style={styles.cardMeta}>
                      Jatuh tempo {formatDate(debt.dueDate)} - {debt.note || 'Tanpa catatan'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: unpaid ? '#FEE2E2' : colors.successSoft }]}>
                    <Text style={[styles.statusBadgeText, { color: unpaid ? colors.danger : colors.success }]}>
                      {unpaid ? 'Belum Lunas' : 'Lunas'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.cardAmount}>{formatRupiah(debt.amount)}</Text>
                  {unpaid && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => markSupplierPaid(debt)}
                      style={styles.payButton}
                    >
                      <Text style={styles.payButtonText}>Tandai Lunas</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setAddVisible(false)} accessibilityRole="button" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {tab === 'pelanggan' ? 'Tambah Hutang Pelanggan' : 'Tambah Hutang Supplier'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={() => setAddVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.label}>Nama {tab === 'pelanggan' ? 'Pelanggan' : 'Supplier'}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={tab === 'pelanggan' ? 'Contoh: Pak Wayan' : 'Contoh: Penjual Babi Pak Gede'}
              placeholderTextColor="#9AA8C2"
              style={styles.input}
            />
            <Text style={styles.label}>Jumlah (Rp)</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="50000"
              placeholderTextColor="#9AA8C2"
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.label}>Catatan</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Contoh: pesanan dine-in meja 2"
              placeholderTextColor="#9AA8C2"
              style={styles.input}
            />
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAddVisible(false)}
                style={[styles.button, styles.buttonSecondary]}
              >
                <Text style={styles.buttonSecondaryText}>Batal</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!canSave}
                onPress={handleSave}
                style={[styles.button, styles.buttonPrimary, !canSave && styles.buttonDisabled]}
              >
                <Text style={styles.buttonPrimaryText}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 9,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.white,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextArea: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
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
  cardPaid: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: {
    flex: 1,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  payButton: {
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  payButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
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
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  buttonPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
