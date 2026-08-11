import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { roleOptions, type EmployeeRole } from '../data/mock';
import { colors } from '../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const roleCards: { key: EmployeeRole; icon: IconName }[] = [
  { key: 'kasir', icon: 'cash-register' },
  { key: 'admin', icon: 'clipboard-edit-outline' },
  { key: 'pemilik', icon: 'crown-outline' },
];

export interface NewEmployee {
  name: string;
  role: EmployeeRole;
  pin: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: NewEmployee) => void;
}

export default function AddKaryawanModal({ visible, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('kasir');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setRole('kasir');
      setPin('');
      setShowPin(false);
    }
  }, [visible]);

  const isPinValid = /^\d{4}$/.test(pin);
  const canSave = name.trim().length > 0 && isPinValid;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), role, pin });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Tambah Karyawan</Text>
              <Text style={styles.sheetSubtitle}>Lengkapi data karyawan baru</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.label}>Nama Karyawan</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Contoh: Made Surya"
            placeholderTextColor="#9AA8C2"
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Role</Text>
          <View style={styles.roleList}>
            {roleCards.map((card) => {
              const selected = role === card.key;
              const meta = roleOptions[card.key];
              return (
                <Pressable
                  key={card.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setRole(card.key)}
                  style={[styles.roleCard, selected && styles.roleCardSelected]}
                >
                  <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                    <MaterialCommunityIcons
                      name={card.icon}
                      size={20}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={styles.roleTextArea}>
                    <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                      {meta.label}
                    </Text>
                    <Text style={styles.roleDescription}>{meta.description}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>PIN 4 Digit</Text>
          <View style={styles.pinRow}>
            <TextInput
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="****"
              placeholderTextColor="#9AA8C2"
              style={[styles.input, styles.pinInput]}
              keyboardType="number-pad"
              secureTextEntry={!showPin}
              maxLength={4}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
              onPress={() => setShowPin((prev) => !prev)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPin ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
          {pin.length > 0 && !isPinValid && (
            <Text style={styles.hint}>PIN harus 4 digit angka</Text>
          )}

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
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
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  roleList: {
    gap: 8,
    marginBottom: 14,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: {
    backgroundColor: colors.card,
  },
  roleTextArea: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  roleLabelSelected: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#B8C7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinInput: {
    flex: 1,
  },
  eyeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
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
