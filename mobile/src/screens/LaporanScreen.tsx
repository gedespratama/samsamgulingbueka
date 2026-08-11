import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FilterChips from '../components/ui/FilterChips';
import { laporanMethods, weeklySalesChart } from '../data/mock';
import { colors } from '../theme';
import { formatRupiah } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type RangeKey = 'hari_ini' | '7_hari' | 'bulan_ini';

const rangeOptions = [
  { key: 'hari_ini', label: 'Hari Ini' },
  { key: '7_hari', label: '7 Hari Terakhir' },
  { key: 'bulan_ini', label: 'Bulan Ini' },
] as { key: RangeKey; label: string }[];

const rangeTotals: Record<RangeKey, { total: number; count: number }> = {
  hari_ini: { total: 1_285_000, count: 12 },
  '7_hari': { total: 9_805_000, count: 98 },
  bulan_ini: { total: 42_750_000, count: 421 },
};

const rangeMethods: Record<RangeKey, number[]> = {
  hari_ini: [620_000, 385_000, 180_000, 100_000],
  '7_hari': [4_620_000, 2_940_000, 1_795_000, 450_000],
  bulan_ini: [19_200_000, 12_850_000, 8_100_000, 2_600_000],
};

export default function LaporanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [range, setRange] = useState<RangeKey>('hari_ini');

  const summary = rangeTotals[range];
  const methods = laporanMethods.map((m, i) => ({ ...m, amount: rangeMethods[range][i] }));
  const offlineTotal = methods.find((m) => m.key === 'tunai')?.amount ?? 0;
  const onlineTotal = summary.total - offlineTotal;
  const maxBar = Math.max(...weeklySalesChart.map((d) => d.total));

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
          <Text style={styles.title}>Laporan</Text>
          <Text style={styles.subtitle}>Penjualan harian & tren</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FilterChips options={rangeOptions} selected={range} onSelect={setRange} />

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Penjualan</Text>
          <Text style={styles.totalValue}>{formatRupiah(summary.total)}</Text>
          <Text style={styles.totalMeta}>{summary.count} transaksi selesai</Text>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Rincian Metode Pembayaran</Text>
        </View>
        <View style={styles.methodCard}>
          {methods.map((m) => {
            const pct = summary.total > 0 ? Math.round((m.amount / summary.total) * 100) : 0;
            return (
              <View key={m.key} style={styles.methodRow}>
                <View style={styles.methodTop}>
                  <View style={[styles.methodDot, { backgroundColor: m.color }]} />
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodAmount}>{formatRupiah(m.amount)}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { backgroundColor: m.color, width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Offline vs Online</Text>
        </View>
        <View style={styles.splitRow}>
          <View style={styles.splitCard}>
            <MaterialCommunityIcons name="wifi-off" size={20} color={colors.textMuted} />
            <Text style={styles.splitLabel}>Offline (Tunai)</Text>
            <Text style={styles.splitValue}>{formatRupiah(offlineTotal)}</Text>
          </View>
          <View style={styles.splitCard}>
            <MaterialCommunityIcons name="wifi" size={20} color={colors.primary} />
            <Text style={styles.splitLabel}>Online (QRIS/Transfer)</Text>
            <Text style={styles.splitValue}>{formatRupiah(onlineTotal)}</Text>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Grafik Penjualan 7 Hari</Text>
        </View>
        <View style={styles.chartCard}>
          <View style={styles.chartArea}>
            {weeklySalesChart.map((day, index) => {
              const height = Math.max(10, (day.total / maxBar) * 140);
              const isToday = index === weeklySalesChart.length - 1;
              return (
                <View key={day.label} style={styles.barColumn}>
                  <Text style={styles.barValue}>{formatRupiah(day.total)}</Text>
                  <View
                    style={[
                      styles.bar,
                      { height, backgroundColor: isToday ? colors.primary : '#A9BEEB' },
                    ]}
                  />
                  <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
  content: {
    paddingBottom: 28,
  },
  totalCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  totalMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  sectionTitleRow: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  methodCard: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  methodRow: {
    gap: 6,
  },
  methodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  methodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  methodAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
  },
  splitCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  splitLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  splitValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 190,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barValue: {
    fontSize: 9,
    color: colors.textMuted,
  },
  bar: {
    width: 18,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  barLabelToday: {
    color: colors.primary,
    fontWeight: '800',
  },
});
