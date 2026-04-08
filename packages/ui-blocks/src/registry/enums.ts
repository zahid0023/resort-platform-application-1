/**
 * Enums for schema.json fields that must match database records.
 *
 * Keep these in sync with the database:
 *   - UI_BLOCK_CATEGORY_KEYS  →  ui_block_category.key
 *   - PAGE_TYPE_KEYS          →  page_type.key
 *
 * Adding a new value here without the matching DB record will cause
 * the approve dialog to show a schema mismatch warning.
 *
 * Using an invalid value in schema.json (one not listed here) will
 * cause a TypeScript compile error.
 */

export const UI_BLOCK_CATEGORY_KEYS = [
  "hero",
  "gallery",
  // add new ui_block_category.key values here
] as const;

export type UiBlockCategoryKey = (typeof UI_BLOCK_CATEGORY_KEYS)[number];

export const PAGE_TYPE_KEYS = [
  "landing",
  // add new page_type.key values here
] as const;

export type PageTypeKey = (typeof PAGE_TYPE_KEYS)[number];

/**
 * AllowedPageKey references the same page_type.key values.
 * A block's allowedPages must be a subset of PAGE_TYPE_KEYS.
 */
export type AllowedPageKey = PageTypeKey;
