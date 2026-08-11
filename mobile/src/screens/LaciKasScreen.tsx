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
import { cashRecordsSeed, type CashRecord } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export default function LaciKasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [records, setRecords] = useState<CashRecord[]>(cashRecordsSeed);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const openingBalance = 500_000;
  const cashIn = records.filter((r) => r.type === 'masuk').reduce((s, r) => s + r.amount, 0);
  const cashOut = records.filter((r) => r.type === 'keluar').reduce((s, r) => s + r.amount, 0);
  const balance = openingBalance + cashIn - cashOut;

  const canSave = Number(amount) > 0;

  const handleDeposit = () => {
    if (!canSave) return;
    const amountNum = Number(amount);
    setRecords((prev) => [
      {
        id: `cr-${Date.now()}`,
        type: 'keluar',
        title: note.trim() || 'Setoran kas',
        amount: amountNum,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setModalVisible(false);
    Alert.alert('Berhasil', `Setoran ${formatRupiah(amountNum)} tercatat.`);
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
          <Text style={styles.title}>Laci Kas</Text>
          <Text style={styles.subtitle}>Pantau uang tunai di laci</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Setor kas"
          onPress={() => {
            setAmount('');
            setNote('');
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="bank-outline" size={22} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Kas</Text>
        <Text style={styles.balanceValue}>{formatRupiah(balance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Masuk</Text>
            <Text style={[styles.balanceItemValue, { color: colors.success }]}>
              +{formatRupiah(cashIn)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Keluar</Text>
            <Text style={[styles.balanceItemValue, { color: colors.danger }]}>
              -{formatRupiah(cashOut)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Kas</Text>
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {records.length === 0 ? (
          <EmptyState icon="cash-register" title="Belum ada catatan kas" />
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.card}>
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: record.type === 'masuk' ? colors.successSoft : '#FEE2E2' },
                ]}
              >
                <MaterialCommunityIcons
                  name={record.type === 'masuk' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={record.type === 'masuk' ? colors.success : colors.danger}
                />
              </View>
              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>{record.title}</Text>
                <Text style={styles.cardMeta}>{formatDateTime(record.createdAt)}</Text>
              </View>
              <Text
                style={[
                  styles.cardAmount,
                  { color: record.type === 'masuk' ? colors.success : colors.danger },
                ]}
              >
                {record.type === 'masuk' ? '+' : '-'}
                {formatRupiah(record.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} accessibilityRole="button" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Setor Kas</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.label}>Jumlah Setoran (Rp)</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="200000"
              placeholderTextColor="#9AA8C2"
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Contoh: setoran sore"
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
                onPress={handleDeposit}
                style={[styles.button, styles.buttonPrimary, !canSave && styles.buttonDisabled]}
              >
                <Text style={styles.buttonPrimaryText}>Setor</Text>
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
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 10,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  balanceItemValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginTop: 20,
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
