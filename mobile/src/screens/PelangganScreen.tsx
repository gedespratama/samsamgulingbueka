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
import { customerRepo } from '../db/repositories';
import { useDbList } from '../db/useDbList';
import type { Customer } from '../data/mock';
import { colors } from '../theme';
import { useBlurOnClose } from '../utils/blur';
import type { RootStackParamList } from '../navigation/types';

export default function PelangganScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: customers, refresh } = useDbList(customerRepo.getAll);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useBlurOnClose(modalVisible);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    if (editing) {
      await customerRepo.update({ ...editing, name: name.trim(), phone: phone.trim() });
      await refresh();
      setModalVisible(false);
      setEditing(null);
      Alert.alert('Berhasil', `Data ${name.trim()} berhasil diperbarui.`);
      return;
    }
    await customerRepo.create({ name: name.trim(), phone: phone.trim() }, `c-${Date.now()}`);
    await refresh();
    setModalVisible(false);
    Alert.alert('Berhasil', `${name.trim()} berhasil ditambahkan sebagai pelanggan.`);
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert(
      'Hapus Pelanggan',
      `Hapus profil pelanggan ${customer.name}?\n\nData pelanggan akan dihapus permanen.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerRepo.remove(customer.id);
              await refresh();
              Alert.alert('Berhasil', `${customer.name} berhasil dihapus.`);
            } catch {
              Alert.alert('Gagal', 'Gagal menghapus pelanggan. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  const openAdd = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setModalVisible(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditing(null);
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
          <Text style={styles.title}>Pelanggan</Text>
          <Text style={styles.subtitle}>{customers.length} pelanggan terdaftar</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah pelanggan"
          onPress={openAdd}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {customers.length === 0 ? (
          <EmptyState
            icon="account-group-outline"
            title="Belum ada pelanggan"
            subtitle="Ketuk tombol + untuk menambahkan pelanggan."
          />
        ) : (
          customers.map((customer, index) => {
            const tint = ['#E3EEFF', '#E5F6EC', '#FEF3C7', '#EDE9FE'][index % 4];
            const iconColor = ['#1D4ED8', '#16A34A', '#D97706', '#7C3AED'][index % 4];
            const initials = customer.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <View key={customer.id} style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: tint }]}>
                  <Text style={[styles.avatarText, { color: iconColor }]}>{initials}</Text>
                </View>
                <View style={styles.cardTextArea}>
                  <Text style={styles.cardName}>{customer.name}</Text>
                  {customer.phone ? (
                    <Text style={styles.cardPhone}>{customer.phone}</Text>
                  ) : (
                    <Text style={styles.cardPhoneMuted}>Belum ada nomor HP</Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ubah pelanggan ${customer.name}`}
                  onPress={() => openEdit(customer)}
                  style={styles.cardAction}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textMuted} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus pelanggan ${customer.name}`}
                  onPress={() => handleDelete(customer)}
                  style={[styles.cardAction, styles.cardActionDanger]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={closeModal} accessibilityRole="button" />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editing ? 'Ubah Pelanggan' : 'Tambah Pelanggan'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={closeModal}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.label}>Nama Pelanggan</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Contoh: Pak Wayan"
              placeholderTextColor="#9AA8C2"
              style={styles.input}
            />
            <Text style={styles.label}>Nomor HP (opsional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="08xx-xxxx-xxxx"
              placeholderTextColor="#9AA8C2"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={closeModal}
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardTextArea: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardPhoneMuted: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9AA8C2',
    marginTop: 2,
  },
  cardAction: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionDanger: {
    backgroundColor: '#FEE2E2',
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
