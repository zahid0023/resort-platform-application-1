"use client"

/**
 * EntityIconFields — thin wrapper around IconPicker for use inside entity dialogs.
 *
 * Data model: IconValue { type, value, meta }
 * The `meta` object is strategy-specific (e.g. { color, size } for LUCIDE).
 */
export { IconPicker as EntityIconFields } from "./icon-picker"
export type { IconPickerProps as EntityIconFieldsProps } from "./icon-picker"

// Re-export types so existing imports still resolve
export type { IconType, IconValue } from "./icon-picker"
export { EMPTY_ICON_VALUE } from "./icon-picker"
