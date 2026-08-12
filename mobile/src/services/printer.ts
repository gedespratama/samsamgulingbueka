import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, type Device } from 'react-native-ble-plx';
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

const isWeb = Platform.OS === 'web';

let manager: BleManager | null = null;

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

async function ensurePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const api = Number(Platform.Version);
  if (api >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
    );
  }
  const fine = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return fine === 'granted';
}

function toDevice(device: Device): PrinterDevice {
  return {
    id: device.id,
    name: device.name ?? device.localName ?? 'Perangkat Bluetooth',
    address: device.localName ?? device.id,
  };
}

export interface PrinterService {
  scan(): Promise<PrinterDevice[]>;
  connect(device: PrinterDevice): Promise<void>;
  disconnect(): Promise<void>;
  testPrint(device: PrinterDevice | null): Promise<void>;
  isBluetoothEnabled(): Promise<boolean>;
}

let connectedId: string | null = null;

const finalStates = ['PoweredOn', 'PoweredOff', 'Unsupported', 'Unauthorized'] as const;

function waitForBluetoothState(mgr: BleManager): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const sub = mgr.onStateChange((state) => {
      if (finalStates.includes(state as (typeof finalStates)[number])) {
        if (!settled) {
          settled = true;
          sub.remove();
          resolve(state === 'PoweredOn');
        }
      }
    }, true);
    setTimeout(async () => {
      if (!settled) {
        settled = true;
        sub.remove();
        try {
          const cached = await mgr.state();
          resolve(cached === 'PoweredOn');
        } catch {
          resolve(false);
        }
      }
    }, 4000);
  });
}

export const printerService: PrinterService = {
  async isBluetoothEnabled(): Promise<boolean> {
    if (isWeb) return true;
    try {
      const mgr = getManager();
      const cached = await mgr.state();
      if (cached === 'PoweredOn') return true;
      if (cached === 'PoweredOff' || cached === 'Unsupported' || cached === 'Unauthorized') {
        return false;
      }
      return await waitForBluetoothState(mgr);
    } catch {
      return false;
    }
  },

  async scan(): Promise<PrinterDevice[]> {
    if (isWeb) {
      await delay(1500);
      return mockDevices;
    }
    const enabled = await this.isBluetoothEnabled();
    if (!enabled) throw new Error('Bluetooth belum aktif.');
    const granted = await ensurePermissions();
    if (!granted) throw new Error('Izin Bluetooth ditolak.');

    const found = new Map<string, PrinterDevice>();
    getManager().startDeviceScan(null, null, (error, device) => {
      if (error) return;
      if (device && !found.has(device.id)) {
        found.set(device.id, toDevice(device));
      }
    });
    await delay(5000);
    getManager().stopDeviceScan();
    return Array.from(found.values());
  },

  async connect(device: PrinterDevice): Promise<void> {
    if (isWeb) {
      await delay(1200);
      return;
    }
    const connected = await getManager().connectToDevice(device.id, { timeout: 10000 });
    await connected.discoverAllServicesAndCharacteristics();
    connectedId = device.id;
  },

  async disconnect(): Promise<void> {
    if (isWeb) {
      await delay(300);
      return;
    }
    try {
      getManager().stopDeviceScan();
      if (connectedId) {
        await getManager().cancelDeviceConnection(connectedId);
      }
    } catch {
      // koneksi sudah terputus
    } finally {
      connectedId = null;
    }
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
