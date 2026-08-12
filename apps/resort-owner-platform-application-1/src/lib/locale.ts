import i18n from "@/i18n";

export interface LocaleOption {
  id: number;
  code: string;
}

export interface TranslatableRow {
  locale_id: number;
}

/**
 * Client-side fallback for entities whose getById response returns every
 * translation unscoped (Accept-Language is required but ignored on those
 * endpoints). Mirrors the backend's own getAll resolution: preferred code,
 * then "en", then whatever is first.
 */
export function pickTranslation<T extends TranslatableRow>(
  rows: T[] | undefined | null,
  locales: LocaleOption[],
  preferredCode: string = i18n.resolvedLanguage ?? i18n.language ?? "en",
): T | null {
  if (!rows || rows.length === 0) return null;
  const codeById = new Map(locales.map((l) => [l.id, l.code]));
  return (
    rows.find((r) => codeById.get(r.locale_id) === preferredCode) ??
    rows.find((r) => codeById.get(r.locale_id) === "en") ??
    rows[0]
  );
}

/**
 * Whether a new locale translation can still be added to an entity — a decision kept deliberately
 * separate from the row-level create/edit/delete logic of `*LocaleTranslations` components.
 *
 * `totalLocaleCount` is the true system-wide locale count from `GET /locales/count`, not the
 * length of whatever page of `GET /locales` happened to be fetched for the dropdown (that list is
 * capped at 50 per page and can undercount). `null`/non-positive means the count hasn't loaded
 * yet — treated as "assume there's room" so the Add button never wrongly disables before the
 * count is known.
 */
export function canAddLocaleTranslation(usedLocaleCount: number, totalLocaleCount: number | null): boolean {
  if (totalLocaleCount == null || totalLocaleCount <= 0) return true;
  return usedLocaleCount < totalLocaleCount;
}
