import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { SummaryData } from '../data/mock';
import { formatRupiah } from '../utils/format';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const methodIcons: Record<string, IconName> = {
  tunai: 'cash',
  qris: 'qrcode-scan',
  transfer: 'bank-transfer',
  hutang: 'account-cash',
};

interface Props {
  summary: SummaryData;
  dateLabel: string;
}

export default function SummaryCard({ summary, dateLabel }: Props) {
  return (
    <LinearGradient
      colors={['#2E7CF6', '#1D4ED8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ringkasan Hari Ini</Text>
        <View style={styles.datePill}>
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>
      </View>

      <Text style={styles.total}>{formatRupiah(summary.total)}</Text>

      <View style={styles.statsRow}>
        <Text style={styles.stat}>{summary.transactionCount} Transaksi</Text>
        <Text style={styles.statDot}>{'\u2022'}</Text>
        <Text style={styles.stat}>Rata-rata {formatRupiah(summary.average)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.grid}>
        {summary.paymentMethods.map((method) => (
          <View key={method.key} style={styles.methodCell}>
            <View style={styles.methodIcon}>
              <MaterialCommunityIcons
                name={methodIcons[method.key] ?? 'cash'}
                size={15}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.methodTextArea}>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <Text style={styles.methodAmount}>{formatRupiah(method.amount)}</Text>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  total: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  stat: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  statDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '48%',
  },
  methodIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextArea: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  methodAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
});
