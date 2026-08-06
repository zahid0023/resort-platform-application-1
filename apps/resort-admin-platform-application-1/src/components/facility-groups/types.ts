import type { IconValue } from "@/components/shared/icon-picker"
import type { FacilityGroup, FacilityGroupSummary, IconType } from "@/services/facility-groups"
import type { FacilityScope } from "@/services/facility-scopes"
import type { Locale } from "@/services/locales"

export type FacilityGroupDialogMode = "create" | "view"

export interface LocaleRow {
  id?: number
  /** Present on existing rows — read from the API, immutable once created */
  locale?: Locale
  /** Only set while adding a brand-new translation row — the language being assigned */
  locale_id?: number | ""
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface FacilityGroupFormState {
  code: string
  sort_order: number
  icon: IconValue
  /** Create mode only — the single "en" translation created alongside the group */
  locale: { name: string; description: string; sort_order: number }
  /** View mode only — every existing translation, populated after creation */
  locales: LocaleRow[]
  /** Create mode only — facility scopes picked via FacilityScopePickerDialog, sent as facility_scope_ids */
  scopes: FacilityScope[]
  /** View mode only — the group's currently assigned scopes, from GET /facility-groups/{id}'s embedded
   * facility_scopes (fetched once when the card is clicked — not re-fetched when the Scopes tab opens) */
  facility_scopes: FacilityScope[]
}

/** Convert API entity → IconValue for the icon system. */
export function toIconValue(group: FacilityGroupSummary | FacilityGroup): IconValue {
  return {
    type: (group.icon_type ?? "") as IconType | "",
    value: group.icon_value ?? "",
    meta: Object.fromEntries(
      Object.entries(group.icon_meta ?? {}).map(([k, v]) => [k, String(v)]),
    ),
  }
}

/** Convert IconValue → API payload fields. */
export function fromIconValue(icon: IconValue) {
  return {
    icon_type: icon.type as IconType,
    icon_value: icon.value || undefined,
    icon_meta: Object.keys(icon.meta).length > 0 ? icon.meta : undefined,
  }
}
