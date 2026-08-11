import { shareReceiptPdf } from '../utils/receiptPdf';

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const mockDevices: PrinterDevice[] = [
  { id: 'dev-1', name: 'Thermal Printer 58mm', address: 'AA:BB:CC:DD:EE:01' },
  { id: 'dev-2', name: 'RS-80BT', address: 'AA:BB:CC:DD:EE:02' },
  { id: 'dev-3', name: 'POS Printer BT', address: 'AA:BB:CC:DD:EE:03' },
];

export interface PrinterService {
  scan(): Promise<PrinterDevice[]>;
  connect(device: PrinterDevice): Promise<void>;
  disconnect(): Promise<void>;
  testPrint(device: PrinterDevice | null): Promise<void>;
}

export const printerService: PrinterService = {
  async scan() {
    await delay(1500);
    return mockDevices;
  },

  async connect() {
    await delay(1200);
  },

  async disconnect() {
    await delay(300);
  },

  async testPrint() {
    await delay(600);
    await shareReceiptPdf({
      orderId: 'UJI-CETAK',
      createdAt: new Date().toISOString(),
      orderType: 'dine_in',
      tableNumber: null,
      items: [
        { name: 'Babi Guling Spesial', qty: 1, unitPrice: 35_000, variant: null, addons: ['Tambah Kulit'], note: '' },
        { name: 'Es Teh Manis', qty: 2, unitPrice: 5_000, variant: null, addons: [], note: '' },
      ],
      subtotal: 47_000,
      total: 47_000,
      paymentMethod: 'tunai',
      transactionType: 'offline',
    });
  },
};
