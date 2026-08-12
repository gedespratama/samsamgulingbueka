import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { employeeRepo, settingsRepo } from '../db/repositories';
import type { Employee } from '../data/mock';

const CASHIER_KEY = 'active_cashier';

interface CashierContextValue {
  cashier: Employee | null;
  loaded: boolean;
  isLocked: boolean;
  switchCashier: (employee: Employee) => Promise<void>;
  unlock: (employee: Employee, pin: string) => Promise<boolean>;
  lock: () => void;
}

const CashierContext = createContext<CashierContextValue | undefined>(undefined);

export function CashierProvider({ children }: { children: ReactNode }) {
  const [cashier, setCashier] = useState<Employee | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const employees = await employeeRepo.getAll();
        const storedId = await settingsRepo.get(CASHIER_KEY);
        const stored = storedId ? employees.find((e) => e.id === storedId) : null;
        if (active) {
          setCashier(stored ?? employees.find((e) => e.active) ?? null);
        }
      } catch {
        if (active) setCashier(null);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persistCashier = useCallback(async (employee: Employee) => {
    setCashier(employee);
    try {
      await settingsRepo.set(CASHIER_KEY, employee.id);
    } catch {
      // simpanan gagal tidak menghentikan pergantian kasir
    }
  }, []);

  const switchCashier = useCallback(
    async (employee: Employee) => {
      await persistCashier(employee);
    },
    [persistCashier]
  );

  const unlock = useCallback(
    async (employee: Employee, pin: string) => {
      if (employee.pin && pin === employee.pin) {
        await persistCashier(employee);
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [persistCashier]
  );

  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);

  const value = useMemo(
    () => ({ cashier, loaded, isLocked, switchCashier, unlock, lock }),
    [cashier, loaded, isLocked, switchCashier, unlock, lock]
  );

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
}

export function useCashier(): CashierContextValue {
  const ctx = useContext(CashierContext);
  if (!ctx) {
    throw new Error('useCashier harus dipakai di dalam CashierProvider');
  }
  return ctx;
}
