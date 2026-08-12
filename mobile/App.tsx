import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './src/context/CartContext';
import { CashierProvider } from './src/context/CashierContext';
import { PrinterProvider } from './src/context/PrinterContext';
import { SyncProvider } from './src/context/SyncContext';
import HomeScreen from './src/screens/HomeScreen';
import RiwayatScreen from './src/screens/RiwayatScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import NotifikasiScreen from './src/screens/NotifikasiScreen';
import AkunScreen from './src/screens/AkunScreen';
import KasirScreen from './src/screens/KasirScreen';
import LaciKasScreen from './src/screens/LaciKasScreen';
import ProdukScreen from './src/screens/ProdukScreen';
import LaporanScreen from './src/screens/LaporanScreen';
import BukuKasScreen from './src/screens/BukuKasScreen';
import HutangScreen from './src/screens/HutangScreen';
import PelangganScreen from './src/screens/PelangganScreen';
import KaryawanScreen from './src/screens/KaryawanScreen';
import LainnyaScreen from './src/screens/LainnyaScreen';
import PrinterScreen from './src/screens/PrinterScreen';
import SyncScreen from './src/screens/SyncScreen';
import CustomTabBar from './src/components/CustomTabBar';
import { useCashier } from './src/context/CashierContext';
import LockScreen from './src/screens/LockScreen';
import { dismissKeyboard } from './src/utils/blur';
import type { RootStackParamList, RootTabParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Beranda"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Riwayat" component={RiwayatScreen} />
      <Tab.Screen name="Keranjang" component={CheckoutScreen} />
      <Tab.Screen name="Notifikasi" component={NotifikasiScreen} />
      <Tab.Screen name="Akun" component={AkunScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CashierProvider>
        <PrinterProvider>
          <SyncProvider>
            <CartProvider>
              <View style={{ flex: 1 }}>
                <NavigationContainer onStateChange={dismissKeyboard}>
                  <StatusBar style="dark" />
                  <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    <Stack.Screen name="Kasir" component={KasirScreen} />
                    <Stack.Screen name="LaciKas" component={LaciKasScreen} />
                    <Stack.Screen name="Produk" component={ProdukScreen} />
                    <Stack.Screen name="Laporan" component={LaporanScreen} />
                    <Stack.Screen name="BukuKas" component={BukuKasScreen} />
                    <Stack.Screen name="Hutang" component={HutangScreen} />
                    <Stack.Screen name="Pelanggan" component={PelangganScreen} />
                    <Stack.Screen name="Karyawan" component={KaryawanScreen} />
                    <Stack.Screen name="Lainnya" component={LainnyaScreen} />
                    <Stack.Screen name="Printer" component={PrinterScreen} />
                    <Stack.Screen name="Sync" component={SyncScreen} />
                  </Stack.Navigator>
                </NavigationContainer>
                <LockOverlay />
              </View>
            </CartProvider>
          </SyncProvider>
        </PrinterProvider>
      </CashierProvider>
    </SafeAreaProvider>
  );
}

function LockOverlay() {
  const { isLocked } = useCashier();
  if (!isLocked) return null;
  return <LockScreen />;
}
