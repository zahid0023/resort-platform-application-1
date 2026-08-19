"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { daysOfWeekService, type DayOfWeek } from "@/services/days-of-week";

interface DaysOfWeekContextValue {
  /** All seven days of week. NOT fetched at session start — `GET /days-of-week` only fires the
   * first time some consumer actually needs the catalog (e.g. an operating-hours tab), via
   * `refresh()`. The list is fixed and platform-seeded, so a single page (size 50) always holds
   * every record — no separate count endpoint is needed like the locale catalog has. */
  daysOfWeek: DayOfWeek[];
  loading: boolean;
  loaded: boolean;
  /** Re-fetches the catalog and returns it fresh. The only thing that ever triggers
   * `GET /days-of-week` — call it when a consumer first needs the catalog. */
  refresh: () => Promise<DayOfWeek[]>;
}

const DaysOfWeekContext = createContext<DaysOfWeekContextValue | null>(null);

export function DaysOfWeekProvider({ children }: { children: React.ReactNode }) {
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Collapses concurrent refresh() calls into a single in-flight request instead of firing twice.
  const inFlight = useRef<Promise<DayOfWeek[]> | null>(null);

  const refresh = useCallback((): Promise<DayOfWeek[]> => {
    if (inFlight.current) return inFlight.current;
    setLoading(true);
    const promise = daysOfWeekService
      .list({ size: 50 })
      .then((res) => {
        setDaysOfWeek(res.data);
        setLoaded(true);
        return res.data;
      })
      .finally(() => {
        setLoading(false);
        inFlight.current = null;
      });
    inFlight.current = promise;
    return promise;
  }, []);

  return (
    <DaysOfWeekContext.Provider value={{ daysOfWeek, loading, loaded, refresh }}>
      {children}
    </DaysOfWeekContext.Provider>
  );
}

export function useDaysOfWeek(): DaysOfWeekContextValue {
  const ctx = useContext(DaysOfWeekContext);
  if (!ctx) throw new Error("useDaysOfWeek must be used within a DaysOfWeekProvider");
  return ctx;
}
