import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { printerService, type PrinterDevice } from '../services/printer';

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected';

interface PrinterContextValue {
  status: PrinterStatus;
  device: PrinterDevice | null;
  scanning: boolean;
  devices: PrinterDevice[];
  bluetoothEnabled: boolean | null;
  checkBluetooth: () => Promise<boolean>;
  scanDevices: () => Promise<void>;
  connect: (device: PrinterDevice) => Promise<void>;
  disconnect: () => Promise<void>;
  testPrint: () => Promise<void>;
}

const PrinterContext = createContext<PrinterContextValue | undefined>(undefined);

export function PrinterProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PrinterStatus>('disconnected');
  const [device, setDevice] = useState<PrinterDevice | null>(null);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean | null>(null);

  const checkBluetooth = useCallback(async () => {
    const enabled = await printerService.isBluetoothEnabled();
    setBluetoothEnabled(enabled);
    return enabled;
  }, []);

  const scanDevices = useCallback(async () => {
    setScanning(true);
    try {
      const found = await printerService.scan();
      setDevices(found);
    } finally {
      setScanning(false);
    }
  }, []);

  const connect = useCallback(async (target: PrinterDevice) => {
    setStatus('connecting');
    try {
      await printerService.connect(target);
      setDevice(target);
      setStatus('connected');
    } catch {
      setStatus('disconnected');
      throw new Error('Gagal terhubung ke printer.');
    }
  }, []);

  const disconnect = useCallback(async () => {
    await printerService.disconnect();
    setDevice(null);
    setStatus('disconnected');
    setDevices([]);
  }, []);

  const testPrint = useCallback(async () => {
    await printerService.testPrint(device);
  }, [device]);

  const value = useMemo(
    () => ({
      status,
      device,
      scanning,
      devices,
      bluetoothEnabled,
      checkBluetooth,
      scanDevices,
      connect,
      disconnect,
      testPrint,
    }),
    [
      status,
      device,
      scanning,
      devices,
      bluetoothEnabled,
      checkBluetooth,
      scanDevices,
      connect,
      disconnect,
      testPrint,
    ]
  );

  return <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>;
}

export function usePrinter(): PrinterContextValue {
  const ctx = useContext(PrinterContext);
  if (!ctx) {
    throw new Error('usePrinter harus dipakai di dalam PrinterProvider');
  }
  return ctx;
}
