import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { transactionsSeed } from '../data/mock';

const pendingFromSeed = transactionsSeed
  .filter((t) => t.syncStatus === 'pending')
  .map((t) => t.id);

interface SyncContextValue {
  pendingIds: string[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  autoSync: boolean;
  setAutoSync: (value: boolean) => void;
  syncNow: () => Promise<number>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const netInfo = useNetInfo();
  const [pendingIds, setPendingIds] = useState<string[]>(pendingFromSeed);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  const syncNow = useCallback(async () => {
    if (isSyncing) return 0;
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const count = pendingIds.length;
    setPendingIds([]);
    setLastSyncedAt(new Date().toISOString());
    setIsSyncing(false);
    return count;
  }, [isSyncing, pendingIds]);

  useEffect(() => {
    if (autoSync && netInfo.isConnected === true && pendingIds.length > 0) {
      syncNow();
    }
  }, [netInfo.isConnected, autoSync, pendingIds.length, syncNow]);

  const value = useMemo(
    () => ({
      pendingIds,
      isSyncing,
      lastSyncedAt,
      autoSync,
      setAutoSync,
      syncNow,
    }),
    [pendingIds, isSyncing, lastSyncedAt, autoSync, syncNow]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync harus dipakai di dalam SyncProvider');
  }
  return ctx;
}
