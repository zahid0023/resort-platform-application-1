import type { IconValue } from "@/components/shared/icon-picker"
import type { FacilityGroup, FacilityGroupSummary, IconType } from "@/services/facility-groups"

export type FacilityGroupDialogMode = "create" | "view"

export interface LocaleRow {
  id?: number
  locale_id: number | ""
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface FacilityGroupFormState {
  code: string
  sort_order: number
  icon: IconValue
  locales: LocaleRow[]
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
