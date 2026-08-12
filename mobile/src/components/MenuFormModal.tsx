import { useEffect, useState } from 'react';
import {
  Alert,
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
import { categoryRepo } from '../db/repositories';
import type { Menu } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import { useBlurOnClose } from '../utils/blur';

export interface MenuFormData {
  name: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  available: boolean;
  variants: { name: string; priceExtra: number }[];
  addons: { name: string; price: number }[];
}

interface Props {
  visible: boolean;
  editing: Menu | null;
  onClose: () => void;
  onSave: (data: MenuFormData) => void;
}

interface VariantDraft {
  name: string;
  priceExtra: string;
}

interface AddonDraft {
  name: string;
  price: string;
}

export default function MenuFormModal({ visible, editing, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [available, setAvailable] = useState(true);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [addons, setAddons] = useState<AddonDraft[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (visible) {
      setName(editing?.name ?? '');
      setCategoryId(editing?.categoryId ?? categories[0]?.id ?? '');
      setPrice(editing ? String(editing.basePrice) : '');
      setCostPrice(editing ? String(editing.costPrice) : '');
      setStock(editing ? String(editing.stock) : '');
      setAvailable(editing?.available ?? true);
      setVariants(
        editing ? editing.variants.map((v) => ({ name: v.name, priceExtra: String(v.priceExtra) })) : []
      );
      setAddons(
        editing ? editing.addons.map((a) => ({ name: a.name, price: String(a.price) })) : []
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

  useEffect(() => {
    let active = true;
    categoryRepo
      .getAll()
      .then((rows) => {
        if (!active) return;
        setCategories(rows);
        setCategoryId((prev) => prev || rows[0]?.id || '');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useBlurOnClose(visible);

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
      variants: variants
        .map((v) => ({ name: v.name.trim(), priceExtra: Number(v.priceExtra) || 0 }))
        .filter((v) => v.name.length > 0),
      addons: addons
        .map((a) => ({ name: a.name.trim(), price: Number(a.price) || 0 }))
        .filter((a) => a.name.length > 0),
    });
  };

  const addVariantRow = () => setVariants((prev) => [...prev, { name: '', priceExtra: '' }]);
  const updateVariantRow = (index: number, patch: Partial<VariantDraft>) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const removeVariantRow = (index: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));

  const addAddonRow = () => setAddons((prev) => [...prev, { name: '', price: '' }]);
  const updateAddonRow = (index: number, patch: Partial<AddonDraft>) =>
    setAddons((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  const removeAddonRow = (index: number) => setAddons((prev) => prev.filter((_, i) => i !== index));

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Kategori Sudah Ada', `Kategori "${name}" sudah tersedia.`);
      return;
    }
    try {
      const created = await categoryRepo.create(name);
      setCategories((prev) => [...prev, created]);
      setCategoryId(created.id);
      setAddingCategory(false);
      setNewCategory('');
    } catch {
      Alert.alert('Gagal', 'Gagal menambahkan kategori. Silakan coba lagi.');
    }
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
              {categories.map((c) => {
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
              {!addingCategory && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setNewCategory('');
                    setAddingCategory(true);
                  }}
                  style={styles.addCategoryChip}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
                  <Text style={styles.addCategoryChipText}>Kategori Baru</Text>
                </Pressable>
              )}
            </View>

            {addingCategory && (
              <View style={styles.addCategoryRow}>
                <TextInput
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Nama kategori baru"
                  placeholderTextColor="#9AA8C2"
                  style={[styles.input, styles.addCategoryInput]}
                  autoFocus
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Simpan kategori"
                  disabled={newCategory.trim().length === 0}
                  onPress={handleAddCategory}
                  style={[
                    styles.addCategoryConfirm,
                    newCategory.trim().length === 0 && styles.buttonDisabled,
                  ]}
                >
                  <MaterialCommunityIcons name="check" size={18} color={colors.white} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Batal tambah kategori"
                  onPress={() => setAddingCategory(false)}
                  style={styles.addCategoryCancel}
                >
                  <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            )}

            <View style={styles.inputRow}>
              <View style={styles.inputArea}>
                <Text style={styles.label}>Harga Jual</Text>
                <TextInput
                  value={price ? Number(price).toLocaleString('id-ID') : ''}
                  onChangeText={(t) => setPrice(onlyDigits(t).slice(0, 7))}
                  placeholder="25.000"
                  placeholderTextColor="#9AA8C2"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputArea}>
                <Text style={styles.label}>HPP (Cost)</Text>
                <TextInput
                  value={costPrice ? Number(costPrice).toLocaleString('id-ID') : ''}
                  onChangeText={(t) => setCostPrice(onlyDigits(t).slice(0, 7))}
                  placeholder="14.000"
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

            <Text style={styles.subSectionTitle}>Varian (Opsional)</Text>
            {variants.map((v, index) => (
              <View key={index} style={styles.draftRow}>
                <TextInput
                  value={v.name}
                  onChangeText={(text) => updateVariantRow(index, { name: text })}
                  placeholder="Contoh: Porsi Jumbo"
                  placeholderTextColor="#9AA8C2"
                  style={[styles.input, styles.draftNameInput]}
                />
                <TextInput
                  value={v.priceExtra}
                  onChangeText={(text) =>
                    updateVariantRow(index, {
                      priceExtra: text.replace(/[^0-9-]/g, '').slice(0, 7),
                    })
                  }
                  placeholder="+10000"
                  placeholderTextColor="#9AA8C2"
                  style={[styles.input, styles.draftPriceInput]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hapus varian"
                  onPress={() => removeVariantRow(index)}
                  style={styles.draftRemove}
                >
                  <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={addVariantRow}
              style={styles.addDraftButton}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
              <Text style={styles.addDraftButtonText}>Tambah Varian</Text>
            </Pressable>

            <Text style={styles.subSectionTitle}>Tambahan / Add-ons (Opsional)</Text>
            {addons.map((a, index) => (
              <View key={index} style={styles.draftRow}>
                <TextInput
                  value={a.name}
                  onChangeText={(text) => updateAddonRow(index, { name: text })}
                  placeholder="Contoh: Tambah Kulit"
                  placeholderTextColor="#9AA8C2"
                  style={[styles.input, styles.draftNameInput]}
                />
                <TextInput
                  value={a.price}
                  onChangeText={(text) =>
                    updateAddonRow(index, { price: onlyDigits(text).slice(0, 7) })
                  }
                  placeholder="5000"
                  placeholderTextColor="#9AA8C2"
                  keyboardType="number-pad"
                  style={[styles.input, styles.draftPriceInput]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hapus tambahan"
                  onPress={() => removeAddonRow(index)}
                  style={styles.draftRemove}
                >
                  <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={addAddonRow}
              style={styles.addDraftButton}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
              <Text style={styles.addDraftButtonText}>Tambah Add-on</Text>
            </Pressable>

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
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addCategoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  addCategoryInput: {
    flex: 1,
  },
  addCategoryConfirm: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryCancel: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  draftNameInput: {
    flex: 1,
  },
  draftPriceInput: {
    width: 110,
  },
  draftRemove: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 9,
    marginTop: 2,
  },
  addDraftButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
