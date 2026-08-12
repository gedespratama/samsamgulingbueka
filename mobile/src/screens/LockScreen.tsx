import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCashier } from '../context/CashierContext';
import { employeeRepo } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import { roleOptions, type Employee, type EmployeeRole } from '../data/mock';
import { colors } from '../theme';
import { useBlurOnClose } from '../utils/blur';

const roleMeta: Record<EmployeeRole, { tint: string; color: string }> = {
  kasir: { tint: colors.primarySoft, color: colors.primary },
  admin: { tint: '#EDE9FE', color: '#7C3AED' },
  pemilik: { tint: '#FEF3C7', color: '#D97706' },
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export default function LockScreen() {
  const { loaded, unlock } = useCashier();
  const { data: employees } = useDbList(employeeRepo.getAll);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  useBlurOnClose(selected !== null);

  const handleSelect = (employee: Employee) => {
    setSelected(employee);
    setPin('');
    setPinError(null);
  };

  const handleVerify = async () => {
    if (!selected) return;
    if (pin.length < 4) {
      setPinError('PIN harus 4 digit.');
      return;
    }
    const ok = await unlock(selected, pin);
    if (!ok) {
      setPin('');
      setPinError('PIN salah. Silakan coba lagi.');
    }
  };

  if (!loaded) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.brandArea}>
          <View style={styles.brandIcon}>
            <MaterialCommunityIcons name="storefront-outline" size={30} color={colors.primary} />
          </View>
          <Text style={styles.brand}>Samsam Guling Bu Eka</Text>
          {selected ? (
            <Text style={styles.subtitle}>Masukkan PIN untuk memulai bertugas</Text>
          ) : (
            <Text style={styles.subtitle}>Siapa yang bertugas?</Text>
          )}
        </View>

        {selected ? (
          <View style={styles.pinArea}>
            <View style={styles.pinEmployeeRow}>
              <View style={styles.pinEmployeeAvatar}>
                <Text style={styles.pinEmployeeInitials}>{initials(selected.name)}</Text>
              </View>
              <View style={styles.pinEmployeeTextArea}>
                <Text style={styles.pinEmployeeName}>{selected.name}</Text>
                <Text style={styles.pinEmployeeRole}>{roleOptions[selected.role].label}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kembali ke daftar"
                onPress={() => setSelected(null)}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textMuted} />
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
            {pinError && <Text style={styles.pinError}>{pinError}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={pin.length < 4}
              onPress={handleVerify}
              style={[styles.verifyButton, pin.length < 4 && styles.verifyButtonDisabled]}
            >
              <Text style={styles.verifyButtonText}>Masuk</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {employees
              .filter((e) => e.active)
              .map((employee) => {
                const meta = roleOptions[employee.role];
                const tint = roleMeta[employee.role].tint;
                const color = roleMeta[employee.role].color;
                return (
                  <Pressable
                    key={employee.id}
                    accessibilityRole="button"
                    onPress={() => handleSelect(employee)}
                    style={styles.employeeRow}
                  >
                    <View style={[styles.employeeAvatar, { backgroundColor: tint }]}>
                      <Text style={[styles.employeeInitials, { color }]}>
                        {initials(employee.name)}
                      </Text>
                    </View>
                    <View style={styles.employeeTextArea}>
                      <Text style={styles.employeeName}>{employee.name}</Text>
                      <Text style={styles.employeeRole}>{meta.label}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#B8C7E8" />
                  </Pressable>
                );
              })}
            {employees.length === 0 && (
              <Text style={styles.emptyText}>Belum ada karyawan aktif. Tambahkan karyawan terlebih dahulu.</Text>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandArea: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    marginTop: 14,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitials: {
    fontSize: 14,
    fontWeight: '800',
  },
  employeeTextArea: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  employeeRole: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  pinArea: {
    paddingHorizontal: 24,
  },
  pinEmployeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  pinEmployeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinEmployeeInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  pinEmployeeTextArea: {
    flex: 1,
  },
  pinEmployeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  pinEmployeeRole: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    letterSpacing: 16,
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
    paddingVertical: 14,
    marginTop: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: '#A9BEEB',
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
