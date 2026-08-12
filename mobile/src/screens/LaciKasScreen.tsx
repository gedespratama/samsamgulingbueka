import { useCallback, useEffect, useState } from 'react';
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
import EmptyState from '../components/ui/EmptyState';
import { cashRecordRepo, shiftRepo, type ShiftHistoryEntry } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import { useBlurOnClose } from '../utils/blur';
import type { RootStackParamList } from '../navigation/types';

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

const formatTimeHM = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatDuration = (fromIso: string, now: number) => {
  const start = new Date(fromIso).getTime();
  if (Number.isNaN(start)) return '-';
  const diffMs = Math.max(0, now - start);
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
};

export default function LaciKasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: records, refresh } = useDbList(cashRecordRepo.getAll);
  const { data: shifts, loading: shiftsLoading, refresh: refreshShift } = useDbList(() =>
    shiftRepo.getActive().then((s) => (s ? [s] : []))
  );
  const { data: history, refresh: refreshHistory } = useDbList(shiftRepo.getHistory);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [openBalance, setOpenBalance] = useState('');
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeBalance, setCloseBalance] = useState('');
  const [now, setNow] = useState(Date.now());
  const [promptVisible, setPromptVisible] = useState(false);

  useBlurOnClose(modalVisible);
  useBlurOnClose(openModalVisible);
  useBlurOnClose(closeModalVisible);
  useBlurOnClose(promptVisible);

  useEffect(() => {
    if (!shiftsLoading && shifts.length === 0) {
      setPromptVisible(true);
    }
  }, [shiftsLoading, shifts.length]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshShift();
      refreshHistory();
    }, [refresh, refreshShift, refreshHistory])
  );

  useEffect(() => {
    if (shifts.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [shifts.length]);

  const activeShift = shifts[0] ?? null;
  const openingBalance = activeShift?.openingBalance ?? 0;
  const shiftRecords = activeShift ? records.filter((r) => r.shiftId === activeShift.id) : [];
  const cashIn = shiftRecords.filter((r) => r.type === 'masuk').reduce((s, r) => s + r.amount, 0);
  const cashOut = shiftRecords.filter((r) => r.type === 'keluar').reduce((s, r) => s + r.amount, 0);
  const balance = openingBalance + cashIn - cashOut;

  const canSave = Number(amount) > 0;
  const canOpen = Number(openBalance) > 0;
  const canClose = closeBalance !== '';

  const handleOpenShift = async () => {
    if (!canOpen) return;
    const balanceNum = Number(openBalance);
    await shiftRepo.open(balanceNum);
    await refreshShift();
    setOpenModalVisible(false);
    Alert.alert('Berhasil', `Shift dibuka dengan saldo awal ${formatRupiah(balanceNum)}.`);
  };

  const handleCloseShift = () => {
    setCloseBalance('');
    setCloseModalVisible(true);
  };

  const handleConfirmClose = async () => {
    if (!canClose || !activeShift) return;
    const actual = Number(closeBalance);
    try {
      await cashRecordRepo.create(
        {
          type: 'shift',
          title: 'Saldo tutup shift',
          amount: actual,
          createdAt: new Date().toISOString(),
        },
        `cr-${Date.now()}`,
        activeShift.id
      );
      await shiftRepo.close();
      await Promise.all([refresh(), refreshShift(), refreshHistory()]);
      setCloseModalVisible(false);
      const difference = actual - balance;
      if (difference === 0) {
        Alert.alert('Berhasil', 'Shift ditutup. Saldo akhir seimbang dengan catatan transaksi.');
      } else {
        Alert.alert(
          'Shift Ditutup',
          `Saldo akhir tercatat ${formatRupiah(actual)} dengan selisih ${formatRupiah(difference)}.`
        );
      }
    } catch {
      Alert.alert('Gagal', 'Gagal menutup shift. Silakan coba lagi.');
    }
  };

  const handleDeposit = async () => {
    if (!canSave) return;
    const amountNum = Number(amount);
    await cashRecordRepo.create(
      {
        type: 'keluar',
        title: note.trim() || 'Setoran kas',
        amount: amountNum,
        createdAt: new Date().toISOString(),
      },
      `cr-${Date.now()}`,
      activeShift?.id ?? null
    );
    await refresh();
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

      {activeShift ? (
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeaderRow}>
            <View style={styles.shiftBadge}>
              <View style={styles.shiftDot} />
              <Text style={styles.shiftBadgeText}>Shift Aktif</Text>
            </View>
            <Text style={styles.shiftDuration}>{formatDuration(activeShift.openedAt, now)}</Text>
          </View>
          <View style={styles.shiftInfoRow}>
            <View style={styles.shiftInfoItem}>
              <Text style={styles.shiftInfoLabel}>Dibuka</Text>
              <Text style={styles.shiftInfoValue}>{formatTimeHM(activeShift.openedAt)}</Text>
            </View>
            <View style={styles.shiftInfoDivider} />
            <View style={styles.shiftInfoItem}>
              <Text style={styles.shiftInfoLabel}>Saldo Awal</Text>
              <Text style={styles.shiftInfoValue}>{formatRupiah(activeShift.openingBalance)}</Text>
            </View>
            <View style={styles.shiftInfoDivider} />
            <View style={styles.shiftInfoItem}>
              <Text style={styles.shiftInfoLabel}>Saldo Saat Ini</Text>
              <Text style={[styles.shiftInfoValue, styles.shiftInfoValueBold]}>
                {formatRupiah(balance)}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleCloseShift}
            style={styles.closeShiftButton}
          >
            <MaterialCommunityIcons name="logout" size={14} color={colors.white} />
            <Text style={styles.closeShiftButtonText}>Tutup Shift</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setOpenBalance('');
            setOpenModalVisible(true);
          }}
          style={styles.noShiftCard}
        >
          <MaterialCommunityIcons name="clock-start" size={22} color={colors.primary} />
          <View style={styles.noShiftTextArea}>
            <Text style={styles.noShiftTitle}>Belum Ada Shift Aktif</Text>
            <Text style={styles.noShiftSubtitle}>Buka shift untuk mencatat saldo awal kas</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      )}

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

      <Text style={styles.sectionTitle}>Riwayat Shift</Text>
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <EmptyState icon="calendar-clock-outline" title="Belum ada riwayat shift" />
        ) : (
          history.map((entry) => {
            const hasActual = entry.actualBalance !== null;
            const balanced = hasActual && entry.difference === 0;
            return (
              <View key={entry.id} style={styles.shiftHistoryCard}>
                <View style={styles.shiftHistoryHeader}>
                  <View style={styles.shiftHistoryIcon}>
                    <MaterialCommunityIcons name="clock-outline" size={15} color={colors.primary} />
                  </View>
                  <Text style={styles.shiftHistoryDate}>{formatDateTime(entry.openedAt)}</Text>
                  {hasActual && (
                    <View
                      style={[
                        styles.statusChip,
                        balanced ? styles.statusChipOk : styles.statusChipDiff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          balanced ? styles.statusChipTextOk : styles.statusChipTextDiff,
                        ]}
                      >
                        {balanced ? 'Seimbang' : 'Selisih'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.shiftHistoryRow}>
                  <Text style={styles.shiftHistoryLabel}>Saldo Awal</Text>
                  <Text style={styles.shiftHistoryValue}>{formatRupiah(entry.openingBalance)}</Text>
                </View>
                <View style={styles.shiftHistoryRow}>
                  <Text style={styles.shiftHistoryLabel}>Saldo Aktual</Text>
                  <Text style={styles.shiftHistoryValue}>
                    {hasActual ? formatRupiah(entry.actualBalance as number) : '-'}
                  </Text>
                </View>
                <View style={styles.shiftHistoryRow}>
                  <Text style={styles.shiftHistoryLabel}>Selisih</Text>
                  <Text
                    style={[
                      styles.shiftHistoryValue,
                      entry.difference !== null &&
                        entry.difference !== 0 &&
                        styles.differenceText,
                    ]}
                  >
                    {entry.difference !== null ? formatRupiah(entry.difference) : '-'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptVisible(false)}
      >
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <View style={styles.promptIcon}>
              <MaterialCommunityIcons name="cash-register" size={32} color={colors.primary} />
            </View>
            <Text style={styles.promptTitle}>Kasir Belum Dibuka</Text>
            <Text style={styles.promptSubtitle}>
              Buka kasir sekarang untuk mencatat saldo awal laci kas dan mulai melayani transaksi.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPromptVisible(false);
                setOpenBalance('');
                setOpenModalVisible(true);
              }}
              style={styles.promptButton}
            >
              <MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.white} />
              <Text style={styles.promptButtonText}>Buka Kasir Sekarang</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              onPress={() => setPromptVisible(false)}
              style={styles.promptDismiss}
            >
              <Text style={styles.promptDismissText}>Nanti Saja</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={openModalVisible} transparent animationType="slide" onRequestClose={() => setOpenModalVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setOpenModalVisible(false)} accessibilityRole="button" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Buka Shift</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={() => setOpenModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.label}>Saldo Awal Kas (Rp)</Text>
            <TextInput
              value={openBalance ? Number(openBalance).toLocaleString('id-ID') : ''}
              onChangeText={(t) => setOpenBalance(t.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="500.000"
              placeholderTextColor="#9AA8C2"
              keyboardType="number-pad"
              style={styles.input}
            />
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpenModalVisible(false)}
                style={[styles.button, styles.buttonSecondary]}
              >
                <Text style={styles.buttonSecondaryText}>Batal</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!canOpen}
                onPress={handleOpenShift}
                style={[styles.button, styles.buttonPrimary, !canOpen && styles.buttonDisabled]}
              >
                <Text style={styles.buttonPrimaryText}>Buka Shift</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={closeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCloseModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setCloseModalVisible(false)} accessibilityRole="button" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Tutup Shift</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={() => setCloseModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.closeInfoBox}>
              <View style={styles.closeInfoRow}>
                <Text style={styles.closeInfoLabel}>Saldo Sesuai Catatan</Text>
                <Text style={styles.closeInfoValue}>{formatRupiah(balance)}</Text>
              </View>
              {closeBalance !== '' && (
                <View style={styles.closeInfoRow}>
                  <Text style={styles.closeInfoLabel}>Selisih</Text>
                  <Text
                    style={[
                      styles.closeInfoValue,
                      Number(closeBalance) - balance !== 0 && styles.differenceText,
                    ]}
                  >
                    {formatRupiah(Number(closeBalance) - balance)}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.label}>Saldo Akhir (Rp)</Text>
            <TextInput
              value={closeBalance ? Number(closeBalance).toLocaleString('id-ID') : ''}
              onChangeText={(t) => setCloseBalance(t.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="0"
              placeholderTextColor="#9AA8C2"
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.hint}>
              Masukkan saldo yang benar-benar ada di laci saat ini. Selisih akan tercatat di riwayat shift.
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCloseModalVisible(false)}
                style={[styles.button, styles.buttonSecondary]}
              >
                <Text style={styles.buttonSecondaryText}>Batal</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!canClose}
                onPress={handleConfirmClose}
                style={[styles.button, styles.buttonPrimary, !canClose && styles.buttonDisabled]}
              >
                <Text style={styles.buttonPrimaryText}>Tutup Shift</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
              value={amount ? Number(amount).toLocaleString('id-ID') : ''}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="200.000"
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
  shiftCard: {
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 16,
  },
  shiftHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  shiftDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  shiftBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  shiftDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  shiftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  shiftInfoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  shiftInfoDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shiftInfoLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  shiftInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  shiftInfoValueBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  closeShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  closeShiftButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  noShiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  noShiftTextArea: {
    flex: 1,
  },
  noShiftTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  noShiftSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
  shiftHistoryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  shiftHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shiftHistoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftHistoryDate: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipOk: {
    backgroundColor: colors.successSoft,
  },
  statusChipDiff: {
    backgroundColor: colors.warningSoft,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusChipTextOk: {
    color: colors.success,
  },
  statusChipTextDiff: {
    color: colors.warning,
  },
  shiftHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  shiftHistoryLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  shiftHistoryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  differenceText: {
    color: colors.warning,
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
  promptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,27,51,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  promptCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  promptIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  promptSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 20,
  },
  promptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  promptDismiss: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  promptDismissText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
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
  closeInfoBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  closeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  closeInfoLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  closeInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
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
