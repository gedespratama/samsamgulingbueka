import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { WeeklySalesData } from '../db/repositories';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';

interface Props {
  data: WeeklySalesData;
  isOffline: boolean;
}

export default function WeeklySalesCard({ data, isOffline }: Props) {
  const { rows, total, count } = data;
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Penjualan Minggu Ini</Text>
        <View style={[styles.syncChip, { backgroundColor: isOffline ? colors.warningSoft : colors.successSoft }]}>
          <MaterialCommunityIcons
            name={isOffline ? 'cloud-off-outline' : 'cloud-check-outline'}
            size={14}
            color={isOffline ? colors.warning : colors.success}
          />
          <Text style={[styles.syncText, { color: isOffline ? colors.warning : colors.success }]}>
            {isOffline ? 'Menunggu Sinkronisasi' : 'Tersinkron'}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.colMethod]}>Metode</Text>
          <Text style={[styles.cell, styles.colCount]}>Jumlah</Text>
          <Text style={[styles.cell, styles.colTotal]}>Total</Text>
          <Text style={[styles.cell, styles.colShare]}>%</Text>
        </View>

        {rows.map((row) => (
          <View key={row.key} style={styles.tableRow}>
            <View style={[styles.methodCell, styles.colMethod]}>
              <View style={[styles.dot, { backgroundColor: row.dotColor }]} />
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            <Text style={[styles.cell, styles.colCount, styles.rowValue]}>{row.count}</Text>
            <Text style={[styles.cell, styles.colTotal, styles.rowValue]}>{formatRupiah(row.total)}</Text>
            <Text style={[styles.cell, styles.colShare, styles.rowValue]}>
              {total > 0 ? Math.round((row.total / total) * 100) : 0}%
            </Text>
          </View>
        ))}

        <View style={styles.tableFooter}>
          <Text style={[styles.cell, styles.colMethod, styles.footerLabel]}>Total Minggu Ini</Text>
          <Text style={[styles.cell, styles.colCount, styles.footerValue]}>{count}</Text>
          <Text style={[styles.cell, styles.colTotal, styles.footerValue]}>{formatRupiah(total)}</Text>
          <Text style={[styles.cell, styles.colShare, styles.footerValue]}>100%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  syncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '600',
  },
  table: {
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  cell: {
    fontSize: 12,
    color: colors.textMuted,
  },
  colMethod: {
    flex: 1.1,
  },
  methodCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colCount: {
    flex: 0.6,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
  },
  colShare: {
    flex: 0.5,
    textAlign: 'right',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  rowValue: {
    fontWeight: '600',
    color: colors.text,
  },
  footerLabel: {
    fontWeight: '700',
    color: colors.primary,
  },
  footerValue: {
    fontWeight: '800',
    color: colors.primary,
  },
});
