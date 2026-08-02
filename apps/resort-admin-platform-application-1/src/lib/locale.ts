import i18n from "@/i18n";

export interface LocaleOption {
  id: number;
  code: string;
}

// Either shape works: a row that embeds its own `locale` object directly (e.g. CountryLocale),
// or a row that only carries a `locale_id` foreign key, resolved against a separately-loaded
// locales list (e.g. entities generated before locale embedding was standardized).
export interface TranslatableRow {
  locale?: { code: string };
  locale_id?: number;
}

/**
 * Client-side fallback for entities whose getById response returns every
 * translation unscoped (Accept-Language is required but ignored on those
 * endpoints). Mirrors the backend's own getAll resolution: preferred code,
 * then "en", then whatever is first.
 */
export function pickTranslation<T extends TranslatableRow>(
  rows: T[] | undefined | null,
  locales: LocaleOption[] = [],
  preferredCode: string = i18n.resolvedLanguage ?? i18n.language ?? "en",
): T | null {
  if (!rows || rows.length === 0) return null;
  const codeById = new Map(locales.map((l) => [l.id, l.code]));
  const codeOf = (r: T) => r.locale?.code ?? (r.locale_id != null ? codeById.get(r.locale_id) : undefined);
  return (
    rows.find((r) => codeOf(r) === preferredCode) ??
    rows.find((r) => codeOf(r) === "en") ??
    rows[0]
  );
}
