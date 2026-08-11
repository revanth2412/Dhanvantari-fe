import { useContext } from "react";
import { DataCacheContext } from "@/context/dataCacheContext";

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) {
    throw new Error("useDataCache must be used within a <DataCacheProvider>");
  }
  return ctx;
}
