import { useCallback, useEffect, useRef, useState } from 'react';

export function useDbList<T>(loader: () => Promise<T[]>): {
  data: T[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loaderRef.current());
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
