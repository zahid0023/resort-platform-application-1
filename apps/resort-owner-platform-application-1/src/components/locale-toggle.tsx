"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui";
import { localesService, type Locale } from "@/services/locales";

// Static, zero-API-call display names for the codes this app ships with (see SUPPORTED_LANGS in
// @/i18n) — the persisted code alone is enough to show a label, no request needed just to render it.
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
};

const APP_LANG_KEY = "app.lang";

export function LocaleToggle() {
  const { i18n } = useTranslation();
  const [locales, setLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Prefer the persisted code over i18n's own state: right after a refresh, i18next-browser-
  // languagedetector resolves asynchronously, so i18n.language can briefly report the fallback
  // ("en") for a tick before flipping to what was actually saved — reading localStorage directly
  // avoids that flash. This component only ever renders client-side (gated by the parent portal
  // layout's auth check), so there's no SSR/hydration mismatch risk in reading it eagerly here.
  const persisted = typeof window !== "undefined" ? localStorage.getItem(APP_LANG_KEY) : null;
  const current = persisted ?? i18n.resolvedLanguage ?? i18n.language;
  const currentLabel = (current && LANGUAGE_NAMES[current]) ?? current?.toUpperCase();

  const handleOpenChange = (open: boolean) => {
    if (!open || loaded || loading) return;
    setLoading(true);
    localesService
      .list({ size: 50, sort_by: "sortOrder", sort_dir: "ASC" })
      .then((res) => {
        setLocales(res.data);
        setLoaded(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleChange = async (code: string) => {
    if (code === current) return;
    localStorage.setItem("app.lang", code);
    await i18n.changeLanguage(code);
    // Every list/detail response already has its translations resolved server-side from
    // Accept-Language — data fetched under the old language won't retroactively relabel itself,
    // so the current page needs to re-request everything under the new one.
    window.location.reload();
  };

  return (
    <Select value={current} onValueChange={handleChange} onOpenChange={handleOpenChange}>
      <SelectTrigger className="h-8 w-auto border-0 bg-transparent px-2 shadow-none focus:ring-0">
        <SelectValue placeholder={currentLabel}>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {loading ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</div>
        ) : loaded && locales.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No languages found</div>
        ) : (
          locales.map((locale) => (
            <SelectItem key={locale.id} value={locale.code}>
              {locale.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
