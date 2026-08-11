import { createContext } from "react";

export interface CacheEntry<T = unknown> {
  data: T;
  /** epoch ms the value was stored — used for staleness checks. */
  at: number;
}

export interface DataCacheValue {
  /** Read without triggering a fetch. */
  peek<T>(key: string): CacheEntry<T> | undefined;
  /** Fetch through the cache, de-duplicating concurrent calls for the key. */
  fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
  /** Write a value directly (e.g. after a create/update round-trip). */
  set<T>(key: string, data: T): void;
  /** Drop everything, or every key starting with `prefix`. */
  invalidate(prefix?: string): void;
}

export const DataCacheContext = createContext<DataCacheValue | undefined>(undefined);
