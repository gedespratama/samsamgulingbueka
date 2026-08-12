import { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FilterChips from '../components/ui/FilterChips';
import EmptyState from '../components/ui/EmptyState';
import RestrictedAccess from '../components/ui/RestrictedAccess';
import { cashRecordRepo } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import { useCashier } from '../context/CashierContext';
import type { CashRecord } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import { useBlurOnClose } from '../utils/blur';
import type { RootStackParamList } from '../navigation/types';

type TypeKey = 'semua' | 'masuk' | 'keluar';

const typeOptions = [
  { key: 'semua', label: 'Semua' },
  { key: 'masuk', label: 'Pemasukan' },
  { key: 'keluar', label: 'Pengeluaran' },
] as { key: TypeKey; label: string }[];

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function BukuKasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cashier } = useCashier();
  const { data: records, refresh } = useDbList(cashRecordRepo.getAll);
  const [typeFilter, setTypeFilter] = useState<TypeKey>('semua');
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<'masuk' | 'keluar'>('masuk');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useBlurOnClose(modalVisible);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filtered = useMemo(
    () => (typeFilter === 'semua' ? records : records.filter((r) => r.type === typeFilter)),
    [records, typeFilter]
  );

  if (cashier?.role === 'kasir') {
    return (
      <RestrictedAccess
        message="Hanya profil Pemilik dan Admin yang dapat mengakses buku kas."
        onBack={() => navigation.goBack()}
      />
    );
  }

  const balance = records.reduce(
    (s, r) => s + (r.type === 'masuk' ? r.amount : r.type === 'keluar' ? -r.amount : 0),
    0
  );

  const canSave = title.trim().length > 0 && Number(amount) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const amountNum = Number(amount);
    await cashRecordRepo.create(
      {
        type,
        title: title.trim(),
        amount: amountNum,
        createdAt: new Date().toISOString(),
      },
      `cr-${Date.now()}`
    );
    await refresh();
    setModalVisible(false);
    Alert.alert('Berhasil', `${type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} ${formatRupiah(amountNum)} tercatat.`);
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
          <Text style={styles.title}>Buku Kas</Text>
          <Text style={styles.subtitle}>Catat pemasukan & pengeluaran</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah catatan kas"
          onPress={() => {
            setType('masuk');
            setTitle('');
            setAmount('');
            setNote('');
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Buku Kas</Text>
        <Text style={[styles.balanceValue, { color: balance >= 0 ? colors.text : colors.danger }]}>
          {formatRupiah(balance)}
        </Text>
      </View>

      <View style={styles.chipsRow}>
        <FilterChips options={typeOptions} selected={typeFilter} onSelect={setTypeFilter} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="notebook-outline" title="Belum ada catatan" />
        ) : (
          filtered.map((record) => {
            const isShift = record.type === 'shift';
            const isMasuk = record.type === 'masuk';
            const icon = isShift ? 'clock-outline' : isMasuk ? 'arrow-bottom-left' : 'arrow-top-right';
            const tint = isShift ? '#E0F2FE' : isMasuk ? colors.successSoft : '#FEE2E2';
            const color = isShift ? '#0284C7' : isMasuk ? colors.success : colors.danger;
            return (
              <View key={record.id} style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: tint }]}>
                  <MaterialCommunityIcons name={icon} size={18} color={color} />
                </View>
                <View style={styles.cardTextArea}>
                  <Text style={styles.cardTitle}>{record.title}</Text>
                  <Text style={styles.cardMeta}>{formatDateTime(record.createdAt)}</Text>
                </View>
                <Text style={[styles.cardAmount, { color }]}>
                  {isShift ? '' : isMasuk ? '+' : '-'}
                  {formatRupiah(record.amount)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} accessibilityRole="button" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Tambah Catatan Kas</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.typeRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setType('masuk')}
                style={[styles.typeButton, type === 'masuk' && styles.typeButtonIn]}
              >
                <MaterialCommunityIcons
                  name="arrow-bottom-left"
                  size={16}
                  color={type === 'masuk' ? colors.white : colors.success}
                />
                <Text style={[styles.typeButtonText, type === 'masuk' && styles.typeButtonTextActive]}>
                  Pemasukan
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setType('keluar')}
                style={[styles.typeButton, type === 'keluar' && styles.typeButtonOut]}
              >
                <MaterialCommunityIcons
                  name="arrow-top-right"
                  size={16}
                  color={type === 'keluar' ? colors.white : colors.danger}
                />
                <Text style={[styles.typeButtonText, type === 'keluar' && styles.typeButtonTextActive]}>
                  Pengeluaran
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Judul</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Contoh: Beli daging babi"
              placeholderTextColor="#9AA8C2"
              style={styles.input}
            />
            <Text style={styles.label}>Jumlah (Rp)</Text>
            <TextInput
              value={amount ? Number(amount).toLocaleString('id-ID') : ''}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="100.000"
              placeholderTextColor="#9AA8C2"
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.label}>Keterangan (opsional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Catatan tambahan"
              placeholderTextColor="#9AA8C2"
              style={styles.input}
            />

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setModalVisible(false)}
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
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  chipsRow: {
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: {
    flex: 1,
  },
  cardTitle: {
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
    marginBottom: 10,
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 10,
  },
  typeButtonIn: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  typeButtonOut: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  typeButtonTextActive: {
    color: colors.white,
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
