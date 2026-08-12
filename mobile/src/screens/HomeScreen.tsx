import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import AppHeader from '../components/AppHeader';
import SummaryCard from '../components/SummaryCard';
import MenuGrid from '../components/MenuGrid';
import WeeklySalesCard from '../components/WeeklySalesCard';
import { usePrinter } from '../context/PrinterContext';
import { useCashier } from '../context/CashierContext';
import { orderRepo, type WeeklySalesData } from '../db/repositories';
import type { SummaryData } from '../data/mock';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const dateLabel = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date());

const emptySummary: SummaryData = {
  total: 0,
  transactionCount: 0,
  average: 0,
  paymentMethods: [
    { key: 'tunai', label: 'Tunai', amount: 0 },
    { key: 'qris', label: 'QRIS', amount: 0 },
    { key: 'transfer', label: 'Transfer', amount: 0 },
    { key: 'hutang', label: 'Hutang', amount: 0 },
  ],
};

const emptyWeekly: WeeklySalesData = {
  total: 0,
  count: 0,
  rows: [
    { key: 'tunai', label: 'Tunai', total: 0, count: 0, dotColor: '#16A34A' },
    { key: 'qris', label: 'QRIS', total: 0, count: 0, dotColor: '#0284C7' },
    { key: 'transfer', label: 'Transfer', total: 0, count: 0, dotColor: '#7C3AED' },
    { key: 'hutang', label: 'Hutang', total: 0, count: 0, dotColor: '#DC2626' },
  ],
};

const menuRoutes: Record<string, keyof RootStackParamList> = {
  'laci-kas': 'LaciKas',
  produk: 'Produk',
  laporan: 'Laporan',
  'buku-kas': 'BukuKas',
  hutang: 'Hutang',
  pelanggan: 'Pelanggan',
  karyawan: 'Karyawan',
  lainnya: 'Lainnya',
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const netInfo = useNetInfo();
  const { status } = usePrinter();
  const { cashier } = useCashier();
  const [summary, setSummary] = useState<SummaryData>(emptySummary);
  const [weekly, setWeekly] = useState<WeeklySalesData>(emptyWeekly);
  const isOffline = netInfo.isConnected === false;
  const isKasir = cashier?.role === 'kasir';
  const hiddenMenuKeys =
    cashier?.role === 'pemilik' ? [] : isKasir ? ['karyawan', 'produk', 'laporan', 'buku-kas', 'hutang'] : ['karyawan'];

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([orderRepo.getTodaySummary(), orderRepo.getWeeklySummary()])
        .then(([day, week]) => {
          if (active) {
            setSummary(day);
            setWeekly(week);
          }
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  const handleMenuPress = (key: string) => {
    const route = menuRoutes[key];
    if (route) navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          <AppHeader
            isPrinterConnected={status === 'connected'}
            printerStatus={status}
            onPressPrinter={() => navigation.navigate('Printer')}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Kasir')}
            style={({ pressed }) => pressed && styles.ctaPressed}
          >
            <LinearGradient
              colors={['#2E7CF6', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <View style={styles.ctaIcon}>
                <MaterialCommunityIcons name="cart" size={26} color={colors.white} />
              </View>
              <View style={styles.ctaTextArea}>
                <Text style={styles.ctaTitle}>Buka Kasir</Text>
                <Text style={styles.ctaSubtitle}>Catat pesanan pelanggan sekarang</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.white} />
            </LinearGradient>
          </Pressable>

          {!isKasir && <SummaryCard summary={summary} dateLabel={dateLabel} />}
          <MenuGrid onPressItem={handleMenuPress} hiddenKeys={hiddenMenuKeys} />
          {!isKasir && <WeeklySalesCard data={weekly} isOffline={isOffline} />}
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
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
  },
  ctaIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextArea: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
