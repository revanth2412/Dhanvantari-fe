import { useCallback, useEffect, useRef, useState } from "react";
import { useDataCache } from "@/hooks/useDataCache";

interface Options {
  /** How long a cached value is considered fresh. Default 60s. */
  ttlMs?: number;
  /** Skip the request entirely (e.g. a route param isn't ready). */
  enabled?: boolean;
}

export interface CachedQuery<T> {
  data: T | undefined;
  /** No data to show yet — render a skeleton. */
  loading: boolean;
  /** Showing cached data while revalidating in the background. */
  refreshing: boolean;
  error: unknown;
  /** Force a network round-trip. */
  refresh: () => Promise<void>;
  /** Replace the value locally and in the cache (after a mutation). */
  mutate: (next: T) => void;
}

/**
 * Cache-first data loading with stale-while-revalidate.
 *
 * A key that is already cached renders immediately with no loading state and no
 * duplicate request; if the entry is older than `ttlMs` it is refreshed quietly
 * in the background.
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttlMs = 60_000, enabled = true }: Options = {},
): CachedQuery<T> {
  const cache = useDataCache();
  const [data, setData] = useState<T | undefined>(() => cache.peek<T>(key)?.data);
  const [loading, setLoading] = useState(enabled && cache.peek<T>(key) === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Keeps the latest fetcher without making it an effect dependency (callers
  // routinely pass an inline arrow).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  // Guards against a slow response for an old key overwriting a newer one.
  const requestId = useRef(0);

  const run = useCallback(
    async (background: boolean) => {
      const token = ++requestId.current;
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await cache.fetch<T>(key, () => fetcherRef.current());
        if (token !== requestId.current) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (token !== requestId.current) return;
        // Aborted requests are a normal part of debounced search — not an error.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err);
        if (!background) setData(undefined);
      } finally {
        if (token === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [cache, key],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const cached = cache.peek<T>(key);
    if (cached) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      if (Date.now() - cached.at > ttlMs) void run(true);
      return;
    }
    setData(undefined);
    void run(false);
  }, [key, enabled, ttlMs, cache, run]);

  const refresh = useCallback(() => run(true), [run]);

  const mutate = useCallback(
    (next: T) => {
      cache.set(key, next);
      setData(next);
    },
    [cache, key],
  );

  return { data, loading, refreshing, error, refresh, mutate };
}
