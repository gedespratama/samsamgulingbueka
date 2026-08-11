import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import type { Menu } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';

interface Props {
  menu: Menu;
  visible: boolean;
  onClose: () => void;
}

export default function KasirItemModal({ menu, visible, onClose }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setQty(1);
      setVariantId(null);
      setAddonIds([]);
      setNote('');
    }
  }, [visible]);

  const variant = menu.variants.find((v) => v.id === variantId) ?? null;
  const addons = menu.addons.filter((a) => addonIds.includes(a.id));

  const unitPrice = useMemo(() => {
    const extra =
      (variant?.priceExtra ?? 0) + addons.reduce((sum, a) => sum + a.price, 0);
    return Math.max(0, menu.basePrice + extra);
  }, [menu.basePrice, variant, addons]);

  const toggleAddon = (id: string) => {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    const key = [menu.id, variantId ?? '', addonIds.join('+')].join('|');
    addItem(key, {
      menuId: menu.id,
      name: menu.name,
      qty,
      unitPrice,
      variant: variant?.name ?? null,
      addons: addons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      note: note.trim(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityRole="button" />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleArea}>
            <Text style={styles.sheetTitle}>{menu.name}</Text>
            <Text style={styles.sheetPrice}>{formatRupiah(menu.basePrice)}</Text>
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

        {menu.variants.length > 0 && (
          <Text style={styles.sectionLabel}>Pilih Varian</Text>
        )}
        {menu.variants.map((v) => {
          const selected = variantId === v.id;
          return (
            <Pressable
              key={v.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setVariantId(selected ? null : v.id)}
              style={[styles.optionRow, selected && styles.optionRowSelected]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {v.name}
              </Text>
              <Text style={styles.optionPrice}>
                {v.priceExtra >= 0 ? '+' : '-'}
                {formatRupiah(Math.abs(v.priceExtra))}
              </Text>
            </Pressable>
          );
        })}

        {menu.addons.length > 0 && <Text style={styles.sectionLabel}>Tambahan (Add-ons)</Text>}
        {menu.addons.map((a) => {
          const selected = addonIds.includes(a.id);
          return (
            <Pressable
              key={a.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggleAddon(a.id)}
              style={[styles.optionRow, selected && styles.optionRowSelected]}
            >
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && (
                  <MaterialCommunityIcons name="check" size={13} color={colors.white} />
                )}
              </View>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{a.name}</Text>
              <Text style={styles.optionPrice}>+{formatRupiah(a.price)}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.sectionLabel}>Catatan</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Contoh: jangan terlalu pedas"
          placeholderTextColor="#9AA8C2"
          style={styles.noteInput}
          multiline
        />

        <View style={styles.actionRow}>
          <View style={styles.stepperArea}>
            <Text style={styles.qtyLabel}>Jumlah</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                disabled={qty <= 1}
                onPress={() => setQty((prev) => Math.max(1, prev - 1))}
                style={[styles.stepButton, qty <= 1 && styles.stepButtonDisabled]}
              >
                <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setQty((prev) => prev + 1)}
                style={styles.stepButton}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>
          <View style={styles.totalArea}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatRupiah(unitPrice * qty)}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={styles.buttonSecondaryText}>Batal</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleAdd}
            style={[styles.button, styles.buttonPrimary]}
          >
            <Text style={styles.buttonPrimaryText}>Tambah ke Keranjang</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitleArea: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sheetPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#B8C7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  noteInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  stepperArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalArea: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
  },
  bottomRow: {
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
  buttonPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
