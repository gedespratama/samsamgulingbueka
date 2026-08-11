import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { menuCategories, type Menu } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';

export interface MenuFormData {
  name: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  available: boolean;
}

interface Props {
  visible: boolean;
  editing: Menu | null;
  onClose: () => void;
  onSave: (data: MenuFormData) => void;
}

export default function MenuFormModal({ visible, editing, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(menuCategories[0].id);
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (visible) {
      setName(editing?.name ?? '');
      setCategoryId(editing?.categoryId ?? menuCategories[0].id);
      setPrice(editing ? String(editing.basePrice) : '');
      setCostPrice(editing ? String(editing.costPrice) : '');
      setStock(editing ? String(editing.stock) : '');
      setAvailable(editing?.available ?? true);
    }
  }, [visible, editing]);

  const onlyDigits = (text: string) => text.replace(/[^0-9]/g, '');

  const priceNum = Number(price);
  const canSave =
    name.trim().length > 0 && price.length > 0 && priceNum > 0 && Number(stock) >= 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      categoryId,
      price: priceNum,
      costPrice: costPrice.length > 0 ? Number(costPrice) : 0,
      stock: stock.length > 0 ? Number(stock) : 0,
      available,
    });
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
              <Text style={styles.sheetTitle}>{editing ? 'Ubah Menu' : 'Tambah Menu'}</Text>
              <Text style={styles.sheetSubtitle}>
                {editing ? 'Perbarui informasi menu' : 'Menu baru langsung tersedia di kasir'}
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

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nama Menu</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Contoh: Babi Guling Spesial"
              placeholderTextColor="#9AA8C2"
              style={styles.input}
            />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoryRow}>
              {menuCategories.map((c) => {
                const selected = categoryId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setCategoryId(c.id)}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputArea}>
                <Text style={styles.label}>Harga Jual</Text>
                <TextInput
                  value={price}
                  onChangeText={(t) => setPrice(onlyDigits(t).slice(0, 7))}
                  placeholder="25000"
                  placeholderTextColor="#9AA8C2"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputArea}>
                <Text style={styles.label}>HPP (Cost)</Text>
                <TextInput
                  value={costPrice}
                  onChangeText={(t) => setCostPrice(onlyDigits(t).slice(0, 7))}
                  placeholder="14000"
                  placeholderTextColor="#9AA8C2"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputArea}>
                <Text style={styles.label}>Stok Porsi</Text>
                <TextInput
                  value={stock}
                  onChangeText={(t) => setStock(onlyDigits(t).slice(0, 4))}
                  placeholder="20"
                  placeholderTextColor="#9AA8C2"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputArea}>
                <Text style={styles.label}>Margin</Text>
                <View style={[styles.input, styles.marginBox]}>
                  <Text style={styles.marginText}>
                    {priceNum > 0 ? formatRupiah(priceNum - (Number(costPrice) || 0)) : '-'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextArea}>
                <Text style={styles.switchLabel}>Menu Tersedia</Text>
                <Text style={styles.switchHint}>Nonaktifkan jika stok habis atau tidak dijual</Text>
              </View>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </ScrollView>

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
    maxHeight: '92%',
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  categoryChipTextSelected: {
    color: colors.white,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputArea: {
    flex: 1,
  },
  marginBox: {
    justifyContent: 'center',
  },
  marginText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchTextArea: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  switchHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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
