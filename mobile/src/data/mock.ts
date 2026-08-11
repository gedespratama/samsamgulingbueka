import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface PaymentMethod {
  key: string;
  label: string;
  amount: number;
}

export interface SummaryData {
  total: number;
  transactionCount: number;
  average: number;
  paymentMethods: PaymentMethod[];
}

export const summaryToday: SummaryData = {
  total: 1_285_000,
  transactionCount: 12,
  average: 107_083,
  paymentMethods: [
    { key: 'tunai', label: 'Tunai', amount: 620_000 },
    { key: 'qris', label: 'QRIS', amount: 385_000 },
    { key: 'transfer', label: 'Transfer', amount: 180_000 },
    { key: 'hutang', label: 'Hutang', amount: 100_000 },
  ],
};

export interface WeeklySalesRow {
  key: string;
  label: string;
  total: number;
  count: number;
  dotColor: string;
}

export const weeklySales: WeeklySalesRow[] = [
  { key: 'tunai', label: 'Tunai', total: 3_620_000, count: 34, dotColor: '#16A34A' },
  { key: 'qris', label: 'QRIS', total: 2_140_000, count: 21, dotColor: '#0284C7' },
  { key: 'transfer', label: 'Transfer', total: 980_000, count: 9, dotColor: '#7C3AED' },
  { key: 'hutang', label: 'Hutang', total: 450_000, count: 5, dotColor: '#DC2626' },
];

export const weeklySalesTotal = weeklySales.reduce((sum, row) => sum + row.total, 0);

export interface MenuItem {
  key: string;
  label: string;
  icon: IconName;
  tint: string;
  iconColor: string;
}

export const menuItems: MenuItem[] = [
  { key: 'laci-kas', label: 'Laci Kas', icon: 'cash-register', tint: '#E3EEFF', iconColor: colors.primary },
  { key: 'produk', label: 'Produk', icon: 'silverware-fork-knife', tint: '#FFEAD9', iconColor: '#EA6A12' },
  { key: 'laporan', label: 'Laporan', icon: 'chart-bar', tint: '#E5F6EC', iconColor: '#16A34A' },
  { key: 'buku-kas', label: 'Buku Kas', icon: 'notebook-outline', tint: '#EDE9FE', iconColor: '#7C3AED' },
  { key: 'hutang', label: 'Hutang', icon: 'account-cash', tint: '#FEE2E2', iconColor: '#DC2626' },
  { key: 'pelanggan', label: 'Pelanggan', icon: 'account-group', tint: '#E0F2FE', iconColor: '#0284C7' },
  { key: 'karyawan', label: 'Karyawan', icon: 'account-tie', tint: '#F1F5F9', iconColor: '#475569' },
  { key: 'lainnya', label: 'Lainnya', icon: 'dots-horizontal-circle-outline', tint: '#FEF3C7', iconColor: '#D97706' },
];

export type EmployeeRole = 'kasir' | 'admin' | 'pemilik';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  pin: string;
  active: boolean;
}

export const roleOptions: Record<EmployeeRole, { label: string; description: string }> = {
  kasir: { label: 'Kasir', description: 'Melayani transaksi penjualan' },
  admin: { label: 'Admin', description: 'Mengelola produk dan stok' },
  pemilik: { label: 'Pemilik', description: 'Akses penuh ke semua fitur' },
};

export const employeeSeed: Employee[] = [
  { id: 'emp-1', name: 'Bu Eka', role: 'pemilik', pin: '1234', active: true },
  { id: 'emp-2', name: 'Made Surya', role: 'kasir', pin: '4321', active: true },
  { id: 'emp-3', name: 'Komang Ayu', role: 'admin', pin: '1111', active: true },
];

export interface MenuCategory {
  id: string;
  name: string;
}

export const menuCategories: MenuCategory[] = [
  { id: 'babi-guling', name: 'Babi Guling' },
  { id: 'sate-babi', name: 'Sate Babi' },
  { id: 'lawar', name: 'Lawar' },
  { id: 'sambal', name: 'Aneka Sambal' },
  { id: 'minuman', name: 'Minuman' },
];

export interface MenuVariant {
  id: string;
  name: string;
  priceExtra: number;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

export interface Menu {
  id: string;
  name: string;
  basePrice: number;
  costPrice: number;
  categoryId: string;
  stock: number;
  available: boolean;
  variants: MenuVariant[];
  addons: MenuAddon[];
}

export const menuSeed: Menu[] = [
  {
    id: 'm1',
    name: 'Babi Guling Biasa',
    basePrice: 25_000,
    costPrice: 14_000,
    categoryId: 'babi-guling',
    stock: 20,
    available: true,
    variants: [
      { id: 'm1-v1', name: 'Porsi Jumbo', priceExtra: 10_000 },
      { id: 'm1-v2', name: 'Tanpa Nasi', priceExtra: -5_000 },
    ],
    addons: [
      { id: 'm1-a1', name: 'Tambah Kulit', price: 5_000 },
      { id: 'm1-a2', name: 'Kerupuk Babi', price: 3_000 },
    ],
  },
  {
    id: 'm2',
    name: 'Babi Guling Spesial',
    basePrice: 35_000,
    costPrice: 20_000,
    categoryId: 'babi-guling',
    stock: 12,
    available: true,
    variants: [
      { id: 'm2-v1', name: 'Porsi Jumbo', priceExtra: 10_000 },
      { id: 'm2-v2', name: 'Tanpa Nasi', priceExtra: -5_000 },
    ],
    addons: [
      { id: 'm2-a1', name: 'Tambah Kulit', price: 5_000 },
      { id: 'm2-a2', name: 'Tambah Nasi', price: 5_000 },
    ],
  },
  {
    id: 'm3',
    name: 'Sate Babi (10 tusuk)',
    basePrice: 30_000,
    costPrice: 18_000,
    categoryId: 'sate-babi',
    stock: 30,
    available: true,
    variants: [
      { id: 'm3-v1', name: 'Porsi Jumbo (15 tusuk)', priceExtra: 10_000 },
    ],
    addons: [
      { id: 'm3-a1', name: 'Bumbu Tambahan', price: 2_000 },
      { id: 'm3-a2', name: 'Nasi Putih', price: 5_000 },
    ],
  },
  {
    id: 'm4',
    name: 'Sate Babi Kecil',
    basePrice: 15_000,
    costPrice: 9_000,
    categoryId: 'sate-babi',
    stock: 0,
    available: false,
    variants: [],
    addons: [],
  },
  {
    id: 'm5',
    name: 'Lawar Babi',
    basePrice: 20_000,
    costPrice: 11_000,
    categoryId: 'lawar',
    stock: 8,
    available: true,
    variants: [
      { id: 'm5-v1', name: 'Porsi Jumbo', priceExtra: 7_000 },
    ],
    addons: [
      { id: 'm5-a1', name: 'Tambah Kerupuk', price: 2_000 },
    ],
  },
  {
    id: 'm6',
    name: 'Lawar Campur',
    basePrice: 22_000,
    costPrice: 13_000,
    categoryId: 'lawar',
    stock: 6,
    available: true,
    variants: [],
    addons: [],
  },
  {
    id: 'm7',
    name: 'Sambal Matah',
    basePrice: 5_000,
    costPrice: 2_000,
    categoryId: 'sambal',
    stock: 40,
    available: true,
    variants: [],
    addons: [],
  },
  {
    id: 'm8',
    name: 'Sambal Kecombrang',
    basePrice: 5_000,
    costPrice: 2_000,
    categoryId: 'sambal',
    stock: 35,
    available: true,
    variants: [],
    addons: [],
  },
  {
    id: 'm9',
    name: 'Es Teh Manis',
    basePrice: 5_000,
    costPrice: 1_000,
    categoryId: 'minuman',
    stock: 50,
    available: true,
    variants: [],
    addons: [],
  },
  {
    id: 'm10',
    name: 'Es Jeruk',
    basePrice: 7_000,
    costPrice: 2_000,
    categoryId: 'minuman',
    stock: 50,
    available: true,
    variants: [],
    addons: [],
  },
];

export type OrderType = 'dine_in' | 'takeaway';
export type PaymentMethodKey = 'tunai' | 'qris' | 'transfer' | 'hutang';

export const paymentMethodMeta: Record<PaymentMethodKey, { label: string; icon: IconName; color: string }> = {
  tunai: { label: 'Tunai', icon: 'cash', color: '#16A34A' },
  qris: { label: 'QRIS', icon: 'qrcode-scan', color: '#0284C7' },
  transfer: { label: 'Transfer', icon: 'bank-transfer', color: '#7C3AED' },
  hutang: { label: 'Hutang', icon: 'account-cash', color: '#DC2626' },
};

export interface TransactionItem {
  menuId: string;
  name: string;
  qty: number;
  unitPrice: number;
  variant: string | null;
  addons: string[];
}

export interface Transaction {
  id: string;
  orderType: OrderType;
  tableNumber: number | null;
  items: TransactionItem[];
  totalAmount: number;
  paymentMethod: PaymentMethodKey;
  transactionType: 'offline' | 'online';
  syncStatus: 'pending' | 'synced';
  createdAt: string;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const daysAgo = (d: number, h = 10) => new Date(Date.now() - d * 86_400_000 - (24 - h) * 3_600_000).toISOString();

export const transactionsSeed: Transaction[] = [
  {
    id: 'TRX-0001',
    orderType: 'dine_in',
    tableNumber: 3,
    items: [
      { menuId: 'm2', name: 'Babi Guling Spesial', qty: 2, unitPrice: 35_000, variant: null, addons: ['Tambah Kulit'] },
      { menuId: 'm9', name: 'Es Teh Manis', qty: 2, unitPrice: 5_000, variant: null, addons: [] },
    ],
    totalAmount: 90_000,
    paymentMethod: 'qris',
    transactionType: 'online',
    syncStatus: 'synced',
    createdAt: hoursAgo(1),
  },
  {
    id: 'TRX-0002',
    orderType: 'takeaway',
    tableNumber: null,
    items: [
      { menuId: 'm1', name: 'Babi Guling Biasa', qty: 1, unitPrice: 30_000, variant: 'Porsi Jumbo', addons: ['Kerupuk Babi'] },
    ],
    totalAmount: 33_000,
    paymentMethod: 'tunai',
    transactionType: 'offline',
    syncStatus: 'synced',
    createdAt: hoursAgo(2),
  },
  {
    id: 'TRX-0003',
    orderType: 'dine_in',
    tableNumber: 1,
    items: [
      { menuId: 'm3', name: 'Sate Babi (10 tusuk)', qty: 1, unitPrice: 40_000, variant: 'Porsi Jumbo (15 tusuk)', addons: ['Bumbu Tambahan'] },
      { menuId: 'm5', name: 'Lawar Babi', qty: 1, unitPrice: 20_000, variant: null, addons: [] },
      { menuId: 'm10', name: 'Es Jeruk', qty: 1, unitPrice: 7_000, variant: null, addons: [] },
    ],
    totalAmount: 69_000,
    paymentMethod: 'tunai',
    transactionType: 'offline',
    syncStatus: 'synced',
    createdAt: hoursAgo(4),
  },
  {
    id: 'TRX-0004',
    orderType: 'takeaway',
    tableNumber: null,
    items: [
      { menuId: 'm1', name: 'Babi Guling Biasa', qty: 3, unitPrice: 25_000, variant: null, addons: [] },
      { menuId: 'm7', name: 'Sambal Matah', qty: 3, unitPrice: 5_000, variant: null, addons: [] },
    ],
    totalAmount: 90_000,
    paymentMethod: 'transfer',
    transactionType: 'online',
    syncStatus: 'synced',
    createdAt: daysAgo(1, 13),
  },
  {
    id: 'TRX-0005',
    orderType: 'dine_in',
    tableNumber: 2,
    items: [
      { menuId: 'm2', name: 'Babi Guling Spesial', qty: 1, unitPrice: 35_000, variant: 'Tanpa Nasi', addons: [] },
      { menuId: 'm6', name: 'Lawar Campur', qty: 1, unitPrice: 22_000, variant: null, addons: [] },
    ],
    totalAmount: 52_000,
    paymentMethod: 'hutang',
    transactionType: 'offline',
    syncStatus: 'synced',
    createdAt: daysAgo(1, 19),
  },
  {
    id: 'TRX-0006',
    orderType: 'takeaway',
    tableNumber: null,
    items: [
      { menuId: 'm3', name: 'Sate Babi (10 tusuk)', qty: 2, unitPrice: 30_000, variant: null, addons: ['Nasi Putih'] },
      { menuId: 'm10', name: 'Es Jeruk', qty: 2, unitPrice: 7_000, variant: null, addons: [] },
    ],
    totalAmount: 84_000,
    paymentMethod: 'qris',
    transactionType: 'online',
    syncStatus: 'pending',
    createdAt: daysAgo(2, 11),
  },
  {
    id: 'TRX-0007',
    orderType: 'dine_in',
    tableNumber: 4,
    items: [
      { menuId: 'm5', name: 'Lawar Babi', qty: 2, unitPrice: 20_000, variant: 'Porsi Jumbo', addons: ['Tambah Kerupuk'] },
      { menuId: 'm9', name: 'Es Teh Manis', qty: 2, unitPrice: 5_000, variant: null, addons: [] },
    ],
    totalAmount: 64_000,
    paymentMethod: 'tunai',
    transactionType: 'offline',
    syncStatus: 'synced',
    createdAt: daysAgo(4, 12),
  },
  {
    id: 'TRX-0008',
    orderType: 'takeaway',
    tableNumber: null,
    items: [
      { menuId: 'm4', name: 'Sate Babi Kecil', qty: 5, unitPrice: 15_000, variant: null, addons: [] },
    ],
    totalAmount: 75_000,
    paymentMethod: 'tunai',
    transactionType: 'offline',
    syncStatus: 'synced',
    createdAt: daysAgo(6, 17),
  },
  {
    id: 'TRX-0009',
    orderType: 'takeaway',
    tableNumber: null,
    items: [
      { menuId: 'm1', name: 'Babi Guling Biasa', qty: 2, unitPrice: 25_000, variant: null, addons: [] },
      { menuId: 'm7', name: 'Sambal Matah', qty: 2, unitPrice: 5_000, variant: null, addons: [] },
    ],
    totalAmount: 60_000,
    paymentMethod: 'tunai',
    transactionType: 'offline',
    syncStatus: 'pending',
    createdAt: hoursAgo(0.5),
  },
  {
    id: 'TRX-0010',
    orderType: 'dine_in',
    tableNumber: 2,
    items: [
      { menuId: 'm5', name: 'Lawar Babi', qty: 1, unitPrice: 20_000, variant: null, addons: [] },
      { menuId: 'm9', name: 'Es Teh Manis', qty: 1, unitPrice: 5_000, variant: null, addons: [] },
    ],
    totalAmount: 25_000,
    paymentMethod: 'qris',
    transactionType: 'online',
    syncStatus: 'pending',
    createdAt: hoursAgo(1.5),
  },
];

export interface CashRecord {
  id: string;
  type: 'masuk' | 'keluar';
  title: string;
  amount: number;
  createdAt: string;
}

export const cashRecordsSeed: CashRecord[] = [
  { id: 'cr-1', type: 'masuk', title: 'Penjualan tunai', amount: 620_000, createdAt: hoursAgo(1) },
  { id: 'cr-2', type: 'keluar', title: 'Setoran kas', amount: 400_000, createdAt: hoursAgo(3) },
  { id: 'cr-3', type: 'keluar', title: 'Beli daging babi', amount: 250_000, createdAt: hoursAgo(5) },
  { id: 'cr-4', type: 'masuk', title: 'Penjualan tunai', amount: 480_000, createdAt: daysAgo(1, 15) },
  { id: 'cr-5', type: 'keluar', title: 'Beli sayur lawar', amount: 80_000, createdAt: daysAgo(2, 8) },
];

export interface CustomerDebt {
  id: string;
  customerName: string;
  amount: number;
  note: string;
  status: 'unpaid' | 'paid';
  createdAt: string;
}

export const customerDebtsSeed: CustomerDebt[] = [
  { id: 'cd-1', customerName: 'Pak Wayan', amount: 120_000, note: 'Pesanan dine-in meja 2', status: 'unpaid', createdAt: daysAgo(1, 19) },
  { id: 'cd-2', customerName: 'Pak Ketut', amount: 75_000, note: 'Sate babi takeaway', status: 'unpaid', createdAt: daysAgo(2, 13) },
  { id: 'cd-3', customerName: 'Bu Nyoman', amount: 45_000, note: 'Nasi babi guling', status: 'unpaid', createdAt: daysAgo(3, 12) },
  { id: 'cd-4', customerName: 'Pak Wayan', amount: 60_000, note: 'Lawar + sate', status: 'paid', createdAt: daysAgo(10, 18) },
];

export interface SupplierDebt {
  id: string;
  supplierName: string;
  amount: number;
  note: string;
  dueDate: string;
  status: 'unpaid' | 'paid';
  createdAt: string;
}

export const supplierDebtsSeed: SupplierDebt[] = [
  { id: 'sd-1', supplierName: 'Penjual Babi Pak Gede', amount: 1_200_000, note: 'Stok daging 2 minggu', dueDate: daysAgo(-3, 8), status: 'unpaid', createdAt: daysAgo(11, 8) },
  { id: 'sd-2', supplierName: 'Toko Sayur Wayan', amount: 350_000, note: 'Sayur lawar 2 minggu', dueDate: daysAgo(-1, 8), status: 'unpaid', createdAt: daysAgo(13, 8) },
  { id: 'sd-3', supplierName: 'Penjual Babi Pak Gede', amount: 900_000, note: 'Stok daging minggu lalu', dueDate: daysAgo(7, 8), status: 'paid', createdAt: daysAgo(18, 8) },
];

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export const customersSeed: Customer[] = [
  { id: 'c-1', name: 'Pak Wayan', phone: '0812-3456-7890' },
  { id: 'c-2', name: 'Pak Ketut', phone: '0813-9876-5432' },
  { id: 'c-3', name: 'Bu Nyoman', phone: '0851-1122-3344' },
  { id: 'c-4', name: 'Ibu Made', phone: '0822-5566-7788' },
];

export interface AppNotification {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notificationsSeed: AppNotification[] = [
  { id: 'n-1', type: 'danger', title: 'Stok Babi Guling Spesial menipis', message: 'Sisa 12 porsi. Segera tambah stok bahan.', read: false, createdAt: hoursAgo(2) },
  { id: 'n-2', type: 'warning', title: 'Bahan kedaluwarsa besok', message: 'Sayur lawar harus segera digunakan sebelum basi.', read: false, createdAt: hoursAgo(5) },
  { id: 'n-3', type: 'success', title: 'Sinkronisasi selesai', message: '5 transaksi offline berhasil dikirim ke server.', read: false, createdAt: hoursAgo(8) },
  { id: 'n-4', type: 'info', title: 'Hutang jatuh tempo', message: 'Pembayaran ke Toko Sayur Wayan sebesar Rp350.000 segera jatuh tempo.', read: true, createdAt: daysAgo(1, 9) },
  { id: 'n-5', type: 'warning', title: 'Stok Sate Babi Kecil habis', message: 'Sate Babi Kecil tidak tersedia di kasir.', read: true, createdAt: daysAgo(2, 10) },
];

export interface DailySale {
  label: string;
  total: number;
}

export const weeklySalesChart: DailySale[] = [
  { label: 'Sen', total: 1_050_000 },
  { label: 'Sel', total: 1_240_000 },
  { label: 'Rab', total: 980_000 },
  { label: 'Kam', total: 1_420_000 },
  { label: 'Jum', total: 1_680_000 },
  { label: 'Sab', total: 2_150_000 },
  { label: 'Min', total: 1_285_000 },
];

export const laporanMethods: { key: PaymentMethodKey; label: string; amount: number; color: string }[] = [
  { key: 'tunai', label: 'Tunai', amount: 620_000, color: '#16A34A' },
  { key: 'qris', label: 'QRIS', amount: 385_000, color: '#0284C7' },
  { key: 'transfer', label: 'Transfer', amount: 180_000, color: '#7C3AED' },
  { key: 'hutang', label: 'Hutang', amount: 100_000, color: '#DC2626' },
];
