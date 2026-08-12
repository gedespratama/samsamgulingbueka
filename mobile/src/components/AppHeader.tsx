import { useState } from 'react';
import {
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
import { colors } from '../theme';
import type { PrinterStatus } from '../context/PrinterContext';
import { useCashier } from '../context/CashierContext';
import { employeeRepo } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import { roleOptions, type Employee } from '../data/mock';
import { useBlurOnClose } from '../utils/blur';

interface Props {
  isPrinterConnected: boolean;
  printerStatus: PrinterStatus;
  onPressPrinter: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export default function AppHeader({ isPrinterConnected, printerStatus, onPressPrinter }: Props) {
  const { cashier, switchCashier } = useCashier();
  const { data: employees, refresh } = useDbList(employeeRepo.getAll);
  const [profileVisible, setProfileVisible] = useState(false);
  const [pinTarget, setPinTarget] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  useBlurOnClose(profileVisible);

  const statusColor =
    printerStatus === 'connecting' ? '#D97706' : isPrinterConnected ? colors.success : colors.danger;
  const statusText =
    printerStatus === 'connecting' ? 'Menghubungkan...' : isPrinterConnected ? 'Terkoneksi' : 'Terputus';
  const greeting = `${getGreeting()}, ${cashier?.name ?? 'Kasir'}`;

  const closeProfile = () => {
    setProfileVisible(false);
    setPinTarget(null);
    setPin('');
    setPinError(null);
  };

  const openProfile = () => {
    refresh();
    setPinTarget(null);
    setPin('');
    setPinError(null);
    setProfileVisible(true);
  };

  const handleSelectEmployee = (employee: Employee) => {
    setPinTarget(employee);
    setPin('');
    setPinError(null);
  };

  const handleVerifyPin = async () => {
    if (!pinTarget) return;
    if (pin.length < 4) {
      setPinError('PIN harus 4 digit.');
      return;
    }
    if (pinTarget.pin && pin === pinTarget.pin) {
      await switchCashier(pinTarget);
      closeProfile();
    } else {
      setPin('');
      setPinError('PIN salah. Silakan coba lagi.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandArea}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="storefront-outline" size={24} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.brand}>Samsam Guling Bu Eka</Text>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
      </View>

      <View style={styles.actionArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Status printer struk"
          onPress={onPressPrinter}
          style={styles.printerButton}
        >
          <MaterialCommunityIcons
            name={isPrinterConnected ? 'printer' : 'printer-off-outline'}
            size={22}
            color={colors.text}
          />
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ganti kasir"
          onPress={openProfile}
          style={styles.profileButton}
        >
          <Text style={styles.profileInitials}>{initials(cashier?.name ?? '') || 'KS'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>
      </View>

      <Modal
        visible={profileVisible}
        transparent
        animationType="slide"
        onRequestClose={closeProfile}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={closeProfile} accessibilityRole="button" />
          <View style={styles.sheet}>
            {pinTarget ? (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Masukkan PIN</Text>
                    <Text style={styles.sheetSubtitle}>
                      Verifikasi untuk berpindah sebagai {pinTarget.name}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tutup"
                    onPress={closeProfile}
                    style={styles.closeButton}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.pinTargetRow}>
                  <View style={styles.pinTargetAvatar}>
                    <Text style={styles.pinTargetInitials}>{initials(pinTarget.name)}</Text>
                  </View>
                  <View style={styles.pinTargetTextArea}>
                    <Text style={styles.pinTargetName}>{pinTarget.name}</Text>
                    <Text style={styles.pinTargetRole}>{roleOptions[pinTarget.role].label}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Kembali ke daftar kasir"
                    onPress={() => {
                      setPinTarget(null);
                      setPin('');
                      setPinError(null);
                    }}
                    style={styles.backButton}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textMuted} />
                    <Text style={styles.backButtonText}>Ganti</Text>
                  </Pressable>
                </View>

                <TextInput
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text.replace(/[^0-9]/g, '').slice(0, 4));
                    setPinError(null);
                  }}
                  placeholder="••••"
                  placeholderTextColor="#9AA8C2"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  autoFocus
                  style={styles.pinInput}
                />
                {pinError && (
                  <Text style={styles.pinError}>{pinError}</Text>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={pin.length < 4}
                  onPress={handleVerifyPin}
                  style={[styles.verifyButton, pin.length < 4 && styles.verifyButtonDisabled]}
                >
                  <Text style={styles.verifyButtonText}>Verifikasi PIN</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Ganti Kasir</Text>
                    <Text style={styles.sheetSubtitle}>Pilih kasir yang sedang bertugas</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tutup"
                    onPress={closeProfile}
                    style={styles.closeButton}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {employees
                    .filter((e) => e.active)
                    .map((employee) => {
                      const selected = cashier?.id === employee.id;
                      const meta = roleOptions[employee.role];
                      return (
                        <Pressable
                          key={employee.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => handleSelectEmployee(employee)}
                          style={[styles.employeeRow, selected && styles.employeeRowSelected]}
                        >
                          <View style={[styles.employeeAvatar, selected && styles.employeeAvatarSelected]}>
                            <Text style={[styles.employeeInitials, selected && styles.employeeInitialsSelected]}>
                              {initials(employee.name)}
                            </Text>
                          </View>
                          <View style={styles.employeeTextArea}>
                            <Text style={[styles.employeeName, selected && styles.employeeNameSelected]}>
                              {employee.name}
                            </Text>
                            <Text style={styles.employeeRole}>{meta.label}</Text>
                          </View>
                          {selected && (
                            <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                          )}
                        </Pressable>
                      );
                    })}
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  greeting: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  printerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  profileInitials: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,27,51,0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  pinTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  pinTargetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTargetInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  pinTargetTextArea: {
    flex: 1,
  },
  pinTargetName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  pinTargetRole: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pinInput: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 14,
    textAlign: 'center',
    color: colors.text,
  },
  pinError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 8,
    textAlign: 'center',
  },
  verifyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  employeeRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeAvatarSelected: {
    backgroundColor: colors.card,
  },
  employeeInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  employeeInitialsSelected: {
    color: colors.primary,
  },
  employeeTextArea: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  employeeNameSelected: {
    color: colors.primary,
  },
  employeeRole: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
