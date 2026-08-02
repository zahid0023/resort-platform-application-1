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
