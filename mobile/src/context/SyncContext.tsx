import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { syncRepo } from '../db/repositories';

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
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  const refreshPending = useCallback(async () => {
    const ids = await syncRepo.getPendingIds();
    setPendingIds(ids);
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const syncNow = useCallback(async () => {
    if (isSyncing) return 0;
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    try {
      const count = await syncRepo.flush();
      setLastSyncedAt(new Date().toISOString());
      await refreshPending();
      return count;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPending]);

  useEffect(() => {
    if (autoSync && netInfo.isConnected === true && pendingIds.length > 0 && !isSyncing) {
      syncNow();
    }
  }, [netInfo.isConnected, autoSync, pendingIds.length, isSyncing, syncNow]);

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
