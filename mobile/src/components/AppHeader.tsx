import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';
import type { PrinterStatus } from '../context/PrinterContext';

interface Props {
  isPrinterConnected: boolean;
  printerStatus: PrinterStatus;
  onPressPrinter: () => void;
}

export default function AppHeader({ isPrinterConnected, printerStatus, onPressPrinter }: Props) {
  const statusColor =
    printerStatus === 'connecting' ? '#D97706' : isPrinterConnected ? colors.success : colors.danger;
  const statusText =
    printerStatus === 'connecting' ? 'Menghubungkan...' : isPrinterConnected ? 'Terkoneksi' : 'Terputus';

  return (
    <View style={styles.container}>
      <View style={styles.brandArea}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="storefront-outline" size={24} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.brand}>Samsam Guling Bu Eka</Text>
          <Text style={styles.greeting}>Selamat pagi, Bu Eka</Text>
        </View>
      </View>

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
        <Text style={[styles.printerStatus, { color: statusColor }]}>{statusText}</Text>
      </Pressable>
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
  printerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  printerStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
});
