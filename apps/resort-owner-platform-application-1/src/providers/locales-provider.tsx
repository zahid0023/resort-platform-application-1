"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { localesService, type Locale } from "@/services/locales";

interface LocalesContextValue {
  /** The full locale catalog. NOT fetched at session start — `GET /locales` only fires the first
   * time some consumer actually needs the catalog (e.g. a translations tab), via `refresh()`.
   * Session start only loads `totalCount` (see below). */
  locales: Locale[];
  /** True total of active locales system-wide, from `GET /locales/count` — not `locales.length`.
   * Loaded once when the provider mounts (session start, i.e. right after login/page refresh) since
   * it's cheap and needed immediately for "are there any locales left without a translation" checks
   * without paying for the full catalog fetch.
   * The list endpoint also caps `size` at 50 per page, so `locales` may not hold every locale that
   * exists even once loaded — `totalCount` stays the authoritative count regardless.
   * `null` until the first successful fetch resolves. */
  totalCount: number | null;
  loading: boolean;
  loaded: boolean;
  /** Re-fetches both the catalog and the total count from the server and returns the fresh catalog.
   * This is the only thing that ever triggers `GET /locales` — call it when a consumer first needs
   * the catalog or wants to pick up locales created elsewhere during the current session. */
  refresh: () => Promise<Locale[]>;
  /** Re-fetches only `GET /locales/count`, leaving the catalog untouched. Use this for a manual
   * "Refresh" action on a translations section — it only needs the up-to-date total to drive the
   * +Add button's disabled state, not the full paginated catalog. */
  refreshCount: () => Promise<number>;
}

const LocalesContext = createContext<LocalesContextValue | null>(null);

export function LocalesProvider({ children }: { children: React.ReactNode }) {
  const [locales, setLocales] = useState<Locale[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Collapses concurrent refresh() calls (e.g. two panels loading their translations tab in the
  // same tick) into a single in-flight request instead of firing the fetch twice.
  const inFlight = useRef<Promise<Locale[]> | null>(null);

  const refresh = useCallback((): Promise<Locale[]> => {
    if (inFlight.current) return inFlight.current;
    setLoading(true);
    const promise = Promise.all([
      localesService.list({ size: 50, sort_by: "sortOrder", sort_dir: "ASC" }),
      localesService.count(),
    ])
      .then(([listRes, countRes]) => {
        setLocales(listRes.data);
        setTotalCount(countRes.count);
        setLoaded(true);
        return listRes.data;
      })
      .finally(() => {
        setLoading(false);
        inFlight.current = null;
      });
    inFlight.current = promise;
    return promise;
  }, []);

  const refreshCount = useCallback((): Promise<number> => {
    return localesService.count().then((res) => {
      setTotalCount(res.count);
      return res.count;
    });
  }, []);

  // Session start (page load/refresh) only needs the count — cheap, and enough to drive disabled
  // states before any consumer even loads. The full catalog (`GET /locales`) is deferred to
  // `refresh()`, fired on demand the first time a consumer needs it (see `refresh` above).
  useEffect(() => {
    localesService
      .count()
      .then((res) => setTotalCount(res.count))
      .catch((err) => toast.error((err as Error).message));
  }, []);

  return (
    <LocalesContext.Provider value={{ locales, totalCount, loading, loaded, refresh, refreshCount }}>
      {children}
    </LocalesContext.Provider>
  );
}

export function useLocales(): LocalesContextValue {
  const ctx = useContext(LocalesContext);
  if (!ctx) throw new Error("useLocales must be used within a LocalesProvider");
  return ctx;
}
