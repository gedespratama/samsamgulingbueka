import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  Kasir: undefined;
  LaciKas: undefined;
  Produk: undefined;
  Laporan: undefined;
  BukuKas: undefined;
  Hutang: undefined;
  Pelanggan: undefined;
  Karyawan: undefined;
  Lainnya: undefined;
  Printer: undefined;
  Sync: undefined;
};

export type RootTabParamList = {
  Beranda: undefined;
  Riwayat: undefined;
  Keranjang: undefined;
  Notifikasi: undefined;
  Akun: undefined;
};
