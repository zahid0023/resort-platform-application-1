"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { Button } from "@resort/shadcn-ui"
import { CircleCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { resortFacilitiesService, type CreateResortFacilityOperatingHoursEntry } from "@/services/resort-facilities"
import type { IconType } from "@/services/resort-facility-groups"
import { platformFacilitiesService, type PlatformFacilitySummary } from "@/services/platform-facilities"
import { useDaysOfWeek } from "@/providers/days-of-week-provider"
import { FacilityPicker, initCustomization, type FacilityCustomization } from "./resort-facility-group-facility-picker"

export interface ResortFacilityGroupAddFacilitiesStepProps {
  resortId: number
  newGroupId: number
  /** the platform group this resort group was linked from at creation, if any — determines whether there's anything to bulk-pick from */
  platformGroupId: number | ""
  step: 2 | 3
  onStepChange: (step: 2 | 3) => void
  onOpenChange: (open: boolean) => void
  onSaved?: () => void | Promise<void>
}

export function ResortFacilityGroupAddFacilitiesStep({
  resortId,
  newGroupId,
  platformGroupId,
  step,
  onStepChange,
  onOpenChange,
  onSaved,
}: ResortFacilityGroupAddFacilitiesStepProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { daysOfWeek, loaded: daysOfWeekLoaded, refresh: refreshDaysOfWeek } = useDaysOfWeek()

  const [platformFacilities, setPlatformFacilities] = useState<PlatformFacilitySummary[]>([])
  const [platformFacilitiesLoading, setPlatformFacilitiesLoading] = useState(false)
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<Set<number>>(new Set())
  const [facilityCustomizations, setFacilityCustomizations] = useState<Record<number, FacilityCustomization>>({})
  const [creatingFacilities, setCreatingFacilities] = useState(false)

  async function finishAndClose() {
    onOpenChange(false)
    await onSaved?.()
  }

  async function loadPlatformFacilities(platformGroupIdArg: number) {
    setPlatformFacilitiesLoading(true)
    try {
      const res = await platformFacilitiesService.list({
        facilityGroupId: platformGroupIdArg,
        size: 50,
        sort_by: "sortOrder",
        facilityScopeCodes: ["RESORT"],
      })
      setPlatformFacilities(res.data)
      setSelectedFacilityIds(new Set())
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPlatformFacilitiesLoading(false)
    }
  }

  function handleWantsFacilities() {
    if (platformGroupId) {
      onStepChange(3)
      loadPlatformFacilities(Number(platformGroupId))
    } else {
      onOpenChange(false)
      router.push(`/resorts/${resortId}/facilities`)
    }
  }

  function toggleFacility(id: number) {
    const isSelected = selectedFacilityIds.has(id)
    setSelectedFacilityIds((prev) => {
      const next = new Set(prev)
      isSelected ? next.delete(id) : next.add(id)
      return next
    })
    if (!isSelected && !facilityCustomizations[id]) {
      const f = platformFacilities.find((f) => f.id === id)
      if (f) setFacilityCustomizations((prev) => ({ ...prev, [id]: initCustomization(f) }))
    }
  }

  function handleCustomizationChange(id: number, patch: Partial<FacilityCustomization>) {
    setFacilityCustomizations((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function handleLocaleChange(id: number, patch: Partial<FacilityCustomization["locale"]>) {
    setFacilityCustomizations((prev) => {
      const custom = prev[id]
      if (!custom) return prev
      return { ...prev, [id]: { ...custom, locale: { ...custom.locale, ...patch } } }
    })
  }

  async function handleCreateFacilities() {
    if (selectedFacilityIds.size === 0) {
      finishAndClose()
      return
    }
    const toCreate = platformFacilities.filter((f) => selectedFacilityIds.has(f.id))
    const codes = toCreate.map((f) => (facilityCustomizations[f.id] ?? initCustomization(f)).code.trim())
    if (codes.some((c) => !c)) {
      toast.error(t("resortFacility.errCode"))
      return
    }
    const dupe = codes.find((c, i) => codes.indexOf(c) !== i)
    if (dupe) {
      toast.error(t("resortFacility.errDuplicateCode", { code: dupe }))
      return
    }
    setCreatingFacilities(true)
    try {
      // The create endpoint requires a full weekly schedule; this bulk-add step has no per-day
      // hours UI, so every facility starts closed all week — the owner fills in real hours
      // afterward via the facility's own Operating Hours tab.
      const days = daysOfWeekLoaded ? daysOfWeek : await refreshDaysOfWeek()
      const closedAllWeek: CreateResortFacilityOperatingHoursEntry[] = days.map((d) => ({
        day_of_week_id: d.id,
        is_closed: true,
        is_twenty_four_hours: false,
        windows: [],
      }))
      await Promise.all(
        toCreate.map((f) => {
          const custom = facilityCustomizations[f.id] ?? initCustomization(f)
          const hasIcon = !!custom.icon_type && !!custom.icon_value
          return resortFacilitiesService.create(resortId, {
            resort_facility_group_id: newGroupId,
            facility_id: f.id,
            code: custom.code.trim(),
            sort_order: custom.sort_order,
            is_highlighted: false,
            icon_type: hasIcon ? (custom.icon_type as IconType) : null,
            icon_value: hasIcon ? custom.icon_value : null,
            icon_meta: hasIcon && custom.icon_color ? { color: custom.icon_color } : null,
            locale: {
              name: custom.locale.name.trim(),
              description: custom.locale.description.trim(),
              sort_order: Number(custom.locale.sort_order) || 0,
            },
            operating_hours: closedAllWeek,
          })
        }),
      )
      toast.success(t("resortFacilityGroup.facilitiesAdded", { count: toCreate.length }))
      finishAndClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreatingFacilities(false)
    }
  }

  if (step === 2) {
    return (
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-center text-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
            <CircleCheck className="h-10 w-10 text-green-500" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h3 className="text-base font-semibold">{t("resortFacilityGroup.createdTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("resortFacilityGroup.createdAsk")}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={finishAndClose}>
            {t("resortFacilityGroup.addFacilitiesSkip")}
          </Button>
          <Button type="button" onClick={handleWantsFacilities}>
            {t("resortFacilityGroup.addFacilitiesYes")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <FacilityPicker
          facilities={platformFacilities}
          loading={platformFacilitiesLoading}
          selectedIds={selectedFacilityIds}
          onToggle={toggleFacility}
          onSelectAll={() => {
            setSelectedFacilityIds(new Set(platformFacilities.map((f) => f.id)))
            setFacilityCustomizations((prev) => {
              const next = { ...prev }
              for (const f of platformFacilities) {
                if (!next[f.id]) next[f.id] = initCustomization(f)
              }
              return next
            })
          }}
          onDeselectAll={() => setSelectedFacilityIds(new Set())}
          customizations={facilityCustomizations}
          onCustomizationChange={handleCustomizationChange}
          onLocaleChange={handleLocaleChange}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-6 py-4 border-t shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={finishAndClose}
          disabled={creatingFacilities}
        >
          {t("resortFacilityGroup.addFacilitiesSkip")}
        </Button>
        <Button
          type="button"
          onClick={handleCreateFacilities}
          disabled={creatingFacilities || platformFacilitiesLoading}
        >
          {creatingFacilities
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("resortFacilityGroup.creatingFacilities")}</>
            : selectedFacilityIds.size === 0
              ? t("resortFacilityGroup.addFacilitiesSkip")
              : t("resortFacilityGroup.addFacilitiesBtn", { count: selectedFacilityIds.size })
          }
        </Button>
      </div>
    </div>
  )
}
