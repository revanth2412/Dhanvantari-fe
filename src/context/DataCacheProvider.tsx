import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DataCacheContext,
  type CacheEntry,
  type DataCacheValue,
} from "@/context/dataCacheContext";

/**
 * In-memory API cache shared by every page.
 *
 * Navigating between pages remounts components, which previously re-ran every
 * request. Reads now go through this store: a cached value renders instantly and
 * is revalidated in the background only when stale, and concurrent requests for
 * the same key share one network call.
 *
 * Deliberately not Redux — there is no cross-page mutable state here, just
 * request results keyed by URL-ish strings, so a Map plus SWR semantics covers
 * it without another dependency or store boilerplate.
 */
export function DataCacheProvider({ children }: { children: ReactNode }) {
  const { doctor } = useAuth();
  const store = useRef(new Map<string, CacheEntry>());
  const inflight = useRef(new Map<string, Promise<unknown>>());

  // Never let one doctor's data leak into the next session.
  const doctorId = doctor?.id ?? null;
  useEffect(() => {
    store.current.clear();
    inflight.current.clear();
  }, [doctorId]);

  const value = useMemo<DataCacheValue>(
    () => ({
      peek<T>(key: string) {
        return store.current.get(key) as CacheEntry<T> | undefined;
      },
      set<T>(key: string, data: T) {
        store.current.set(key, { data, at: Date.now() });
      },
      invalidate(prefix?: string) {
        if (prefix === undefined) {
          store.current.clear();
          return;
        }
        for (const key of [...store.current.keys()]) {
          if (key.startsWith(prefix)) store.current.delete(key);
        }
      },
      async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const pending = inflight.current.get(key) as Promise<T> | undefined;
        if (pending) return pending;

        const promise = fetcher()
          .then((data) => {
            store.current.set(key, { data, at: Date.now() });
            return data;
          })
          .finally(() => {
            inflight.current.delete(key);
          });

        inflight.current.set(key, promise);
        return promise;
      },
    }),
    [],
  );

  return <DataCacheContext.Provider value={value}>{children}</DataCacheContext.Provider>;
}
